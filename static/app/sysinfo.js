let cpuStat = require('cpu-stat')
let si = require(`systeminformation`)

function getCpu() {
    return new Promise((resolve, reject) => {
        cpuStat.usagePercent({
            sampleMs: 2000
        }, (err, percent, seconds) => {
            if (err) {
                return reject()
            }
            resolve(percent)
        })
    })
}

function getMem() {
    return new Promise((resolve, reject) => {
        si.mem((res) => {
            resolve(res.used / res.total)
        })
    })
}
function getNet() {
    return new Promise((resolve, reject) => {
        si.networkInterfaceDefault((iface) => {
            si.networkStats(iface, (res) => {
                resolve({
                    'rx_sec': res.rx_sec / 8,
                    'tx_sec': res.tx_sec / 8
                })
            })
        })
    })
}

module.exports = {
    getCpu: getCpu,
    getMem: getMem,
    getNet: getNet
}
