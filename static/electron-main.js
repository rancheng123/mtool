'use strict'


console.log('node  :   '+process.versions.node)
console.log('electron  :   '+process.versions.electron)
console.log('modules  :   '+process.versions.modules)


const path = require('path')
const uuid = require('uuid')
const electron = require('electron')
const config = require('./app/configuration')
const IOT = require('./app/iot')
const utils = require('./app/utils')
const tray = require('./app/tray')
const logger = require('./app/logger')
const mainWindow = require('./app/main-window')
const autoStart = require('./app/auto-start')
const deviceCtl = require('./app/devicecontroll')
const networkChecker = require('./app/networkChecker')
const guestMode = require('./app/guest-mode')
const os = require('os')
const ChildProcess = require('child_process')
const VersionMigration = require('./app/version-migration')
const shell = electron.shell




VersionMigration.deleteWindowsUpdateJson()
VersionMigration.uninstallMToolInUserDir()
VersionMigration.launchctlForPrinterDriver()
VersionMigration.openPrinterClient()

const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})

const Menu = electron.Menu

const app = electron.app
const ipc = electron.ipcMain

const defaultSmartOfficeUrl = 'mxj360.com'
const defaultJanusServerUrl = 's.mxj360.com'

const defaultAutoStart = true





app.commandLine.appendSwitch('enable-win7-webrtc-hw-h264-decoding')

let quit = () => {
    app.quit()
}
const appMenuTpl = [{
    label: 'mTool pro',
    submenu: [{
        label: '关于',
        selector: 'orderFrontStandardAboutPanel:'
    },
    {
        type: 'separator'
    },
    {
        label: '退出',
        accelerator: 'Command+Q',
        click: quit
    }
    ]
}, {
    label: '编辑',
    submenu: [{
        label: '剪切',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:'
    },
    {
        label: '复制',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:'
    },
    {
        label: '粘贴',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:'
    },
    {
        label: '全选',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:'
    }
    ]
}]

process.on('uncaughtException', (error) => {
    logger.error('uncaughtException: ' + error)
    if (error) {
        logger.error(error.stack)
    }
})

var handleStartupEvent = () => {
    if (process.platform !== 'win32') {
        return false
    }
    const appFolder = path.resolve(process.execPath, '..')
    const rootAtomFolder = path.resolve(appFolder, '..')
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'))
    const exeName = path.basename(process.execPath)

    const spawn = (command, args) => {
        let spawnedProcess, error

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {
                detached: true
            })
        } catch (error) {
            logger.error('spawn error: ' + error)
        }

        return spawnedProcess
    }

    const spawnUpdate = (args) => {
        return spawn(updateDotExe, args)
    }

    // 记录程序启动参数
    logger.info('process argv.Len: ' + process.argv.length);
    // 记录内容
    for (let i = 1; i < process.argv.length; i++) {
        logger.info(`argv[${i}]:${process.argv[i]}`)
    }

    let squirrelCommand = process.argv[1]
    switch (squirrelCommand) {
        case '--squirrel-install':
        case '--squirrel-updated':

            // Optionally do things such as:
            //
            // - Install desktop and start menu shortcuts
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus

            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName])
            // Always quit when done
            setTimeout(app.quit, 2000)

            return true
        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName])
            // Always quit when done
            setTimeout(app.quit, 1000)

            return true
        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated
            app.quit()
            return true
    }
}

if (handleStartupEvent()) {
    return
}

logger.info('makes this application a Single Instance Application')
// makes this application a Single Instance Application
// const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
//     // Someone tried to run a second instance, we should focus our window.
//     let mainWin = mainWindow.getMainWin()
//     if (mainWin) {
//         if (mainWin.isMinimized()) mainWin.restore()
//         mainWin.focus()
//     }
// })
//
// if (shouldQuit) {
//     logger.info('already have an app instance, this instance should quit.')
//     app.quit()
// }
networkChecker.on(() => {
    let timer = setInterval(() => {
        if (networkChecker.connected) {
            if (IOT.checkConfig()) {
                config.saveSettings('iotStatus', 'ok')
                clearInterval(timer)
                mainWindow.getMainWin().webContents.send('iot-ok')
            }
        }
    }, 2000)
})
networkChecker.startCheck()

/* if (utils.isDevEnv()) {
    require('electron-reload')(__dirname, {
        // Note that the path to electron may vary according to the main file
        electron: require(`${__dirname}/../node_modules/.bin/electron`)
    });
} */

const MtoolUUID = config.readSettings('mtoolUUID')
// 每次启动mTool都重新生成uuid
logger.info('generate mtool uuid')
config.saveSettings('mtoolUUID', uuid.v4())

logger.info(`mtool uuid is: ${MtoolUUID}`)

let appPath = app.getAppPath()
guestMode.checkIfGuestMode(appPath)
logger.info(`is guest: ${guestMode.isGuestMode()}`)

app.on('ready', () => {
    // true 为qa，false 为正式
    IOT.fetchConfig(false).then(() => {
        if (!IOT.checkConfig()) {
            config.saveSettings('iotStatus', 'fail')
            utils.cleanUserInfo(config)
        } else {
            config.saveSettings('iotStatus', 'ok')
        }
        startApp()
    }).catch(error => {
        logger.errorLocal('get config from rs server error:' + error)
        if (!IOT.checkConfig()) {
            config.saveSettings('iotStatus', 'fail')
            utils.cleanUserInfo(config)
        }
        startApp()
    })
})

function startApp() {
    autoStart.check()
    logger.info(`app is ready~~! the NODE_ENV is ${process.env.NODE_ENV}`)
    const menu = Menu.buildFromTemplate(appMenuTpl)
    Menu.setApplicationMenu(menu)
    tray.getTray()

    const smartOfficeServerUrl = config.readSettings('smartOfficeServerUrl')
    const janusServerUrlUrl = config.readSettings('janusServerUrl')
    // const userInfo = config.readSettings('userInfo')
    // const userName = userInfo && userInfo.fullName

    if (!smartOfficeServerUrl) {
        config.saveSettings('smartOfficeServerUrl', defaultSmartOfficeUrl)
    }

    if (!janusServerUrlUrl) {
        config.saveSettings('janusServerUrl', defaultJanusServerUrl)
    }

    mainWindow.getMainWin().show()

    electron.powerMonitor.on('suspend', () => {
        logger.info('---------The system is going to sleep')
        networkChecker.stopCheck()
        // printer.unpublishService()
    })

    electron.powerMonitor.on('resume', () => {
        logger.info('---------The system is going to resume')
        networkChecker.startCheck()
        // printer.publishService(userInfo.login)
    })

    ipc.on('app-quit', () => {
        networkChecker.stopCheck()
        app.quit()
    })
}

deviceCtl.unpack()


app.on('window-all-closed', () => {
    // do not add this
    // app.quit()
})

app.on('activate', () => {
    mainWindow.getMainWin().show()
})

app.on('before-quit', () => { })

app.on('will-quit', () => { })

app.on('quit', () => {
    const osName = os.platform()
    const isMac = osName === 'darwin'

    if (isMac) {
        const darwinResourcesDir = path.resolve(app.getAppPath() + '/../extraResources/mac')
        logger.info('recoverDpi', `${darwinResourcesDir}/${process.arch}/resolution-cli reset`)
        ChildProcess.exec(`${darwinResourcesDir}/${process.arch}/resolution-cli reset`, (error, stdout, stderr) => {
            logger.info(`recoverDpi callback error:${JSON.stringify(error)} ` + ' stdout:' + stdout + ' stderr:' + stderr)
        })
    }

    logger.info('app quit ~~~!')
})
