import { debug7z } from 'builder-util';

const electron = require('electron')
const crypto = require('crypto')

const ipc = electron.ipcRenderer
const remote = electron.remote
const config = remote.require('./app/configuration')
const logger = remote.require('./app/logger')
const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})



export default {
    send(api, method, data) {
        let smartOfficeUrl = config.getSoUrl()

        let uri = `${smartOfficeUrl}/${api}`
        let authToken = config.readSettings('authToken')
        return rp({
            uri: uri,
            method: method || 'GET',
            json: true,
            headers: {
                'auth-token': authToken
            },
            timeout: 20000,
            body: data || {},
            transform: (body, response, resolveWithFullResponse) => {
                return response.body
            }
        })
    },
    /**
     * [产生新的屏幕号 description]
     * @param  {[type]} macaddr [description]
     */
    genNewScreenId(macaddr) {
        let api = `api/devicebinded/gen-new-screenid/${macaddr}`
        return this.send(api, 'POST').then((res) => {
            let data = (res.data || {})['data'] || {}
            return {
                status: res.code === 200,
                screenId: data
            }
        })
    },

    /**
     * [判断用户是不是有不需要屏幕发起会议的权限]
     *
     */
    permission() {
        let api = `api/user/permission/online-meeting`
        return this.send(api, 'GET').then((res) => {
            return res
        })
    },
    /**
     * [获得用户信息]
     *
     */
    account() {
        let api = `api/account`
        return this.send(api, 'GET').then((res) => {
            return res
        })
    },
    /**
     * [判断用户是不是有不需要屏幕发起会议的权限]
     *
     */
    vipmeeting() {
        let api = `api/devicebinded/online-meeting/create`
        return this.send(api, 'POST').then((res) => {
            let data = (res.data || {})['data'] || {}
            return {
                status: res.code === 200,
                screenId: data
            }
        })
    },
    /**
     * 验证屏幕ID是否存在
     * @param {*} screenId string
     */
    checkScreenExist(screenId) {
        let api = `api/devicebinded/screens/existence/${screenId}`

        return this.send(api, 'GET').then((res) => {
            let data = (res.data || {})['data'] || {}
            let screenStatus = (res.data || {})['screenStatus'] // 屏幕被占用
            let microphone = (res.data || {})['microphone'] // 有麦克风
            let devices = data.devices || []
            let screen = devices[0]
            let type = ''
            let isScreenPro = false
            let macAddr = ''
            let isOnline = false
            let hiddenAttr = {}
            let additionalAttr = {}
            if (screen) {
                type = screen.name
                macAddr = screen.symbol
                isScreenPro = type === 'ScreenPro'
                isOnline = screen.deviceState === 'ONLINE'
                try {
                    hiddenAttr = JSON.parse(screen.hiddenAttributes)
                } catch (error) {
                    logger.info('parse screen hidden attributes error: ' + error)
                }

                try {
                    additionalAttr = JSON.parse(screen.additionalAttributes)
                } catch (error) {
                    logger.info('parse screen additional attributes error: ' + error)
                }

            }
            if (!hiddenAttr) {
                hiddenAttr = {}
            }
            return {
                status: res.code === 200 && screen,
                type: type,
                isScreenPro: isScreenPro,
                isOnline: isOnline,
                macAddr: macAddr,
                screenStatus: screenStatus, // 1 使用 0 未用
                microphone: microphone,
                hasCamera: !!additionalAttr.hasCamera,
                hasSpeaker: !!microphone,
                hasMic: !!microphone,
                isAgle: !!hiddenAttr.isAgle
                // hasCamera: !!additionalAttr.hasCamera,
                // hasSpeaker: !!hiddenAttr.isSpeakerAvailable,
                // hasMic: !!hiddenAttr.isMicAvailable

                // status: true || res.code === 200 && screen,
                // type: 'ScreenPro',
                // isScreenPro: true || isScreenPro,
                // isOnline: true || isOnline
            }
        })
    },
    /**
     * 创建会议房间
     * @param {*} roomId string
     * @param {*} screenId string
     */
    createRoom(roomId, screenId, streamId) {
        let authToken = config.readSettings('authToken')
        const hash = crypto.createHash('sha256')
        hash.update('' + authToken)
        let tokenhash = hash.digest('hex')
        let api = `api/devicebinded/virtual-rooms/${roomId}/${screenId}/${tokenhash}`
        return this.send(api, 'POST', {
            meetingCreatorId: streamId
        }).then((res) => {
            let data = res.data || {}
            console.log(res)
            return {
                status: !!data.result,
                timesmp: data.data
            }
        })
    },
    /**
     * 验证房间ID是否还在有人使用
     * @param {*} roomId string
     */
    checkRoomAlive(roomId) {
        let api = `api/devicebinded/virtual-rooms/${roomId}`
        return this.send(api, 'GET').then((res) => {
            let data = res.data || {}
            let error
            if (res.code === 4005) {
                error = 'room_is_full'
            }
            return {
                status: !!data.result,
                error: error,
                timesmp: data.data
            }
        })
    },
    /**
     * 会议心跳,每2分钟进行一次检测
     * @param {*} roomId string
     * @param {*} data {data:"uid"}
     */
    heartBeat(roomId, data) {
        let authToken = config.readSettings('authToken')
        const hash = crypto.createHash('sha256')
        hash.update('' + authToken)
        let tokenhash = hash.digest('hex')
        let api = `api/devicebinded/virtual-rooms/${roomId}/${tokenhash}/heatbeating`
        return this.send(api, 'POST', data).then((res) => {
            logger.info(`heartBeat ` + JSON.stringify(res))
            return res
        })
    },
    dismissMeeting(roomId, screenId) {
        let api = `api/devicebinded/virtual-rooms-close/${roomId}/${screenId}`
        return this.send(api, 'POST')
    },
    /**
     * 获取屏幕的设备信息
     * @param {*} screenId string
     */
    getScreenDevices(roomId, screenId) {
        let api = `api/devicebinded/virtual-rooms/${roomId}/${screenId}/equipments`
        logger.info(`api/devicebinded/virtual-rooms/${roomId}/${screenId}/equipments`)
        return this.send(api).then((res) => {
            let data = res.data || {}

            let devices = data.devices || []

            let screen = devices[0]
            let dinfo
            if (screen && screen.hiddenAttributes) {
                dinfo = JSON.parse(screen.hiddenAttributes)
            }
            // dinfo.isMicAvailable = false
            // dinfo.isSpeakerAvailable = false
            // dinfo.isCameraAvailable = false
            logger.info('get Device OK')
            return {
                status: res.code !== 200 && dinfo,
                data: dinfo || {}
            }
        })
    },
    /**
     * 控制屏幕设备的状态，音频输出/入，视频输出
     * @param {*} roomId string
     * @param {*} screenId boolean
     * @param {*} device {name:string, action:string}
     */
    constrolDevice(roomId, screenId, device) {
        let api = `api/devicebinded/virtual-rooms/${roomId}/${screenId}/equipments/action`
        device.roomId = roomId
        let data = {
            action: 'deviceControl',
            data: JSON.stringify(device)
        }
        return this.send(api, 'POST', data).then((res) => {
            return {
                status: res.code !== 200 && res.data
            }
        })
    },
    createMeetingRoom(roomId, screenId, params, newScreenCode, isGust = false) {
        let api = isGust
            ? `api/devicebinded/virtual-rooms/create-with-visitor`
            : `api/devicebinded/virtual-rooms/create`

        let authToken = config.readSettings('authToken')
        const hash = crypto.createHash('sha256')
        hash.update('' + authToken)
        let tokenhash = hash.digest('hex')
        let data = {
            'authToken': tokenhash,
            'meetingTerminalType': '2', // 2为电视
            'paramMap': params,
            'roomId': roomId,
            'newScreenCode': newScreenCode || false,
            'screenId': screenId
        }
        return this.send(api, 'POST', data).then((res) => {
            return {
                status: res.code === 200,
                screenCode: res.data.screenCode
            }
        })
    },
    /**
     *
     * @param {*} roomId sting
     * @param {*} screenId  sting
     */
    freeScreen(roomId, screenId, isGust = false) {
        let api = isGust
            ? `api/devicebinded/virtual-rooms-close-tv-with-visitor/${roomId}/${screenId}`
            : `api/devicebinded/virtual-rooms-close-tv/${roomId}/${screenId}`
        return this.send(api, 'POST').then((res) => {
            return {
                status: res.code === 200
            }
        })
    },
    /**
     * 主动离开时
     * @param {*} roomId  会议室号
     * @param {*} uid 用用户ID或屏幕ID
     */
    leaveRoom(roomId) {
        let api = `api/devicebinded/user-exit/${roomId}`

        return this.send(api, 'POST').then((res) => {
            return {
                status: res.code !== 200 && res.data
            }
        })
    },
    /**
     * 加入会议时调用，统计使用
     * @param {*} screenId string
     */
    joinMeeting(screenId) {
        let api = `api/online-meeting/screens/${screenId}/join`

        return this.send(api, 'POST').then((res) => {
            let data = (res.data || {})['data'] || {}

            return {
                status: res.code === 200
            }
        })
    },
    /**
     * 登录时候调用
     * @param {*} uuid string
     */
    longin(uuid) {
        let api = `api/mtool/login/${uuid}`
        return this.send(api, 'GET').then((res) => {
            return res
        })
    }
}
