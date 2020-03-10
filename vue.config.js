var path = require('path')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var myPlugin = require('./build-script/myPlugin')


var config = require('./config')

// vue.config.js
module.exports = {
    baseUrl: '',
    chainWebpack: config => {
        config.plugin('copy').tap(args => {
            args[0].push({
                from: path.resolve(__dirname, 'static/static'),
                to: path.resolve(__dirname, 'dist/static')
            })
            // args[0].push({
            //     from: path.resolve(__dirname, 'app-updater.html'),
            //     to: path.resolve(__dirname, 'dist')
            // })
            return args
        })
    },
    configureWebpack: {
        target: 'electron-renderer',
        resolve: {
            alias: {
                'src': path.resolve(__dirname, 'src'),
                'assets': path.resolve(__dirname, 'src/assets'),
                'components': path.resolve(__dirname, 'src/components'),
                'interface': path.resolve(__dirname, 'src/interfaces')
            }
        },
        module: {}
    },
    pages: {
        index: {
            entry: './src/Main.js',
            template: path.resolve(__dirname, './main.html'),
            filename: 'main.html'
        }
    }
}
