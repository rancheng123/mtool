'use strict'
const fs = require('fs')
const utils = require('./utils')
const confFileDir = utils.getUserHome() + '/.mxj-desktop'
const printDir = confFileDir + '/print'
// const logger = require('./logger')


class Config {

    constructor() {
        this.load()
    }
    set(key, value) {
        this.config[key] = value

        this.save()
    }
    get(key) {
        return this.config[key]
    }
    load() {
        this.file = getConfigDir() + '/mxj-desktop-app-config.json'
        // logger.info(`configration load file url ${this.file}`)
        if (!fs.existsSync(this.file)) {
            console.log('config file not exist')
            this.save()
        }
        let string = fs.readFileSync(this.file, 'utf8')
        this.config = {}

        try {
            let local = JSON.parse(string) || {}
            this.config = local
            // logger.info(`configration load file json ${JSON.stringify(this.config)}`)
        } catch (error) {
            // logger.error(`configration load error ${JSON.stringify(error)}`)
        }
    }
    remove(key) {
        delete this.config[key]
    }
    save() {
        fs.writeFileSync(this.file, JSON.stringify(this.config))
    }
}

let nconf = new Config()

function saveSettings(settingKey, settingValue) {
    if (settingKey) {
        nconf.set(settingKey, settingValue)
        nconf.save()
    }
}

function readSettings(settingKey) {
    nconf.load()
    return nconf.get(settingKey)
}

function removeSettings(settingKey, load) {
    if (load) {
        nconf.load()
    }
    nconf.remove(settingKey)
}

function getConfigDir() {
    try {
        fs.statSync(confFileDir)
    } catch (error) {
        console.log(typeof error + error.toString())
        if (error.toString().indexOf('no such file or directory') >= 0) {
            fs.mkdirSync(confFileDir)
        }
    }

    return confFileDir
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

function getSoUrl() {
    let smartOfficeDomain = readSettings('smartOfficeServerUrl')
    let smartOfficeUrl = `https://${smartOfficeDomain}`
    let isPrivateCloud = readSettings('privateCloud')

    if (isPrivateCloud) {
        smartOfficeUrl = `http://${smartOfficeDomain}`
    }

    return smartOfficeUrl
}

function getMeetingServiceUrl() {
    let meetingServiceDomain = readSettings('meetingServiceUrl')
    let meetingServiceUrl = `https://${meetingServiceDomain}`
    let isPrivateCloud = readSettings('privateCloud')

    if (isPrivateCloud) {
        meetingServiceUrl = `https://${meetingServiceDomain}`
    }

    return meetingServiceUrl
}

function getCnbServiceUrl() {
    let cnbServiceDomain = readSettings('cnbServiceUrl')
    let cnbServiceUrl = `https://${cnbServiceDomain}`
    let isPrivateCloud = readSettings('privateCloud')

    if (isPrivateCloud) {
        cnbServiceUrl = `http://${cnbServiceDomain}`
    }

    return cnbServiceUrl
}

module.exports = {
    getConfigDir: getConfigDir,
    getPrintDir: getPrintDir,
    saveSettings: saveSettings,
    readSettings: readSettings,
    removeSettings: removeSettings,
    getSoUrl: getSoUrl,
    getMeetingServiceUrl: getMeetingServiceUrl,
    getCnbServiceUrl: getCnbServiceUrl,
    save: () => {
        nconf.save()
    }
}
