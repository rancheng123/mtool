'use strict'
const sso = require('./sso')
const path = require('path')
const electron = require('electron')
const config = require('./configuration')
const utils = require('./utils')
const tray = require('./tray')
const printer = require('./printer')
const logger = require('./logger')
const appUpdater = require('./app-updater')
const autoStart = require('./auto-start')
const selectScreenWin = require('./select-screen-window')
const deviceTool = require('./devicecontroll')
const MQTT = require('./mqmessage')
const execa = require('execa')
const ipc = electron.ipcMain
const app = electron.app
const os = require('os')
const BrowserWindow = electron.BrowserWindow
const dialog = electron.dialog
const child_process = require('child_process')
const appPath = app.getAppPath()
const appDir = appPath.endsWith('asar') ? path.parse(appPath).dir : appPath
const resolutionCliPath = appPath.endsWith('asar') ? `${appDir}/static/resolution-cli` : `${appDir}/static/mac/x64/resolution-cli`
let mainWin = null
const darwinResourcesDir = path.resolve(app.getAppPath() + '/../extraResources/mac')
const winResourcesDir = path.resolve(app.getAppPath() + '/../extraResources/win')

// 是否开启自动升级
const AUTOUPDATE = true
// 是否开启手动升级
const CLICKUPDATE = true

function getMainWin() {
    if (!mainWin) {
        createMainWin()
    }

    return mainWin
}

