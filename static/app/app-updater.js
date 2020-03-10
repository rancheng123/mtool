const { app, dialog } = require('electron')
const { autoUpdater, CancellationToken } = require('electron-updater')
const appUpdaterWindow = require('./app-updater-window')
const mainWindow = require('./main-window')
const utils = require('./utils')
const logger = require('./logger')
const guestMode = require('./guest-mode')
const config = require('./configuration')
const MarkdownIt = require('markdown-it')

const md = new MarkdownIt()

// 3小时
const UPDATE_INTERVAL = 3 * 60 * 60 * 1000
const version = app.getVersion()
let _states = {}
_states.canPromptUpdateWindow = true
_states.isForceUpdate = false
_states.releaseNotesHtml = ''
_states.updateInfo = {}
_states.lastCheck = undefined
_states.isUpdateDownloaded = false
_states.isUserManuallyCheckUpdate = false
_states.isUpdateDownloading = false

let _cancellationToken

autoUpdater.autoDownload = false
const ISMAC = process.platform === 'darwin'
const dev = 'dev-releases'
const qa = 'qa-releases'
const stable = 'stable-releases'
if (ISMAC) {
    autoUpdater.setFeedURL(`http://qamtool.mxj360.com/${dev}/mac`)
} else {
    autoUpdater.setFeedURL(`http://qamtool.mxj360.com/${dev}/win`)
}


autoUpdater.on('error', (event, error) => {
    logger.error('Error: ' + error == null ? 'unknown' : (error.stack || error).toString())
    _states.isUpdateDownloading = false
    let updateWinidow = appUpdaterWindow.getWindow()
    updateWinidow && updateWinidow.webContents.send('update-error')
})

autoUpdater.on('update-available', (info) => {
    logger.info(`update available, info: ${JSON.stringify(info)}`)
    _states.updateInfo = info

    if (info && info.releaseNotes) {
        _states.releaseNotesHtml = md.render(info.releaseNotes)
        logger.info(`release notes: ${_states.releaseNotesHtml}`)
    }

    if (isForceUpdate(info.releaseNotes)) {
        _states.isForceUpdate = true
    }

    let ignoreUpdateVersion = config.readSettings('ignoreUpdateVersion')

    if (ignoreUpdateVersion === info.version && !_states.isUserManuallyCheckUpdate) {
        logger.info(`user already ignore this version update, no need to show update window`)
    } else if (_states.isForceUpdate && !_states.isUserManuallyCheckUpdate) {
        startDownloadUpdate()
    } else if (_states.isUserManuallyCheckUpdate) {
        logger.info(`manually check update, no need re-open the updater window`)
    } else {
        appUpdaterWindow.show()
    }

    let updateWindow = appUpdaterWindow.getWindow()
    logger.info('send update-available message to ui')
    updateWindow && updateWindow.webContents.send('update-available')
})

autoUpdater.on('update-not-available', () => {
    logger.info(`update-not-available`)
    let updateWindow = appUpdaterWindow.getWindow()
    updateWindow && updateWindow.webContents.send('update-not-available')
})

autoUpdater.on('download-progress', (progressObj) => {
    logger.info(`download-progress: ${progressObj.percent}%`)
    _states.isUpdateDownloading = true
    let updateWindow = appUpdaterWindow.getWindow()
    updateWindow && updateWindow.webContents.send('update-downloading-progress', progressObj)
})

autoUpdater.on('update-downloaded', () => {
    logger.info(`update-downloaded`)
    _states.isUpdateDownloading = false
    _states.isUpdateDownloaded = true
    if (_states.canPromptUpdateWindow && !_states.isUserManuallyCheckUpdate) {
        let windowStyle = _states.isForceUpdate ? 'modal' : ''
        appUpdaterWindow.show(windowStyle)
    }
    let updateWindow = appUpdaterWindow.getWindow()
    updateWindow && updateWindow.webContents.send('update-downloaded', _states)
})

let checkUpdateTask

// 初始化
function init() {
    if (guestMode.isGuestMode()) return
    if (utils.isDevEnv()) return

    checkForUpdates()
    if (checkUpdateTask) {
        clearInterval(checkUpdateTask)
        checkUpdateTask = undefined
    }

    // 一个小时检查一次更新
    checkUpdateTask = setInterval(() => {
        let now = Date.now()
        // 如果距离上一次检查更新大于2小时，才执行这次检查
        if (now - _states.lastCheck >= 2 * 60 * 60 * 1000) {
            checkForUpdates()
        }
    }, UPDATE_INTERVAL)
}

// 检查是否有更新
function checkForUpdates(fromUi) {
    if (guestMode.isGuestMode()) return
    logger.info(`check app updates, from ui: ${!!fromUi}`)
    _states.isUserManuallyCheckUpdate = fromUi
    _states.lastCheck = Date.now()
    if (_states.isUserManuallyCheckUpdate) {
        // 如果正在现在更新，不用检查更新
        if (!_states.isUpdateDownloading && !_states.isUpdateDownloaded) {
            _states.updateInfo = {}
            setTimeout(() => {
                autoUpdater.checkForUpdates()
            }, 1500)
        }
        appUpdaterWindow.show()
    } else {
        if (!_states.isUpdateDownloading && !_states.isUpdateDownloaded) {
            _states.updateInfo = {}
            autoUpdater.checkForUpdates()
        }
    }
}

// 是否强制更新
function isForceUpdate(releaseNotes) {
    if (releaseNotes) {
        return !!releaseNotes.match('--force-update: true--')
    }

    return false
}

// 下载更新
function startDownloadUpdate() {
    logger.info(`start to download update`)
    _states.isUpdateDownloading = true
    _cancellationToken = new CancellationToken()
    autoUpdater.downloadUpdate(_cancellationToken)
}

// 取消更新
function cancelDownload() {
    logger.info(`cancel download update`)
    _states.isUpdateDownloading = false
    if (_cancellationToken) {
        _cancellationToken.cancel()
        _cancellationToken.dispose()
        _cancellationToken = undefined
    }
}

// 重启安装更新
function quitAndInstall() {
    logger.info(`quit and install update`)
    let updateWindow = appUpdaterWindow.getWindow()
    let mainWin = mainWindow.getMainWin()
    updateWindow && updateWindow.close()
    mainWin && mainWin.close()
    autoUpdater.quitAndInstall()
}

function ignoreUpdate() {
    if (_states.updateInfo && _states.updateInfo.version) {
        logger.info(`user ignore update version: ${_states.updateInfo.version}`)
        config.saveSettings('ignoreUpdateVersion', _states.updateInfo.version)
    }
}

function setUpdateFlag(canPromptUpdateWindow) {
    logger.debug(`set update flag to ${canPromptUpdateWindow}`)
    _states.canPromptUpdateWindow = canPromptUpdateWindow
    if (canPromptUpdateWindow && _states.isUpdateDownloaded) {
        let windowStyle = _states.isForceUpdate ? 'modal' : ''
        appUpdaterWindow.show(windowStyle)
    }
}


module.exports = {
    version: () => { return version },
    checkForUpdates: checkForUpdates,
    getStates: () => { return _states },
    quitAndInstall: quitAndInstall,
    startDownloadUpdate: startDownloadUpdate,
    cancelDownload: cancelDownload,
    ignoreUpdate: ignoreUpdate,
    setUpdateFlag: setUpdateFlag,
    init: init
}
