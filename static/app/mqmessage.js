const mqtt = require('mqtt')
const uuid = require('uuid')
const moment = require('moment')
const Promis = require('bluebird')
const logger = require('./logger')
const config = require('./configuration')
const connectConf = require('./connect.conf')

function MQTTEngine() {
    this.connectCount = 0
    this.retried = 0
    this.isconnected = false
    this.messageHandle = function () { }
    this.mqeventHandle = function () { }
}
MQTTEngine.prototype = {
    close: function () {
        const self = this
        this.retried = 0;
        return new Promise((resolve, reject) => {
            if (self.client) {
                logger.info('mqtt start ending')
                if (self.client.connected) {
                    self.client.end(true, () => {
                        logger.info('mqtt end done')
                        self.client = null
                        resolve()
                    })
                } else {
                    self.client.end(true)
                    self.client = null
                    logger.info('mqtt set to null done')
                    resolve()
                }
            } else {
                logger.info('mqtt client is null when close')
                resolve()
            }
        })

    },
    initClient: function (opt) {
        const self = this
        const conf = connectConf.getConfig()
        this.connectCount = 0
        let connectionOpts = {
            clientId: 'mtool-' + uuid.v4(),
            keepalive: 60,
            connectTimeout: 10 * 1000,
            reconnectPeriod: 2 * 1000,
            clean: true,
            username: conf.mqtt.userName,
            password: conf.mqtt.password,
            will: {
                topic: 'meeting-will',
                payload: JSON.stringify({
                    meetingId: opt.topic,
                    member: opt.member
                }),
                qos: 0,
                retain: false
            }
        }

        const mqttServer = config.readSettings('meetingMqttDomain')
        logger.info(`mqtt init client, url: ${mqttServer}, user: ${conf.mqtt.userName}, password: ${conf.mqtt.password}, topic: ${opt.topic}`)
        self.client = mqtt.connect(mqttServer, connectionOpts)

        let mqeh = opt.mqeventHandle || this.mqeventHandle
        self.client.on('error', (error) => {
            logger.error(`mqtt error: ${error}`)
            self.isconnected = false

            mqeh({
                type: 'error'
            })
        })
        self.client.on('offline', () => {
            logger.error('mqtt offline')
            self.isconnected = true
            mqeh({
                type: 'offline'
            })
            // self.reconnect()
        })
        self.client.on('close', () => {
            logger.error('mqtt close')
            self.isconnected = false
            mqeh({
                type: 'close'
            })
        })
        self.client.on('reconnect', () => {
            logger.error(`mqtt reconnect ${self.retried}`)
            self.retried = self.retried + 1
            mqeh({
                type: 'reconnect',
                retried: self.retried
            })
            if (self.retried > 10) {
                self.close()
            }
        })

        self.client.on('connect', (conn) => {
            self.isconnected = true

            //logger.debug(`mqtt on connect conn:${JSON.stringify(conn)}`)
            //logger.debug(`mqtt on connect client:${JSON.stringify(self.client)}`)
            logger.debug(`mqtt on connect opt:${JSON.stringify(opt)}`)
            logger.info('initClient function on connect subscribe topic: ' + opt.topic)

            //TODO
            self.client.subscribe(opt.topic, (error) => {
                if (error) {
                    logger.error(`mqtt subcribe topic error: ${error}`)
                }
            })

            logger.info('mqtt conncted fire callback')
            mqeh({
                type: 'connect',
                isReConnected: self.retried > 0 && self.connectCount > 0
            })

            self.connectCount = self.connectCount + 1
            self.retried = 0
        })

        let cb = opt.msgHandle || this.messageHandle
        self.client.on('message', (topic, message) => {
            let msg = JSON.parse(message.toString())
            msg = msg || message.toString()
            let res = {
                topic: topic,
                data: msg
            }
            if (typeof cb === 'function') {
                logger.info(`mqtt topic '${topic}' on message: ${message}`)
                cb(res)
            }

        })

        return this
    },

    publish: function (topic, message, callback) {
        const self = this
        if (self.client) {
            self.client.publish(topic + '', message, (error) => {
                if (error) {
                    logger.error(`mqmessage.js publish: ${error}, ${topic}, ${message}`)
                }
                if (typeof callback === 'function') {
                    callback()
                }
            })
        } else {
            if (typeof callback === 'function') {
                callback()
            }
        }
        return this
    }
}

let mq = new MQTTEngine()

logger.info('mqmessage.js instance created')



module.exports = {
    init(opt) {
        mq.close().then(() => {
            mq.initClient(opt)
        })
    },
    publish(topic, message, cb) {
        logger.info(`mqmessage.js publish topic:${topic} message:${message}`)
        mq.publish(topic, message, cb)
    },
    close() {
        logger.info(`mqmessage.js close`)
        mq.close()
    },
    generateNumberID() {
        let id = moment().format('kkssSSS')
        id += Math.ceil(Math.random() * 10)
        return parseInt(id)
    },
    getInstance() {
        return mq
    }
}
