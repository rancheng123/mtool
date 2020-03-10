/**
 * @file index.ts
 * @author shijh
 *
 * meeting模块转态管理
 */

// import { storeDecorator } from '@mydreamplus/aglarond'
// const { Action, Mutation, Getter,
//     default: StoreDecorator
// } = storeDecorator

import StoreDecorator, { Action, Mutation, Getter}  from '../store-decorator'


import { MemberUtils } from '../../helpers'
const electron = require('electron')


const remote = electron.remote
const logger = remote.require('./app/logger')

export interface PeopleOption {
    role?: role,
    uid?: string,
    streamId: number,
    userName: string,
    screen?: string,
    room?: string,
    status?: roleStatus,
    isLocal?: boolean,
    isStreamArrived?: boolean,
    controllerId?: string,
    linkedUid?: number,
    visble?: boolean,
    action?: action,
    onlineStatus?: NetworkStatus,
    type?: string,
    hasCamera?: boolean,
    displayName?: string,
    isPoorNetwork?: boolean

    audio?: 'on' | 'off',
    video?: 'on' | 'off'
}
export type role = 'joiner' | 'creator' | 'tv' | 'microphone'
export type NetworkStatus = 'online' | 'waiting'
export type action = 'join' | 'leave' | 'leave-exception'
export type roleStatus = 'meeting' | 'sharing'

export class People {
    role: role
    uid: string
    streamId: number
    isStreamArrived: boolean = false
    userName: string
    screen: string
    isLocal: boolean
    type: string
    room: string
    status: roleStatus
    controllerId: string
    linkedUid: number
    hasCamera: boolean = true
    visble: boolean = true
    onlineStatus: NetworkStatus = 'online'
    audio: 'on' | 'off' = 'on'
    video: 'on' | 'off' = 'on'
    displayName: string
    isPoorNetwork?: boolean
    constructor(opt: PeopleOption) {
        this.isStreamArrived = false
        this.type = opt.type || 'user'
        this.visble = true
        this.onlineStatus = 'online'
        this.audio = 'on'
        this.video = 'on'
        this.role = opt.role || 'joiner'
        this.uid = opt.uid
        this.streamId = Number(opt.streamId)
        this.userName = opt.userName
        this.screen = opt.screen
        this.room = opt.room
        this.status = opt.status || 'meeting'
        this.isLocal = !!opt.isLocal
        this.hasCamera = opt.hasOwnProperty('hasCamera') ? opt.hasCamera : true
        this.controllerId = opt.controllerId
        this.linkedUid = opt.linkedUid
        this.visble = !!opt.visble
        this.type = opt.type || 'user'
        this.isStreamArrived = !!opt.isStreamArrived
        this.onlineStatus = opt.onlineStatus || 'online'
        this.audio = opt.audio
        this.video = opt.video
        this.displayName = opt.displayName
        this.isPoorNetwork = false
    }
}

function sortMembers(m?: Array<People>, local?: People): Array<People> {
    let members = []
    let tvs = []
    let creators = []
    let microphones = []
    let joiners = []
    // let sharing = []
    let owner = []
    m.forEach(p => {
        p.visble = true
        if (`${p.uid}` === `${local.uid}`) {
            owner.push(p)
        } else if (MemberUtils.isTv(p)) {
            tvs.push(p)
        } else if (MemberUtils.isCreator(p) && p.uid !== local.uid) {
            creators.push(p)
        } else if (
            MemberUtils.isMicrophone(p)
            && p.uid !== local.uid
        ) { // TODO: 控制麦克风的panel显示
            microphones.push(p)
        } else {
            joiners.push(p)
        }
    })
    if (microphones.length > 0) {
        microphones.forEach(m => {
            m.visble = false
        })
    }

    members = members.concat(owner, tvs, creators, joiners, microphones)

    if (tvs.length > 0) {
        tvs.forEach(t => {
            creators.forEach(c => {
                if (`${t.controllerId}` === `${c.uid}` && c.status !== 'sharing') {
                    // 使用电视的panel 不用控制者的
                    c.visble = false
                }
            })
        })
    }

    return members
}

@StoreDecorator
class Store {
    /** state */

    state() {
        return {
            members: new Map(),
            room: '',
            local: null,
            major: null
        }
    }

    /** Getter */

    @Getter
    members(state) {
        const { members } = state
        const res = []
        members.forEach(m => {
            res.push(m)
        })
        return sortMembers(res, state.local)
    }

    @Getter
    major(state) {
        return state.major
    }

    /**
     * 获取自己的信息
     * @param state
     */
    @Getter
    getLocal(state): People {
        return  state.local ? new People(JSON.parse(JSON.stringify(state.local || {}))) : null
    }

    @Getter
    getLocalStatus(state): any {
        return state.local.status
    }

