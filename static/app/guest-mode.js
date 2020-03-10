const path = require('path')
const logger = require('./logger')
const fs = require('fs')

let isGuest = false
let guestName = 'Mxj-Guest'

function checkIfGuestMode(appPath) {
    logger.info(`appPath: ${appPath}`)
    let guestFile = path.resolve(`${appPath}/../../../../.guest`)
    if (process.platform === 'win32') {
        guestFile = path.resolve(`${appPath}\\..\\..\\..\\.guest`)
    }

    let isGuestFileExist = true
    try {
        isGuestFileExist = fs.existsSync(path.resolve(`${guestFile}`))
    } catch (error) {
        logger.errorLocal(`error when check guest file: ${guestFile}`)
    }

    isGuest = isGuestFileExist
}

function isGuestMode() {
    return isGuest
}

module.exports = {
    checkIfGuestMode: checkIfGuestMode,
    isGuestMode: isGuestMode
}
