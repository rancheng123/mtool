// https://github.com/shelljs/shelljs
require('shelljs/global')
env.NODE_ENV = 'production'

var path = require('path')
var config = require('../config')
var ora = require('ora')
const fs = require('fs')
const moment = require('moment')
var webpack = require('webpack')
var webpackConfig = require('./webpack.prod.conf')

var spinner = ora('building for production...')
spinner.start()

rm('-rf', config.build.assetsRoot)
mkdir('-p', config.build.assetsRoot)
cp('-R', 'static/*', config.build.assetsRoot)


let str = fs.readFileSync(config.build.assetsRoot + '/package.json')

let pakg = JSON.parse(str)
let vs = pakg.version.split('.')
vs[2] = moment().format('DHm')
pakg.version = vs.join('.')
// fs.writeFileSync(config.build.assetsRoot + '/package.json', JSON.stringify(pakg))

webpack(webpackConfig, function(err, stats) {
    spinner.stop()
    if (err) throw err
    process.stdout.write(stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
    }) + '\n')
})
