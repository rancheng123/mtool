const electron = require('electron')
const os = require('os')
const execa = require('execa')
const platform = os.platform()
const path = require('path')
const app = electron.app
const unzip = require('extract-zip')

const logger = require('./logger')
const utils = require('./utils')


const sourcePath = path.resolve(app.getAppPath() + '/tools')
let destPath = path.resolve(app.getAppPath() + '/../tools')

const CTL = {
    unzip() {
        return new Promise((resolve, reject) => {
            if (platform === 'win32') {
                let file = 'nrcmd.zip'
                let zipFile = path.resolve(sourcePath, file)
                logger.info(`unzip file: ` + zipFile)

                unzip(zipFile, {
                    dir: destPath
                }, (err) => {
                    if (!err) {
                        logger.info('unzip nrcmd successs')
                        resolve()
                    } else {
                        logger.error('unzip nrcmd Fail: ' + err)
                        reject(new Error('unzip nrcmd error: ' + err.stack))
                    }
                })
            } else {
                resolve()
            }


        })
    },
    muteVolume(mute) {
        return new Promise((resolve, reject) => {
            let cmd = `osascript -e 'set volume ${mute ? 0 : 100}'`
            let cmdPath = utils.getUserHome()
            if (platform === 'win32') {
                // http://www.nirsoft.net/utils/nircmd.html
                cmd = `nircmd.exe mutesysvolume ${mute ? 1 : 0}`
                cmdPath = destPath
            }

            execa.shell(cmd, {
                cwd: cmdPath
            }).then((result) => {
                logger.info(`cmd: ${cmd} to set system valume OK`)
                resolve(result)
            }).catch(error => {
                logger.info(`cmd: ${cmd} to set system valume Fail ${error}`)
                resolve(error)

                throw error
            })
        })
    },
    muteMic(mute) {
        return new Promise((resolve, reject) => {
            let cmd = `osascript -e 'set volume input volume ${mute ? 0 : 100}'`
            let cmdPath = utils.getUserHome()

            if (platform === 'win32') {
                // http://www.nirsoft.net/utils/nircmd.html
                cmd = `nircmd.exe mutesubunitvolume ${mute ? 1 : 0}`
                cmdPath = destPath
            }
            execa.shell(cmd, {
                cwd: cmdPath
            }).then((result) => {
                logger.info(`cmd: ${cmd} to set microphone valume OK`)
                resolve(result)
            }).catch(error => {
                logger.info(`cmd: ${cmd} to set microphone valume Fail ${error}`)
                resolve(error)
            })
        })
    }
}

module.exports = {
    muteVolume() {
        CTL.muteVolume(true)
    },
    unMuteVolume() {
        CTL.muteVolume(false)
    },
    unpack() {
        CTL.unzip()
    }
}
