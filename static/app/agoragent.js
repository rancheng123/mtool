const electron = require('electron')
const shell = electron.shell
const exec = require('child_process').exec
const os = require('os')
const Promise = require('bluebird')
const platform = os.platform()
const path = require('path')
const unzip = require('extract-zip')
const fs = require('fs')

const ipcMain = require('electron').ipcMain
const ipcRenderer = require('electron').ipcRenderer

const logger = require('./logger')
const utils = require('./utils')
const config = require('./configuration')

let util = {
    checkProccess() {
        return new Promise((resolve, reject) => {
            let cmd = `ps -ax | grep 'AgoraWebAgent'`
            if (platform === 'win32') {
                cmd = 'tasklist /fi "imagename eq AgoraWebAgent.exe"'
            }
            exec(cmd, (error, stdout, stderr) => {
                let message = `check agoraWebAgent process exist:  `
                if (error) {
                    console.log(error)

                }

                let exist = false
                if (platform !== 'win32') {
                    let ar = stdout.split('\n')
                    ar.forEach((r) => {
                        if (r && r.indexOf(`/bin/sh`) === -1 && r.indexOf('grep') === -1) {
                            exist = true
                        }
                    })
                    console.log(ar)
                } else {
                    console.log(stdout)
                    exist = stdout.indexOf('AgoraWebAgent.exe') > -1
                }

                message += exist ? 'Found' : 'No Found'
                logger.info(message)
                resolve({
                    status: exist
                })
            })
        })
    },
    checkPortUsed() {
        return new Promise((resolve, reject) => {
            let cmd = `netstat -an | grep "8922"`
            if (platform === 'win32') {
                cmd = 'netstat -an | find "8922"'
            }
            exec(cmd, (error, stdout, stderr) => {
                let message = `check agoraWebAgent port 8922 `
                if (error) {
                    console.log(error)
                }
                logger.info(message)

                let exist = stdout.indexOf('8922') > -1
                message += exist ? ' used' : 'not used'
                logger.info(message)
                resolve({
                    status: exist
                })
            })
        })
    }
}
const app = electron.app

let sourcePath = path.resolve(app.getAppPath() + '/agora')
let destPath = path.resolve(app.getAppPath() + '/../agora')

if (platform === 'darwin') {
    destPath = utils.getUserHome() + '/Library/agora'
}

let agoraUtil = {
    checking(n) {
        return Promise.delay(300).then(() => {

            if (n === 0) {
                return {
                    status: false
                }
            }
            let num = n || 10
            return agoraUtil.checkAgentStatus().then((res) => {
                if (res.status) {
                    return res
                } else {
                    return agoraUtil.checking(num - 1)
                }
            })
        })
    },
    checkAgentStatus() {
        return new Promise((resolve, reject) => {
            util.checkProccess().then(r => {
                if (!r.status) {
                    resolve({
                        status: false
                    })
                } else {
                    util.checkPortUsed().then(re => {
                        resolve(re)
                    })
                }
            })
        })
    },
    startAgent() {
        return new Promise((resolve, reject) => {
            let file = '/AgoraWebAgent.app'
            if (platform === 'win32') {
                file = '/win/AgoraWebAgent.exe'
            }
            let pathstr = path.resolve(destPath + file)
            console.log(destPath, pathstr)
            let url = 'file://' + pathstr
            shell.openExternal(url, {}, (err) => {
                let message = `start agoraWebAgent use file ${url},`
                if (err) {
                    message += 'Fail ' + err + ' URL is:' + url
                } else {
                    message += 'OK'
                }
                logger.info(message)
                resolve(err)
            })
        })
    },

    reset() {
        return new Promise((resolve, reject) => {
            this.stopAgent().then(() => {
                this.startAgent().then((err) => {
                    resolve(err)
                })
            })
        })
    },
    stopAgent() {
        return new Promise((resolve, reject) => {
            let cmd = 'pkill AgoraWebAgent'
            if (platform === 'win32') {
                cmd = 'taskkill /f /im AgoraWebAgent.exe'
            }
            exec(cmd, (err, stdout, stderr) => {
                let message = `stop agoraWebAgent use: ${cmd}`
                if (err) {
                    message += 'Fail ' + err
                } else {
                    message += 'OK'
                }
                logger.info(message)
                resolve(err)
            })
        })

    },
    unzip() {
        let zipfile = 'AgoraWebAgent.app.zip'
        if (platform === 'win32') {
            zipfile = 'AgoraWebAgent.exe.zip'
        }
        return new Promise((resolve, reject) => {
            let zipFile = path.resolve(sourcePath, zipfile)
            logger.info(`unzip file: ` + zipFile)

            unzip(zipFile, {
                dir: destPath
            }, (err) => {
                if (!err) {
                    logger.info('unzip AgoraWebAgent successs')
                    resolve()
                } else {
                    logger.error('unzip AgoraWebAgent Fail: ' + err)
                    reject(new Error('unzip AgoraWebAgent error: ' + err.stack))
                }
            })

        })
    }
}

let agoraManager = {
    unpack() {
        agoraUtil.unzip()
    },

    tryReset() {
        return agoraUtil.reset().then(() => {
            return agoraUtil.checking().then(res => {
                console.log(res)
                if (res.status) {
                    return res
                } else {
                    return agoraManager.tryReset()
                }
            })
        })
    },
    init(mainWin) {
        ipcMain.on('reset-agent', () => {
            agoraUtil.reset().then(() => {
                agoraUtil.checking().then(res => {
                    console.log(res)
                    if (res.status) {
                        setTimeout(() => {
                            mainWin.webContents.send('reset-agent-status', res)
                        }, 200)
                    } else {
                        ipcRenderer.send('reset-agent')
                    }

                })
            })
        })

        ipcMain.on('stop-agent', () => {
            agoraUtil.stopAgent().then((err) => {
                mainWin.webContents.send('stop-agent-status', {
                    status: !err,
                    err
                })
            })
        })
    },
    stopAgent() {
        agoraUtil.stopAgent()
    },
    getAppID() {
        let ids = ['6d7e4c2cdb9e48bb985d1ec71ca9daf3', '6ff03d1dfd694ccfb47ef1bd7a1dfc17', 'dc63f1d0b31a492fba0c85da83f96d5c']

        let id = config.readSettings('agoraId')
        return id
    }
}


module.exports = agoraManager
