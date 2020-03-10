
var path = require('path');
var mToolPath = path.resolve(__dirname,'..');

module.exports = {
    mToolPath: mToolPath,
    dir: mToolPath + '/',
    out: mToolPath + '/dev-release',
    zoomPath: mToolPath + '/zoom-sdk-electron-master',
    appName: 'mTool',
    platform: 'darwin',
    arch: 'x64',
    icon: mToolPath + '/build/icon.icns',
    //签名
    OsxSignOptions: {

    },

    electronPath: mToolPath + '/node_modules/electron/dist/Electron.app'
}
