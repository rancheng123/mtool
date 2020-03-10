const fs = require('fs')
const path = require('path')
const utils = require('./utils')
const logger = require('./logger')
const config = require('./configuration')

module.exports = {
    getFilePath() {
        let file = '/config/config.json'
        let soUrl = config.readSettings('smartOfficeServerUrl')

        if (process.env.USEQA || soUrl === 'qaso.mxj.mx') {
            file = '/config/config.qa.json'
        }
        return path.resolve(__dirname + file)
    },
    getConfig() {
        let confstr = fs.readFileSync(this.getFilePath())
        let conf = JSON.parse(confstr)
        logger.info(`connect config ${conf.mqtt.url} ${conf.meetingServer.url}`)
        return conf
    }
}
