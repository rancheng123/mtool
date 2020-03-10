const electron = require('electron')
const mainWin = require('./main-window')
const config = require('./configuration')
const logger = require('./logger');

require('./debug');


const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})

let prefix = 'http://update.mxj360.com/rest/devices/'

function validateCode(code) {
    const uri = `${prefix}/mtool/validate_code?activeCode=${code}`
    let rsValidateCodeOpts = {
        uri,
        method: 'GET',
        json: true,
        transform: function (body, response, resolveWithFullResponse) {
            if (response.statusCode === 200) {
                logger.info(`validate_code ${code}: ${JSON.stringify(response.body)}`)
                return response.body
            } else {
                logger.error(`validate_code: ${code}` + response.statusCode)
                return null
            }
        }
    }
    return rp(rsValidateCodeOpts)
}

function fetchConfig(useQa) {
    let rsServerMToolApi = ''
    if (useQa) {
        prefix = 'http://qaiotbackend.mxj.mx/rest/devices/'
    }
    rsServerMToolApi = `${prefix}mtool/config`
    const uuid = config.readSettings('mtoolUUID')
    const activeCode = config.readSettings('activeCode') || ''

    let mToolRsConfigRequestOpts = {
        uri: rsServerMToolApi,
        method: 'POST',
        json: true,
        form: {
            uuid: uuid,
            activeCode
        },
        transform: function (body, response, resolveWithFullResponse) {
            if (response.statusCode === 200) {
                return response.body
            } else {
                logger.error('get mtool config from server failed, status code: ' + response.statusCode)
                return null
            }
        }
    }

    return rp(mToolRsConfigRequestOpts).then((mToolConfig) => {
        console.log(mToolConfig);
        if (mToolConfig) {
            config.saveSettings('smartOfficeServerUrl', mToolConfig.smartOfficeUrl)
            config.saveSettings('agle', mToolConfig.agle)
            config.saveSettings('janusServerUrl', mToolConfig.janusUrl)
            config.saveSettings('agoraId', mToolConfig.agoraAppID)
            config.saveSettings('meetingServiceUrl', mToolConfig.meetingServiceUrl)
            config.saveSettings('meetingMqttDomain', mToolConfig.meetingMqttDomain)
            config.saveSettings('privateCloud', mToolConfig.privateCloud)
            config.saveSettings('mToolVideoResolution', mToolConfig.mToolVideoResolution)
            config.saveSettings('cnbServiceUrl', mToolConfig.cnb)
            config.saveSettings('activeCode', activeCode || mToolConfig.activeCode)
            config.saveSettings('hasPrinter', mToolConfig.hasPrinter)
            config.saveSettings('supportPrinters', mToolConfig.supportPrinters)
            logger.info(mToolConfig)
            console.log(mToolConfig, 111)
            mainWin.getMainWin().webContents.send('fetch-config-success', mToolConfig)
        }
        return mToolConfig
    })
}

function checkConfig() {
    let agoraId = config.readSettings('agoraId')
    let meetingURL = config.readSettings('meetingServiceUrl')
    let meetingMqtt = config.readSettings('meetingMqttDomain')

    return !!(agoraId && meetingURL && meetingMqtt)
}

module.exports = {
    fetchConfig: fetchConfig,
    checkConfig: checkConfig,
    validateCode: validateCode
}
