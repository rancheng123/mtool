const electron = require('electron')
const crypto = require('crypto')

const ipc = electron.ipcRenderer
const remote = electron.remote
const config = remote.require('./app/configuration')
const logger = remote.require('./app/logger')
const connectConf = remote.require('./app/connect.conf')
const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})

const MtoolUUID = config.readSettings('mtoolUUID')


export default {
    getServiceUrl() {
        return config.getMeetingServiceUrl()
    },

    send(api, method, option) {
        let meetingServer = config.getMeetingServiceUrl()
        let opt = option || {}
        let uri = `${meetingServer}/${api}`

        const authToken = config.readSettings('authToken')
        let hs = opt.headers || {}
        return rp({
            uri: uri,
            method: method || 'GET',
            json: true,
            timeout: opt.timeout || 20000,
            headers: {
                'uid': hs.uuid || MtoolUUID
            },
            body: opt.data || {},
            transform: function (body, response, resolveWithFullResponse) {

                return response.body || {}
            }
        })
    },

    /**
     * DynamicKey
     * @param {*} opt obj
     * {
          "appID":"6dbe3daf6f394694ba11865fc7b02ce1",
          "channel": "132312",
          "expiredTs": 0,
          "salt": 4235232,
          "ts": 1522054743,
          "uid": 123123
        }
     */
    dynamicKey(opt) {
        let api = `meeting/api/token`
        let st = new Date()
        return this.send(api, 'POST', { 'data': opt }).then(res => {
            let key = res.data || ''
            return {
                status: res.code > -1,
                key: key
            }
        })
    },

    signalToken(opt) {
        let api = `meeting/api/signal-token`
        return this.send(api, 'POST', { 'data': opt }).then(res => {
            let token = res.data || ''
            return {
                status: res.code > -1,
                token: token
            }
        })
    },

    /**
     * 创建会议房间
     * @param {*} roomId string
     * @param {*} screenId string
     */
    startMeeting(meetingId, member) {
        let api = `meeting/api/${meetingId}/start`
        let st = new Date()
        return this.send(api, 'POST', {
            data: member
        }).then(res => {
            let data = res.data || {
                durationMS: 0
            }
            let nt = new Date()
            let w = nt.getTime() - st.getTime()
            return {
                status: res.code > -1,
                duration: Math.ceil((data.durationMS + w / 2) / 1000) || 0,
                created: data.createTime
            }
        })
    },

    /**
     * 验证房间ID是否还在有人使用
     * @param {*} meetingId string
     */
    checkRoomFull(meetingId, uuid) {
        let api = `meeting/api/${meetingId || 123123}/is-full`
        logger.info('checking room is full?')
        return this.send(api, 'GET', {
            headers: {
                uuid: uuid
            }
        }).then((res) => {

            return {
                status: !res.data && res.code > -1,
                error: res.code === -1
            }
        })

        // logger.info('checking room is full?')
        // return new Promise((resolve, reject) => {
        //     resolve({
        //         status: false
        //     })
        // })
    },
    joinMeeting(meetingId, member) {
        let api = `meeting/api/${meetingId}/join`
        let st = new Date()
        logger.info('join room action')
        return this.send(api, 'GET', {
            data: member
        }).then((res) => {
            let data = res.data || {}
            let nt = new Date()
            let w = nt.getTime() - st.getTime()
            return {
                status: res.code > -1 && !data.full,
                full: data.full,
                users: data.members || [],
                duration: Math.ceil((data.durationMS + w / 2) / 1000) || 0,
                created: data.createTime
            }
        })

    },
    getPermission() {
        const userInfo = config.readSettings('userInfo')
        let api = `permission/api/validate/${userInfo.id}/${userInfo.organizationId}/videobutton`

        logger.info('get permission')
        return this.send(api, 'GET').then((res) => {

            logger.info('user permission: ', JSON.stringify(res))
            return {
                status: res.data
            }
        })
    },
    getMembers(meetingId, disableLog) {
        let api = `meeting/api/${meetingId}`
        return this.send(api, 'GET', {
            timeout: 10000,
            disableLog: disableLog
        }).then((res) => {
            if (!disableLog) {
                logger.info('user members: ', JSON.stringify(res))
            }
            return {
                status: res.code === 0,
                members: res.data.members
            }
        })
    },
    genInviteCode(meetingId) {
        let api = `code/api/gen`
        logger.info('generate invite code')
        return this.send(api, 'POST', {
            timeout: 10000,
            data: {
                meetingId: meetingId,
                uid: MtoolUUID
            }
        }).then((res) => {
            return {
                status: res.code === 0,
                data: res.data
            }
        })
    },
    sendInvite(code, email) {
        let api = `code/api/send`
        logger.info('send email ')
        return this.send(api, 'POST', {
            timeout: 30000,
            data: {
                'code': code,
                'email': email
            }
        }).then((res) => {
            logger.info('send email result: ', JSON.stringify(res))
            return {
                status: res.code === 0,
                data: res.data
            }
        })
    },
    screenStatus(macAddr) {
        let api = `meeting/api/screen/status/${macAddr}`
        logger.info(`screenStatus:${api}`);
        return this.send(api, 'GET', {
            timeout: 30000
        }).then((res) => {
            return {
                status: res.code === 0,
                data: res.data
            }
        })
    }
}
