const { BrowserWindow } = require('electron')
const logger = require('./logger')
const mainWindow = require('./main-window')

let _appUpdaterWin

function show(isModal) {
    if (!_appUpdaterWin) {
        createUpdaterWin(isModal)
    }

    mainWindow.getMainWin().show()
    _appUpdaterWin.show()
    return _appUpdaterWin
}

function createUpdaterWin(isModal) {
    _appUpdaterWin = new BrowserWindow({
        width: 720,
        height: 210,
        fullscreen: false,
        backgroundColor: '#44434C',
        resizable: false,
        closable: true,
        minimizable: true,
        fullscreenable: false,
        maximizable: false,
        show: false,
        center: true,
        skipTaskbar: false,
        title: '梦想加办公助手升级',
        frame: false,
        modal: isModal === 'modal',
        parent: isModal === 'modal' ? mainWindow.getMainWin() : null,
        icon: '../static/img/app-icon.png',
        webPreferences: {
            webSecurity: false
        }
    })

    _appUpdaterWin.setMenu(null)
    _appUpdaterWin.loadURL(`file://${__dirname}/../app-updater.html`)

    _appUpdaterWin.on('closed', () => {
        _appUpdaterWin = undefined
    })

    _appUpdaterWin.once('ready-to-show', () => {
        _appUpdaterWin.show()
    })

    // _appUpdaterWin.webContents.openDevTools({
    //     mode: 'detach'
    // })
}

module.exports = {
    show: show,
    getWindow: () => { return _appUpdaterWin }
}
