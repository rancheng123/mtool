'use strict'

const path = require('path')
const electron = require('electron')
const utils = require('./utils')
const mainWin = require('./main-window')

const ipc = electron.ipcMain

const BrowserWindow = electron.BrowserWindow

let selectScreenWin = null

function getSelectScreenWin() {
    if (!selectScreenWin) {
        createSelectScreenWin()
    }

    return selectScreenWin
}

function createSelectScreenWin() {
    let width = 800
    let height = 600

    selectScreenWin = new BrowserWindow({
        width: width,
        height: height,
        fullscreen: false,
        backgroundColor: '#ffffff',
        title: '梦想加办公助手',
        show: true,
        frame: false,
        resizable: false,
        skipTaskbar: true
    })

    if (utils.isDevEnv()) {
        // 打开调试窗口
        selectScreenWin.webContents.openDevTools()
    }

    selectScreenWin.webContents.on('new-window', function(event, urlToOpen) {
        event.defaultPrevented = true
    })

    selectScreenWin.once('ready-to-show', () => {
        selectScreenWin.show()
    })

    selectScreenWin.on('show', () => {
        selectScreenWin.webContents.send('refresh-screen-sources')
    })

    selectScreenWin.loadURL('file://' + __dirname + '/../select-screen.html')

    ipc.on('close-select-screen-window', function() {
        if (selectScreenWin) {
            selectScreenWin.hide()
        }
    })

    ipc.on('confirm-select-screen', function(event, arg) {
        mainWin.getMainWin().webContents.send('confirm-select-screen', arg)
    })

}

exports.getSelectScreenWin = getSelectScreenWin
