var path = require('path');
var mToolPath = path.resolve(__dirname,'..');
var packageJson = require( mToolPath +'/package.json');

var config = {
    appDir: mToolPath,
    out: mToolPath + '/dev-release/',
    icon: mToolPath + "/build/icon.ico",
    appName: packageJson.name,
    "platform":"win32",
    "arch":"x64",
}
module.exports = config;
