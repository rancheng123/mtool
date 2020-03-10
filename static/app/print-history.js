'use strict'
const fs = require('fs')
const nconfLib = require('nconf')
const utils = require('./utils')
const path = require('path')
const logger = require('./logger')

const confFileDir = utils.getUserHome() + '/.mxj-desktop'
const printDir = confFileDir + '/print'

var nconf = new nconfLib.Provider({file: getPrintDir() + '/print-history.json', type: 'file'})

function saveHistory(fileUUIDName, printInfo) {
    nconf.set(fileUUIDName, printInfo)
    nconf.save()
}

function getAllHistories() {
    nconf.load()
    return nconf.get()
}

function getHistory(fileUUIDName) {
    nconf.load()
    return nconf.get(fileUUIDName)
}

function delHistory(fileUUIDName) {
    nconf.load()
    nconf.clear(fileUUIDName)
    nconf.save()
}

function isFileExistOnDisk(fileUUIDName) {
    let filePath = path.resolve(printDir + '/' + fileUUIDName)
    let result = false
    try {
        result = fs.existsSync(filePath)
    } catch (error) {
        logger.error(`file ${filePath} not exist`)
    }

    return result
}

function getPrintDir() {
    try {
        fs.statSync(printDir)
    } catch (error) {
        if (error.toString().indexOf('no such file or directory') >= 0) {
            fs.mkdirSync(printDir)
        }
    }

    return printDir
}

module.exports = {
    saveHistory: saveHistory,
    getHistory: getHistory,
    delHistory: delHistory,
    getAllHistories: getAllHistories,
    isFileExistOnDisk: isFileExistOnDisk
}
