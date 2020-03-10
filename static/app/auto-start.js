const utils = require('./utils')
const config = require('./configuration')
const AutoLaunch = require('auto-launch')
const Registry = require('winreg')
const logger = require('./logger')
const guestMode = require('./guest-mode')

const regKey = new Registry({
    hive: Registry.HKCU,
    key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
})

const mToolAutoLauncher = new AutoLaunch({
    name: 'mTool'
})

function enable() {
    if (guestMode.isGuestMode()) return

    mToolAutoLauncher.enable()
        .then(() => {
            return mToolAutoLauncher.isEnabled()
        })
        .then((isEnabled) => {
            if (isEnabled) {
                return
            }
            return mToolAutoLauncher.enable()
        })
        .catch((err) => {
            console.error('set auto start error: ')
            console.error(err)
        })
}

function disable() {
    if (guestMode.isGuestMode()) return
    mToolAutoLauncher.disable()
}

function check() {
    if (guestMode.isGuestMode()) return

    deleteOldWinAutoStartRegKey()

    let isAutoStartEnable = config.readSettings('isAutoStart')
    if (isAutoStartEnable === undefined) {
        isAutoStartEnable = true
        config.saveSettings('isAutoStart', true)
    }
    if (isAutoStartEnable) {
        enable()
    } else {
        disable()
    }
}

function deleteOldWinAutoStartRegKey() {
    if (guestMode.isGuestMode()) return
    if (process.platform === 'win32') {
        let regKeyName = 'Update.exe --processStart "mTool.exe"'
        regKey.valueExists(regKeyName, (err1, exist) => {
            if (err1) {
                logger.error(`find windows auto start regkey error`)
            } else if (exist) {
                regKey.remove(regKeyName, (err2) => {
                    logger.error(`delete windows auto start regkey error`)
                })
            }
        })
    }
}

module.exports = {
    enable: enable,
    disable: disable,
    check: check
}

