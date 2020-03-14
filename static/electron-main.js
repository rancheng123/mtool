'use strict'


console.log('node  :   '+process.versions.node)
console.log('electron  :   '+process.versions.electron)
console.log('modules  :   '+process.versions.modules)


const electron = require('electron')
const app = electron.app

app.on('ready', () => {
    var mainWin = new electron.BrowserWindow({
        width: 960,
        height: 570,
        minWidth: 960,
        minHeight: 570,
        fullscreen: false,
        backgroundColor: '#44434C',
        resizable: true,
        minimizable: true,
        fullscreenable: true,
        maximizable: true,
        show: false,
        center: true,
        skipTaskbar: true,
        title: '梦想加办公助手',
        frame: false,
        icon: '../static/img/app-icon.png',
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
        }
    })

    mainWin.loadURL('http://news.baidu.com/');
    mainWin.show()
})




