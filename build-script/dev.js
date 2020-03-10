// https://github.com/shelljs/shelljs
require('shelljs/global')
// env.NODE_ENV = 'development'

// var path = require('path')
var config = require('../config')
var ora = require('ora')
// var webpack = require('webpack')
// var webpackConfig = require('./webpack.dev.conf')

var spinner = ora('building for development...')
spinner.start()

// rm('-rf', config.dev.assetsRoot)
// mkdir('-p', config.dev.assetsRoot)
cp('-R', 'static/*', config.dev.assetsRoot)
spinner.stop()
// webpack(webpackConfig, function (err, stats) {
//     spinner.stop()
//     if (err) throw err
//     process.stdout.write(stats.toString({
//             colors: true,
//             modules: false,
//             children: false,
//             chunks: false,
//             chunkModules: false
//         }) + '\n')
// })
