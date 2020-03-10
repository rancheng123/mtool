const log = require('electron-log')
const url = require('url');
log.transports.file.level = 'silly'
log.transports.file.maxSize = 5 * 1024 * 1024
const { spawn } = require('child_process');
const config = require('./configuration.js')
const _ = require('lodash')
const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})
const rpErrors = require('request-promise/errors')

function logError(errMsg) {
    log.error(errMsg)

    let userInfo = config.readSettings('userInfo')

    if (userInfo && userInfo.fullNameForChinese) {

        let requestBody = {
            log: errMsg,
            userName: userInfo.fullNameForChinese,
            createTime: Date.now()
        }
        let loggerReqOpts = {
            method: 'POST',
            uri: 'http://elk.mxj360.com:19200/mtool_error_logs/log',
            body: requestBody,
            json: true,
            transform: (body, response, resolveWithFullResponse) => {
                if (response.statusCode === 201 && response.body) {
                    return response.body
                } else {
                    throw new Error('send error log to server failed, status code: ' + response.statusCode)
                }
            }
        }

        rp(loggerReqOpts).catch((err) => {
            log.error(`send error log to elk error: ${err}`)
        })
    }
}


function logAgle(msg) {
    let userInfo = config.readSettings('userInfo')

    if (userInfo && userInfo.fullNameForChinese) {

        let requestBody = {
            Source: 'mTool',
            UserName: userInfo.fullNameForChinese,
            createTime: Date.now()
        }
        requestBody = _.merge(requestBody, msg)
        console.log(`requestBody ${JSON.stringify(requestBody)}`)
        let loggerReqOpts = {
            method: 'POST',
            uri: 'http://elk.mxj360.com:19200/agle_mxj_sdk_analysis/device',
            body: requestBody,
            json: true,
            transform: (body, response, resolveWithFullResponse) => {
                if (response.statusCode === 201 && response.body) {
                    return response.body
                } else {
                    throw new Error('send error log to server failed, status code: ' + response.statusCode)
                }
            }
        }

        rp(loggerReqOpts).catch((err) => {
            log.error(`send error log to elk error: ${err}`)
        })
    }
}
function logShareScreen(msg) {
    let userInfo = config.readSettings('userInfo')

    if (userInfo && userInfo.fullNameForChinese) {

        let requestBody = {
            Source: 'mTool',
            UserName: userInfo.fullNameForChinese,
            FailedConnect: 0,
            FailedInvite: 0,
            FailedConfig: 0,
            Succcess: 0,
            Start: 0,
            createTime: Date.now()
        }
        requestBody = _.merge(requestBody, msg)
        console.log(`requestBody ${JSON.stringify(requestBody)}`)
        let loggerReqOpts = {
            method: 'POST',
            uri: 'http://elk.mxj360.com:19200/mtool_sharescreen/data',
            body: requestBody,
            json: true,
            transform: (body, response, resolveWithFullResponse) => {
                if (response.statusCode === 201 && response.body) {
                    return response.body
                } else {
                    throw new Error('send error log to server failed, status code: ' + response.statusCode)
                }
            }
        }

        rp(loggerReqOpts).catch((err) => {
            log.error(`send error log to elk error: ${err}`)
        })
    }
}

function lognet(_url, callback) {
    const myURL =
        url.parse(_url);
    const pp = spawn('ping', ['-c', '10', '-s', '1024', myURL.hostname]);
    let line;
    let dd, yy;
    pp.stdout.on('data', (data) => {
        line = data.toString()
    })
    pp.on('close', function () {
        let k = line.split(',')[2];
        let m = /\d+\.\d+%/
        dd = k.match(m)[0];
        yy = k.split('=')[1].split('/')[1];
        // 记录网络问题
        logShareScreen({
            'host': _url,
            '丢包率': dd,
            '延迟率': yy
        });
        callback(dd, yy)
    })
}

let start = false
function ping(_url) {
    if (start) {
        return;
    }
    log.info('start ping......');
    start = true;
    const myURL =
        url.parse(_url);
    const pp = spawn('ping', ['-c', '10', '-s', '1024', myURL.hostname]);
    log.info(`start ping ${myURL.hostname}....`);
    let txt = [];
    pp.stdout.on('data', (data) => {
        txt.push(data.toString())
    });
    pp.on('close', (code) => {
        start = false;
        txt.map(line => {
            log.info(line);
        })
    });

}


module.exports = {
    info: log.info,
    debug: log.debug,
    error: logError,
    agle: logAgle,
    logShareScreen: logShareScreen,
    errorLocal: log.error,
    warn: log.warn,
    logPing: ping,
    lognet: lognet
}
