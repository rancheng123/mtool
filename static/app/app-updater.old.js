const electron = require('electron')
const os = require('os')
const path = require('path')
const utils = require('./utils')
const logger = require('./logger')
const Promise = require('bluebird')
const rp = require('request-promise')

const app = electron.app
const dialog = electron.dialog
const autoUpdater = electron.autoUpdater

const UPDATE_SERVER_HOST = 'release.aws.mxj.mx'
const platform = os.platform()
const version = app.getVersion()
const darwinFeedUrl = `http://${UPDATE_SERVER_HOST}/update/${platform}_${os.arch()}/${version}`
const win32FeedUrl = `http://${UPDATE_SERVER_HOST}/update/${platform}_${os.arch()}/${version}`

console.log('update:', darwinFeedUrl);
let _mainWin

let canUpdate = true

function init(mainWin) {
    _mainWin = mainWin
    if (utils.isDevEnv()) {
        logger.info('is dev env, autoUpdater cancle')
        return
    }

    if (platform === 'linux') {
        return
    }

    autoUpdater.addListener('update-available', function (event) {
        logger.info('A new update is available: ' + JSON.stringify(event))
    })
    autoUpdater.addListener('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateURL) {
        logger.info('update-downloaded...')
        autoUpdater.quitAndInstall()
    })

    autoUpdater.addListener('error', function (error) {
        logger.error(`auto update error: ${error}` + error.stack)
        dialog.showMessageBox(_mainWin, {
            type: 'info',
            message: '升级出错，请稍后重试',
            buttons: ['好的']
        })
        _mainWin.send('stop-update-app')
    })
    autoUpdater.addListener('checking-for-update', function (event) {
        logger.info('checking-for-update...' + JSON.stringify(event))
    })
    autoUpdater.addListener('update-not-available', function () {
        logger.info('update-not-available')
    })

    if (platform === 'darwin') {
        logger.info(`set darwin auto update feed url: ${darwinFeedUrl}`)
        autoUpdater.setFeedURL(darwinFeedUrl)
    } else if (platform === 'win32') {
        logger.info(`set darwin auto update feed url: ${win32FeedUrl}`)

        autoUpdater.setFeedURL(win32FeedUrl)
    }

    _mainWin.webContents.once('did-finish-load', function (event) {
        logger.info('mainWin webContents did finish load')
        checkUpdateAndPrompt(true)
        setInterval(function () {
            logger.info(`canUpdate:${canUpdate}`)
            if (canUpdate) {
                checkUpdateAndPrompt(false)
            }
        }, 60 * 60 * 1000)
    })
}

function checkUpdateAndPrompt(needPrompt) {
    logger.info('checking app updates ...')
    checkForUpdates().then(function (result) {
        promptHasUpdate(result, needPrompt)
    }).catch(function (error) {
        logger.error('checking app update error: ' + error)
    })
}

function promptHasUpdate(result, needPrompt) {
    if (result.hasUpdate && result.forceUpdate) {
        /*
        dialog.showMessageBox(_mainWin, {
            title: '发现新版本',
            message: '发现新版本，此版本为关键升级，将直接升级到新版本',
            buttons: ['好的'],
            icon: electron.nativeImage.createFromPath(path.join(__dirname, '../static/img/app-icon.png')),
            defaultId: 0
        }, function(btnIdx) {
            logger.info(`btn ${btnIdx} selected. will update app`)
            startUpdate()
        })
        */
        logger.info(`is force update version, update direct`)
        startUpdate()
    } else if (result.hasUpdate && needPrompt) {
        dialog.showMessageBox(_mainWin, {
            title: '发现新版本',
            message: '发现新版本，是否升级？',
            buttons: ['暂不升级', '是的,升级'],
            icon: electron.nativeImage.createFromPath(path.join(__dirname, '../static/img/app-icon.png')),
            defaultId: 1,
            cancelId: 0
        }, function (btnIdx) {
            if (btnIdx === 1) {
                logger.info(`btn ${btnIdx} selected. will update app`)
                startUpdate()
            }
        })
    }
}

function startUpdate() {
    let autoUpdateFeedUrl = autoUpdater.getFeedURL().trim()
    logger.info(`auto updater feed url is: ${autoUpdateFeedUrl}`)
    if (autoUpdateFeedUrl) {
        logger.info('start app updates...')
        _mainWin.show()
        _mainWin.webContents.send('start-update-app')
        autoUpdater.checkForUpdates()
    }
}


function checkForUpdates() {
    if (utils.isDevEnv()) {
        logger.info('is dev env, cancle check update')
        return Promise.resolve({})
    }

    if (platform === 'darwin') {
        return checkForUpdatesMac()
    } else if (platform === 'win32') {
        return checkForUpdatesWin()
    }
}

function checkForUpdatesMac() {

    let rpOpts = {
        uri: darwinFeedUrl,
        method: 'GET',
        json: true,
        transform: function (body, response, resolveWithFullResponse) {
            if (response.statusCode === 200) {
                let version = body.name
                let matchResult = version.match(/\d+\.\d+\.\d+/)
                let forceUpdate = false
                if (matchResult && matchResult.length > 0) {
                    let newVersionParts = matchResult[0].split('.')
                    let localVersionParts = app.getVersion().split('.')
                    if (Number(newVersionParts[0]) > Number(localVersionParts[0]) ||
                        Number(newVersionParts[1]) > Number(localVersionParts[1])) {
                        forceUpdate = true
                    }
                }
                return {
                    hasUpdate: true,
                    forceUpdate: forceUpdate
                }
            } else {
                return {
                    hasUpdate: false,
                    forceUpdate: false
                }
            }
        }
    }

    logger.info(`checking update from url ${darwinFeedUrl}`)
    return rp(rpOpts)
}

function checkForUpdatesWin() {
    const platform = os.platform()
    const version = app.getVersion()

    let rpOpts = {
        uri: win32FeedUrl + '/RELEASES',
        method: 'GET',
        transform: function (body, response, resolveWithFullResponse) {
            if (response.statusCode === 200) {
                logger.debug(response.body)
                if (response.body.match(`-${version}-full(-x64|-i32)*.nupkg`)) {
                    return {
                        hasUpdate: false,
                        forceUpdate: false
                    }
                } else {
                    let matchResult = response.body.match(/\d+\.\d+\.\d+/)
                    let forceUpdate = false
                    if (matchResult && matchResult.length > 0) {
                        let newVersionParts = matchResult[0].split('.')
                        let localVersionParts = app.getVersion().split('.')
                        if (Number(newVersionParts[0]) > Number(localVersionParts[0]) ||
                            Number(newVersionParts[1]) > Number(localVersionParts[1])) {
                            forceUpdate = true
                        }
                    }
                    return {
                        hasUpdate: true,
                        forceUpdate: forceUpdate
                    }
                }
            } else {
                return {
                    hasUpdate: false,
                    forceUpdate: false
                }
            }
        }
    }

    logger.info(`checking update from url ${win32FeedUrl}`)
    return rp(rpOpts)
}

function setUpateFlag(flag) {
    canUpdate = flag
}

module.exports = {
    init: init,
    checkForUpdates: checkForUpdates,
    promptHasUpdate: promptHasUpdate,
    startUpdate: startUpdate,
    setUpateFlag: setUpateFlag,
    version: () => {
        return version
    }
}
