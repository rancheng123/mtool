const tcpp = require('tcp-ping')
const iot = require('./iot')
const logger = require('./logger')

class Checker {
    constructor() {
        this.connected = true
        this.interval = null
        this.onconnected = function () { }
    }
    on(cb) {
        this.onconnected = cb
    }
    startCheck() {
        console.log('network checking start')
        let fetch
        const self = this
        this.interval = setInterval(() => {
            tcpp.ping({
                address: 'www.baidu.com'
            }, (err, data) => {
                if (err || isNaN(data.avg)) {
                    this.connected = false
                    return
                }
                if (!this.connected && !isNaN(data.avg)) {
                    // true 为qa，false 为正式
                    iot.fetchConfig(false)
                    if (self.onconnected) {
                        self.onconnected()
                    }
                }

                this.connected = !isNaN(data.avg)
            })
        }, 2000)
    }
    stopCheck() {
        console.log('network checking stop')
        this.connected = false
        clearInterval(this.interval)
    }
}

module.exports = new Checker()