    /**
     * 获取自己的json数据
     * @param state
     */
    @Getter
    getLocalJson(state): any {
        return JSON.stringify(state.local)
    }

    /**
     * 获取当前是否有人在分享
     * @param state
     */
    @Getter
    hasSharing(state): boolean {
        const { local, members } = state
        // 有不是本地的分享
        let flag = false
        let id = local.uid
        members.forEach(m => {
            if (MemberUtils.isSharing(m) && id !== m.uid) {
                flag = true
            }
        })
        return flag
    }

    /**
     * 获取有效用户数量
     * @param state
     */
    @Getter
    getMemberCount(state): number {
        const { members } = state
        let count = 0
        members.forEach(m => {
            // 非mic或则微信拉取的屏幕
            if (!MemberUtils.isMicrophone(m) && !MemberUtils.isTv(m) || MemberUtils.isTv(m) && !members.get(`${m.controllerId}`)) {
                count++
            }
        })
        return count
    }

    /**
     * 获取电视用户数量
     * @param state
     */
    @Getter
    getTvMembers(state): Array<People> {
        const { members } = state
        let tvs = []
        members.forEach(m => {
            if (MemberUtils.isTv(m)) {
                tvs.push(m)
            }
        })
        return tvs
    }

    /**
     * 获取所有用户数量
     * @param state
     */
    @Getter
    getMembersCountAll(state): number {
        const { members } = state
        return members.size
    }

    /**
     * 获取正在分享用户信息
     * @param state
     */
    @Getter
    getSharing(state): People {
        const { local, members } = state
        let sharingOne
        let id = local.uid
        members.forEach(m => {
            if (MemberUtils.isSharing(m) && id !== m.uid) {
                sharingOne = m
            }
        })
        return sharingOne
    }

    @Getter
    sortMembers(state): Array<People> {
        const { members } = state
        const res = []
        members.forEach(m => {
            res.push(m)
        })
        return res
    }

    /** Mutation */

    /**
     * 新增参会人员
     * @param state
     */
    @Mutation('members')
    addPeople(state, people) {
        const id = people.uid
        const { members } = state
        members.set(`${id}`, people)
        logger.info(`vuex-meeting:store add people ${id} current members keys ${Object.keys(state.members)}`)
        return new Map(members)
    }

    /**
     * 检验修改并更新
     * @param state
     * @param nMembers
     */
    @Mutation()
    checkChangedAndSync(state, nMembers) {
        const { members, local } = state
        const temp = new Map()
        let localLeave = true
        let nlocal = null
        nMembers.forEach(p => {
            const o = members.get(`${p.uid}`) || {}
            const changed =  MemberUtils.checkChanged(p, o)
            if (Number(p.uid) === Number(local.uid)) {
                localLeave = false
                nlocal = local
            }
            if (o && changed) {
                let newMember = Object.assign({}, o, p)
                temp.set(`${p.uid}`, newMember)
            } else {
                temp.set(`${p.uid}`, o)
            }
        })
        state.local = nlocal
        state.members = temp
    }

    /**
     * 获取用户通过流id
     * @param state
     * @param streamId 流id
     */
    @Mutation()
    getPeopleByStreamId(state, streamId): People {
        const { members } = state
        let people
        members.forEach(m => {
            if (m.streamId === Number(streamId)) {
                people = m
            }
        })
        return people
    }