function createMainWin() {
    mainWin = new BrowserWindow({
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

    //if (utils.isDevEnv()) {
        // 打开调试窗口
        mainWin.webContents.openDevTools({
            mode: 'detach'
        })
    //}

    //切换调试窗口
    ipc.on('switchDebug', function (event, isDebug) {
        if(isDebug){
            // 打开调试窗口
            mainWin.webContents.openDevTools({
                mode: 'detach'
            })
        }else{
            // 打开调试窗口
            mainWin.webContents.closeDevTools()
        }

    })



    logger.info('init app updater....')
    AUTOUPDATE && appUpdater.init()

    mainWin.webContents.on('new-window', function (event, urlToOpen) {
        event.defaultPrevented = true

    })


    mainWin.once('ready-to-show', () => {
        mainWin.show()
    })


    // var path = require('path');
    // var src_path = path.resolve(__dirname, '../../dist/main.html');
    //
    //
    // debugger
    // console.log(11111111111111)
    // console.log(src_path)


    //mainWin.loadURL('file://' + __dirname + '/../main.html')
    mainWin.loadURL('file://' + path.resolve(__dirname, '../../dist/main.html'))

    mainWin.on('show', function () {
        if (process.platform === 'darwin') {
            // app.dock.hide()
            // app.dock.setIcon('../static/img/app-icon.png')
        }

        if (process.platform === 'darwin' && config.readSettings('userInfo')) {
            // tray.getTray().setHighlightMode('always')
            // let bounds = tray.getTray().getBounds()
            // mainWin.setPosition(bounds.x - (mainWin.getBounds().width / 2), 0)
        }
    })

    mainWin.webContents.on('crashed', (event, isKilled) => {
        MQTT.close()
        if (isKilled) {
            logger.info(`webview is killed`)
        } else {
            logger.error(`webview is crashed`)
            dialog.showMessageBox(mainWin, {
                type: 'error',
                message: '系统内存不足',
                detail: '如需流畅运行“视频会议服务”，请确保至少2GB可用内存！'
            }, () => {
                mainWin.webContents.reload()
            })
        }
    })

    mainWin.on('unresponsive', function () {
        let userInfo = config.readSettings('userInfo')
        let userName = userInfo ? userInfo.fullName : 'unknow'
        logger.warn(`${userName} window unresponsive`)
    })

    ipc.on('login', function (event, param) {
        login(param.userName, param.password, param.routerPath)
    })
    ipc.on('disable-gpu', () => {
        const osName = os.platform()
        if (osName === 'win32') {
            logger.info(`disable-gpu`)
            app.disableHardwareAcceleration()
        }
    })
    ipc.on('closeAero', () => {
        // 如果是win就调用AeroControl.exe
        const osName = os.platform()
        if (osName === 'win32') {
            logger.info(`closeAero win32 processing`)
            child_process.exec(`${winResourcesDir}/${process.arch}/AeroControl.exe`, (error, stdout, stderr) => {
                logger.info(`closeAero callback error:${JSON.stringify(error)} ` + ' stdout:' + stdout + ' stderr:' + stderr)
            })
        } else {
            logger.info(`closeAero darwin do nothing`)
        }
    })
    ipc.on('renderer-command', (event, arg) => {
        logger.info(`renderer-command:${arg}`)
        const osName = os.platform()
        const isMac = osName === 'darwin'

        if (arg.command === 'recoverDpi' && isMac) {
            logger.info(`recoverDpi`)
            child_process.exec(`${darwinResourcesDir}/${process.arch}/resolution-cli reset`)
        } else if (arg.command === 'changeDpi' && isMac) {
            logger.info(`changeDpi`)
            child_process.exec(`${darwinResourcesDir}/${process.arch}/resolution-cli set`)
        }
    })
    ipc.on('logout', function () {
        logger.info(`ipc logout`)
        utils.cleanUserInfo(config)
        mainWin.webContents.send('redirect-vue-router', '/')
    })

    ipc.on('auth-expired', function (event, param) {
        utils.cleanUserInfo(config)
        mainWin.show()
        dialog.showMessageBox(mainWin, {
            title: '登录信息已经过期',
            message: '登录信息已经过期，请重新登录',
            buttons: ['好的'],
            icon: electron.nativeImage.createFromPath(path.join(__dirname, '../static/img/app-icon.png')),
            defaultId: 0
        }, function (btnIdx) {
            if (btnIdx === 0) {
                logger.info('login expired, we will relaunch this app.')
                app.relaunch()
                app.exit(0)
            }
        })
    })

    ipc.on('auth-expired-no-alert', function () {
        utils.cleanUserInfo(config)
        mainWin.webContents.send('redirect-vue-router', '/')
        mainWin.setSize(350, 460)
        mainWin.setResizable(false)
        mainWin.center()
        mainWin.show()
    })

    ipc.on('intent-to-print', function (event, param) { })

    ipc.on('sns-login', function (event, param) {
        login(param.wxuid, undefined, param.routerPath, true, param)
    })

    ipc.on('save-config', function (event, param) {
        logger.info(`save config: ${JSON.stringify(param)}`)

        let oldSmartOfficeUrl = config.readSettings('smartOfficeServerUrl')
        let oldJanusUrl = config.readSettings('janusServerUrl')

        config.saveSettings('isAutoStart', param.isAutoStart)
        autoStart.check()
        // config.saveSettings('janusServerUrl', param.janusServerUrl)
        // config.saveSettings('smartOfficeServerUrl', param.smartOfficeServerUrl)
        // config.saveSettings('activeCode', param.activeCode)

        let isSmartOfficeUrlChanged = (oldSmartOfficeUrl !== param.smartOfficeServerUrl)
        let isJanusUrlChanged = (oldJanusUrl !== param.janusServerUrl)

        if (isSmartOfficeUrlChanged || isJanusUrlChanged) {
            mainWin.reload(true)
        } else {
            let routeParam = param.fromRouterPath
            if (routeParam === '/') {
                mainWin.reload(true)
            } else {
                mainWin.webContents.send('save-config-finished', routeParam)
            }
        }
    })

    ipc.on('open-select-screen-window', function () {
        selectScreenWin.getSelectScreenWin().show()
    })

    ipc.on('check-app-update-from-ui', function () {
        CLICKUPDATE && appUpdater.checkForUpdates(true)
    })

}

function login(userName, password, routerPath, isSns, param) {
    const smartOfficeUrl = config.getSoUrl()
    logger.info(`start to login to: ${smartOfficeUrl}`)

    let loginPromise = null

    if (isSns) {
        logger.info('weixin sns login ......')
        loginPromise = sso.loginWeixin(smartOfficeUrl, userName, param)
    } else {
        logger.info('username password login ......')
        loginPromise = sso.login(smartOfficeUrl, userName, password)
    }

    loginPromise.then(function (result) {
        config.saveSettings('authToken', result.authToken)
        return sso.getUserInfo(smartOfficeUrl, result.authToken)
    }).then(function (userInfo) {
        config.saveSettings('userInfo', userInfo)
        config.saveSettings('login', {
            'id': userName,
            'auth': password
        })
        console.log(JSON.stringify(userInfo))
        mainWin.webContents.send('login-success', {
            routerPath: routerPath,
            userInfo: userInfo
        })
    }).catch(function (error) {
        logger.error('login error: ' + error)
        mainWin.webContents.send('login-failed', {
            qrcode: !!isSns
        })
    })
}

exports.getMainWin = getMainWin
