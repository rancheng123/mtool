/**
 * @file index.js
 * @author shijh
 *
 * 视频会议相关处理方法
 */
import SmartOfficeAPI from '../../../../service/SmartOfficeAPI'
import meetingService from '../../../../service/meetingService'

const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const logger = remote.require('./app/logger')

 /**
  * 获取用户信息
  */
export const getSIPInfoHelper = async () => {
    let getSIPInfo = null
    let startTime = new Date()

    try {
        getSIPInfo = await SmartOfficeAPI.account()
        let endTime = new Date()
        logger.info(`SmartOfficeAPI.account time-consume:${Number(endTime) - Number(startTime)}`)
        logger.info(`SmartOfficeAPI.account:${JSON.stringify(getSIPInfo)}`)
    } catch (err) {
        logger.error(`SmartOfficeAPI.account error:${JSON.stringify(err)}`)
    }

    return getSIPInfo
}

/**
 * 获取SignalToken
 */
export const getSignalTokenHelper = async (tokenReqOpt) => {
    let res = null
    try {
        res = await meetingService.signalToken(tokenReqOpt)
    } catch (err) {
        logger.error(`get signal token error: ${err}`)
    }

    return res ? res.token : ''
}

/**
 * 获取初始化store信息
 */
export const getInitStoreInfoHelper = (self) => {
    return {
        id: self.userInfo.id,
        uid: self.userInfo.id,
        streamId: self.localStreamId,
        userName: self.userInfo.fullName || '',
        room: self.room,
        screen: self.screen,
        type: 'user',
        role: self.isCreator ? 'creator' : 'joiner'
    }
}

/**
 * 查询当前流关联的流id
 * @param members 用户群组
 * @param member 用户
 */
export const findStreamId = (members, member) => {
    const { controllerId, linkedUid } = member;
    return members.map(m => {
        if (m.uid == controllerId || m.uid == linkedUid) {
            return Number(m.streamId)
        }
    })
}

/**
 * 通过streamId获取用户
 * @param members
 * @param streamId
 */
export const getPeopleByStreamId = (members, streamId) => {
    let p = null
    members.forEach(el => {
        if (`${el.streamId}` === `${streamId}`) {
            p = el
        }
    });
    return p
}

/**
 * 通过用户id获取用户
 * @param members
 * @param uid
 */
export const getPeopleByUId = (members, uid) => {
    let p = null
    members.forEach(el => {
        if (`${el.uid}` === `${uid}`) {
            p = el
        }
    });
    return p
}

/**
 * 判断当前member对象是不是local的member
 * @param cureent
 * @param local
 */
export const isLocal = (cureent, local) => {
    return `${cureent.uid}` === `${local.uid}`
}