    /**
     * 获取用户通过用户id
     * @param state
     * @param uid 用户id
     */
    @Mutation()
    getPeopleByUId(state, uid): People {
        const { members } = state
        let people
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                people = m
            }
        })
        return people
    }

    /**
     * 校验是否所有的流都到达了
     * @param state
     */
    @Mutation()
    checkAllStreamArrived(state): boolean {
        let result = true
        const { members } = state
        members.forEach(m => {
            if (!m.isStreamArrived) {
                result = false
            }
        })
        return result
    }

    /**
     * 设置音频流状态
     * @param state
     * @param disable 是否禁用
     */
    @Mutation('local')
    setAudioStatus(state, disable): any {
        const { local } = state
        local.audio = disable ? 'off' : 'on'
        return { ...local }
    }

    /**
     * 通过用户id设置音频流状态
     * @param state
     * @param uid
     * @param disable
     */
    @Mutation('members')
    setAudioStatusByMemberId(state, uid, disable): any {
        const { members } = state
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                m.audio = !disable ? 'on' : 'off'
            }
        })
        return new Map(members)
    }

    /**
     * 设置当前视频流状态
     * @param state
     * @param disable 是否禁用
     */
    @Mutation('local')
    setVideoStatus(state, disable): any {
        const { local } = state
        local.video = disable ? 'off' : 'on'
        return { ...local }
    }

    /**
     * 通过用户id设置视屏流状态
     * @param state
     * @param uid
     * @param disable
     */
    @Mutation('members')
    setVideoStatusById(state, uid, disable): any {
        const { members } = state
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                m.video = !disable ? 'on' : 'off'
            }
        })
        return new Map(members)
    }

    @Mutation('local')
    changeLocalRole(state, role): any {
        const { local } = state
        local.role = role
        return { ...local }
    }

    /**
     * 更新人员的状态
     * @param state
     * @param member
     */
    @Mutation('members')
    updateMemberStatus(state, member): Map<any, any> {
        const { members, major } = state
        const { uid } = member
        /**
         * mqtt消息同步的member数据状态字段会丢失不准，所以得这里做原始数据合并
         */
        members.set(`${uid}`, Object.assign({}, members.get(String(uid)), member))
        if (major && `${major.uid}` === `${uid}`) {
            state.major = member
        }
        return new Map(members)
    }

    /**
     * 本地流状态
     * @param state
     * @param status
     */
    @Mutation()
    localStatus(state, status): void {
        const { local } = state
        local.status = status
        state.local = { ...local }
    }

    /**
     * 通过id更新major
     * @param state
     * @param id
     */
    @Mutation('major')
    updateMajorByUId(state, uid): void {
        if (!uid) {
            return null
        }
        let { major, members } = state
        let people
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                people = m
            }
        })
        major = people
        return major
    }

    /**
     * 网络转态设置 (对方网络不稳定)
     * @param options {uid：xxx, isPoorNetwork: true|false}
     */

    @Mutation()
    updateMemberPoorNetwork(state, options) {
        const { uid, isPoorNetwork } = options
        let { members } = state
        let member
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                member = m
            }
        })
        if (!member) return
        member.isPoorNetwork = isPoorNetwork
        members.set(`${uid}`, {...member})
        state.members = new Map(members)
    }

    /**
     * 初始化本地用户
     * @param state
     */
    @Action()
    init(context, who) {
        const { state, commit } = context
        if (state.room && state.room !== who.room) {
            state.members= new Map()
            commit('stream/clear', {}, {root: true})
        }
        who.isLocal = true
        state.room = who.room
        who.isStreamArrived = true
        who.visble = true
        const people = new People(who)
        const id = people.uid
        state.local = people
        commit('addPeople', people)
        logger.info(`vuex-meeting:store init people ${id} current members keys ${Object.keys(state.members)}`)
    }

    /**
     * 加入会议
     * @param context
     * @param who
     */
    @Action()
    join(context, who) {
        const { state, commit, rootState } = context
        who.isLocal = false
        if (rootState.stream.streams[who.streamId]) {
            who.isStreamArrived = true
            who.visble = true
        }

        if (state.local.uid !== who.uid) {
            const m = new People(who)
            commit('addPeople', m)
        }
        // 如果屏幕控制者是major， 拉取屏幕后，屏幕变为major
        if (
            MemberUtils.isTv(who) &&
            state.major &&
            `${who.controllerId}` === `${state.major.uid}`
        ) {
            state.major = who
        }
    }

    /**
     * 批量加入
     * @param context
     * @param whos
     */
    @Action()
    addUsers(context, whos) {
        const { dispatch } = context
        whos.forEach(w => {
            w.visble = false
            dispatch('join', w)
        })
    }

    /**
     * 如果当前用户是电话人员就移除
     * @param context
     * @param streamId
     */
    @Action()
    leaveIfPhone(context, streamId): void {
        const { state, members, commit } = context
        let people
        let self = this
        members.forEach(m => {
            if (`${m.streamId}` === `${streamId}`) {
                people = m
            }
        })
        if (people && people.type && people.type === 'phone') {
            commit('leave', people)
        }
    }

    /**
     * 流已经到达
     * @param context
     * @param streamId 流id
     */
    @Action()
    streamArrived(context, streamId): void {
        const { commit, state } = context
        const { members } = state
        members.forEach(m => {
            if (`${m.streamId}` === `${streamId}`) {
                m.isStreamArrived = true
                commit('updateMemberStatus', m)
            }
        })
    }

    /**
     * 参会人员离开
     * @param state
     */
    @Action()
    leave(context, who) {
        const { state, commit } = context
        const { members } = state
        members.delete(`${who.uid}`)
        commit('stream/removeStream', who.streamId, {root: true})
        state.members = new Map(members)
        logger.info(`vuex-meeting:store remove people ${who.uid} current people keys ${Object.keys(state.members)}`)
        if (state.major && `${who.uid}` === `${state.major.uid}`) {
            if (MemberUtils.isTv(who)) {
                state.major = members.get(who.controllerId) || MemberUtils.getLastMember(members)
            } else {
                state.major = MemberUtils.getLastMember(members)
            }
        }
    }

    /**
     * 清空参与人员
     */
    @Action()
    clear(context): any {
        const { state, commit } = context
        state.members= new Map()
        commit('stream/clear', {}, {root: true})
    }
}

export default new Store()
