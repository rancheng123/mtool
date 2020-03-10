const fs = require('fs')
const ping = require('ping')
const Promise = require('bluebird')

function isDevEnv() {
    return process.env.NODE_ENV === 'development'
}

function cleanUserInfo(config) {
    config.removeSettings('userInfo', true)
    config.removeSettings('authToken')
    config.removeSettings('csrfToken')
    config.removeSettings('sessionId')
    config.removeSettings('login')

    config.save()
}

function getUserHome() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
}

function pingHost(host, count) {

    if (isNaN(Number(count)) || count <= 0) return Promise.reject('count param must larger than 0')

    let promiseArray = []
    for (let i = 0; i < count; i++) {
        promiseArray.push(ping.promise.probe(host))
    }

    return Promise.all(promiseArray).then(arr => {
        let aliveCount = 0
        let aliveSum = 0
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].alive) {
                aliveCount += 1
                aliveSum += arr[i].time
            }
        }
        if (aliveCount > 0) return aliveSum / aliveCount

        return -1
    })
}

module.exports = {
    isDevEnv: isDevEnv,
    cleanUserInfo: cleanUserInfo,
    getUserHome: getUserHome,
    pingHost: pingHost
}
