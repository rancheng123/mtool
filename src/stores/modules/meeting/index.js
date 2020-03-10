/**
 * @file index.ts
 * @author shijh
 *
 * meeting模块转态管理
 */
import * as tslib_1 from "tslib";
// import { storeDecorator } from '@mydreamplus/aglarond'
// const { Action, Mutation, Getter,
//     default: StoreDecorator
// } = storeDecorator
import StoreDecorator, { Action, Mutation, Getter } from '../store-decorator';
import { MemberUtils } from '../../helpers';
const electron = require('electron');
const remote = electron.remote;
const logger = remote.require('./app/logger');
export class People {
    constructor(opt) {
        this.isStreamArrived = false;
        this.hasCamera = true;
        this.visble = true;
        this.onlineStatus = 'online';
        this.audio = 'on';
        this.video = 'on';
        this.isStreamArrived = false;
        this.type = opt.type || 'user';
        this.visble = true;
        this.onlineStatus = 'online';
        this.audio = 'on';
        this.video = 'on';
        this.role = opt.role || 'joiner';
        this.uid = opt.uid;
        this.streamId = Number(opt.streamId);
        this.userName = opt.userName;
        this.screen = opt.screen;
        this.room = opt.room;
        this.status = opt.status || 'meeting';
        this.isLocal = !!opt.isLocal;
        this.hasCamera = opt.hasOwnProperty('hasCamera') ? opt.hasCamera : true;
        this.controllerId = opt.controllerId;
        this.linkedUid = opt.linkedUid;
        this.visble = !!opt.visble;
        this.type = opt.type || 'user';
        this.isStreamArrived = !!opt.isStreamArrived;
        this.onlineStatus = opt.onlineStatus || 'online';
        this.audio = opt.audio;
        this.video = opt.video;
        this.displayName = opt.displayName;
        this.isPoorNetwork = false;
    }
}
function sortMembers(m, local) {
    let members = [];
    let tvs = [];
    let creators = [];
    let microphones = [];
    let joiners = [];
    // let sharing = []
    let owner = [];
    m.forEach(p => {
        p.visble = true;
        if (`${p.uid}` === `${local.uid}`) {
            owner.push(p);
        }
        else if (MemberUtils.isTv(p)) {
            tvs.push(p);
        }
        else if (MemberUtils.isCreator(p) && p.uid !== local.uid) {
            creators.push(p);
        }
        else if (MemberUtils.isMicrophone(p)
            && p.uid !== local.uid) { // TODO: 控制麦克风的panel显示
            microphones.push(p);
        }
        else {
            joiners.push(p);
        }
    });
    if (microphones.length > 0) {
        microphones.forEach(m => {
            m.visble = false;
        });
    }
    members = members.concat(owner, tvs, creators, joiners, microphones);
    if (tvs.length > 0) {
        tvs.forEach(t => {
            creators.forEach(c => {
                if (`${t.controllerId}` === `${c.uid}` && c.status !== 'sharing') {
                    // 使用电视的panel 不用控制者的
                    c.visble = false;
                }
            });
        });
    }
    return members;
}
let Store = class Store {
    /** state */
    state() {
        return {
            members: new Map(),
            room: '',
            local: null,
            major: null
        };
    }
    /** Getter */
    members(state) {
        const { members } = state;
        const res = [];
        members.forEach(m => {
            res.push(m);
        });
        return sortMembers(res, state.local);
    }
    major(state) {
        return state.major;
    }
    /**
     * 获取自己的信息
     * @param state
     */
    getLocal(state) {
        return state.local ? new People(JSON.parse(JSON.stringify(state.local || {}))) : null;
    }
    getLocalStatus(state) {
        return state.local.status;
    }
    /**
     * 获取自己的json数据
     * @param state
     */
    getLocalJson(state) {
        return JSON.stringify(state.local);
    }
    /**
     * 获取当前是否有人在分享
     * @param state
     */
    hasSharing(state) {
        const { local, members } = state;
        // 有不是本地的分享
        let flag = false;
        let id = local.uid;
        members.forEach(m => {
            if (MemberUtils.isSharing(m) && id !== m.uid) {
                flag = true;
            }
        });
        return flag;
    }
    /**
     * 获取有效用户数量
     * @param state
     */
    getMemberCount(state) {
        const { members } = state;
        let count = 0;
        members.forEach(m => {
            // 非mic或则微信拉取的屏幕
            if (!MemberUtils.isMicrophone(m) && !MemberUtils.isTv(m) || MemberUtils.isTv(m) && !members.get(`${m.controllerId}`)) {
                count++;
            }
        });
        return count;
    }
    /**
     * 获取电视用户数量
     * @param state
     */
    getTvMembers(state) {
        const { members } = state;
        let tvs = [];
        members.forEach(m => {
            if (MemberUtils.isTv(m)) {
                tvs.push(m);
            }
        });
        return tvs;
    }
    /**
     * 获取所有用户数量
     * @param state
     */
    getMembersCountAll(state) {
        const { members } = state;
        return members.size;
    }
    /**
     * 获取正在分享用户信息
     * @param state
     */
    getSharing(state) {
        const { local, members } = state;
        let sharingOne;
        let id = local.uid;
        members.forEach(m => {
            if (MemberUtils.isSharing(m) && id !== m.uid) {
                sharingOne = m;
            }
        });
        return sharingOne;
    }
    sortMembers(state) {
        const { members } = state;
        const res = [];
        members.forEach(m => {
            res.push(m);
        });
        return res;
    }
    /** Mutation */
    /**
     * 新增参会人员
     * @param state
     */
    addPeople(state, people) {
        const id = people.uid;
        const { members } = state;
        members.set(`${id}`, people);
        logger.info(`vuex-meeting:store add people ${id} current members keys ${Object.keys(state.members)}`);
        return new Map(members);
    }
    /**
     * 检验修改并更新
     * @param state
     * @param nMembers
     */
    checkChangedAndSync(state, nMembers) {
        const { members, local } = state;
        const temp = new Map();
        let localLeave = true;
        let nlocal = null;
        nMembers.forEach(p => {
            const o = members.get(`${p.uid}`) || {};
            const changed = MemberUtils.checkChanged(p, o);
            if (Number(p.uid) === Number(local.uid)) {
                localLeave = false;
                nlocal = local;
            }
            if (o && changed) {
                let newMember = Object.assign({}, o, p);
                temp.set(`${p.uid}`, newMember);
            }
            else {
                temp.set(`${p.uid}`, o);
            }
        });
        state.local = nlocal;
        state.members = temp;
    }
    /**
     * 获取用户通过流id
     * @param state
     * @param streamId 流id
     */
    getPeopleByStreamId(state, streamId) {
        const { members } = state;
        let people;
        members.forEach(m => {
            if (m.streamId === Number(streamId)) {
                people = m;
            }
        });
        return people;
    }
    /**
     * 获取用户通过用户id
     * @param state
     * @param uid 用户id
     */
    getPeopleByUId(state, uid) {
        const { members } = state;
        let people;
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                people = m;
            }
        });
        return people;
    }
    /**
     * 校验是否所有的流都到达了
     * @param state
     */
    checkAllStreamArrived(state) {
        let result = true;
        const { members } = state;
        members.forEach(m => {
            if (!m.isStreamArrived) {
                result = false;
            }
        });
        return result;
    }
    /**
     * 设置音频流状态
     * @param state
     * @param disable 是否禁用
     */
    setAudioStatus(state, disable) {
        const { local } = state;
        local.audio = disable ? 'off' : 'on';
        return { ...local };
    }
    /**
     * 通过用户id设置音频流状态
     * @param state
     * @param uid
     * @param disable
     */
    setAudioStatusByMemberId(state, uid, disable) {
        const { members } = state;
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                m.audio = !disable ? 'on' : 'off';
            }
        });
        return new Map(members);
    }
    /**
     * 设置当前视频流状态
     * @param state
     * @param disable 是否禁用
     */
    setVideoStatus(state, disable) {
        const { local } = state;
        local.video = disable ? 'off' : 'on';
        return { ...local };
    }
    /**
     * 通过用户id设置视屏流状态
     * @param state
     * @param uid
     * @param disable
     */
    setVideoStatusById(state, uid, disable) {
        const { members } = state;
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                m.video = !disable ? 'on' : 'off';
            }
        });
        return new Map(members);
    }
    changeLocalRole(state, role) {
        const { local } = state;
        local.role = role;
        return { ...local };
    }
    /**
     * 更新人员的状态
     * @param state
     * @param member
     */
    updateMemberStatus(state, member) {
        const { members, major } = state;
        const { uid } = member;
        /**
         * mqtt消息同步的member数据状态字段会丢失不准，所以得这里做原始数据合并
         */
        members.set(`${uid}`, Object.assign({}, members.get(String(uid)), member));
        if (major && `${major.uid}` === `${uid}`) {
            state.major = member;
        }
        return new Map(members);
    }
    /**
     * 本地流状态
     * @param state
     * @param status
     */
    localStatus(state, status) {
        const { local } = state;
        local.status = status;
        state.local = { ...local };
    }
    /**
     * 通过id更新major
     * @param state
     * @param id
     */
    updateMajorByUId(state, uid) {
        if (!uid) {
            return null;
        }
        let { major, members } = state;
        let people;
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                people = m;
            }
        });
        major = people;
        return major;
    }
    /**
     * 网络转态设置 (对方网络不稳定)
     * @param options {uid：xxx, isPoorNetwork: true|false}
     */
    updateMemberPoorNetwork(state, options) {
        const { uid, isPoorNetwork } = options;
        let { members } = state;
        let member;
        members.forEach(m => {
            if (`${m.uid}` === `${uid}`) {
                member = m;
            }
        });
        if (!member)
            return;
        member.isPoorNetwork = isPoorNetwork;
        members.set(`${uid}`, { ...member });
        state.members = new Map(members);
    }
    /**
     * 初始化本地用户
     * @param state
     */
    init(context, who) {
        const { state, commit } = context;
        if (state.room && state.room !== who.room) {
            state.members = new Map();
            commit('stream/clear', {}, { root: true });
        }
        who.isLocal = true;
        state.room = who.room;
        who.isStreamArrived = true;
        who.visble = true;
        const people = new People(who);
        const id = people.uid;
        state.local = people;
        commit('addPeople', people);
        logger.info(`vuex-meeting:store init people ${id} current members keys ${Object.keys(state.members)}`);
    }
    /**
     * 加入会议
     * @param context
     * @param who
     */
    join(context, who) {
        const { state, commit, rootState } = context;
        who.isLocal = false;
        if (rootState.stream.streams[who.streamId]) {
            who.isStreamArrived = true;
            who.visble = true;
        }
        if (state.local.uid !== who.uid) {
            const m = new People(who);
            commit('addPeople', m);
        }
        // 如果屏幕控制者是major， 拉取屏幕后，屏幕变为major
        if (MemberUtils.isTv(who) &&
            state.major &&
            `${who.controllerId}` === `${state.major.uid}`) {
            state.major = who;
        }
    }
    /**
     * 批量加入
     * @param context
     * @param whos
     */
    addUsers(context, whos) {
        const { dispatch } = context;
        whos.forEach(w => {
            w.visble = false;
            dispatch('join', w);
        });
    }
    /**
     * 如果当前用户是电话人员就移除
     * @param context
     * @param streamId
     */
    leaveIfPhone(context, streamId) {
        const { state, members, commit } = context;
        let people;
        let self = this;
        members.forEach(m => {
            if (`${m.streamId}` === `${streamId}`) {
                people = m;
            }
        });
        if (people && people.type && people.type === 'phone') {
            commit('leave', people);
        }
    }
    /**
     * 流已经到达
     * @param context
     * @param streamId 流id
     */
    streamArrived(context, streamId) {
        const { commit, state } = context;
        const { members } = state;
        members.forEach(m => {
            if (`${m.streamId}` === `${streamId}`) {
                m.isStreamArrived = true;
                commit('updateMemberStatus', m);
            }
        });
    }
    /**
     * 参会人员离开
     * @param state
     */
    leave(context, who) {
        const { state, commit } = context;
        const { members } = state;
        members.delete(`${who.uid}`);
        commit('stream/removeStream', who.streamId, { root: true });
        state.members = new Map(members);
        logger.info(`vuex-meeting:store remove people ${who.uid} current people keys ${Object.keys(state.members)}`);
        if (state.major && `${who.uid}` === `${state.major.uid}`) {
            if (MemberUtils.isTv(who)) {
                state.major = members.get(who.controllerId) || MemberUtils.getLastMember(members);
            }
            else {
                state.major = MemberUtils.getLastMember(members);
            }
        }
    }
    /**
     * 清空参与人员
     */
    clear(context) {
        const { state, commit } = context;
        state.members = new Map();
        commit('stream/clear', {}, { root: true });
    }
};
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "members", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "major", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", People)
], Store.prototype, "getLocal", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Object)
], Store.prototype, "getLocalStatus", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Object)
], Store.prototype, "getLocalJson", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Boolean)
], Store.prototype, "hasSharing", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Number)
], Store.prototype, "getMemberCount", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Array)
], Store.prototype, "getTvMembers", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Number)
], Store.prototype, "getMembersCountAll", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", People)
], Store.prototype, "getSharing", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Array)
], Store.prototype, "sortMembers", null);
tslib_1.__decorate([
    Mutation('members'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "addPeople", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "checkChangedAndSync", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", People)
], Store.prototype, "getPeopleByStreamId", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", People)
], Store.prototype, "getPeopleByUId", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Boolean)
], Store.prototype, "checkAllStreamArrived", null);
tslib_1.__decorate([
    Mutation('local'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Object)
], Store.prototype, "setAudioStatus", null);
tslib_1.__decorate([
    Mutation('members'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object, Object]),
    tslib_1.__metadata("design:returntype", Object)
], Store.prototype, "setAudioStatusByMemberId", null);
tslib_1.__decorate([
    Mutation('local'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Object)
], Store.prototype, "setVideoStatus", null);
tslib_1.__decorate([
    Mutation('members'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object, Object]),
    tslib_1.__metadata("design:returntype", Object)
], Store.prototype, "setVideoStatusById", null);
tslib_1.__decorate([
    Mutation('local'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Object)
], Store.prototype, "changeLocalRole", null);
tslib_1.__decorate([
    Mutation('members'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Map)
], Store.prototype, "updateMemberStatus", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "localStatus", null);
tslib_1.__decorate([
    Mutation('major'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "updateMajorByUId", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "updateMemberPoorNetwork", null);
tslib_1.__decorate([
    Action(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "init", null);
tslib_1.__decorate([
    Action(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "join", null);
tslib_1.__decorate([
    Action(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "addUsers", null);
tslib_1.__decorate([
    Action(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "leaveIfPhone", null);
tslib_1.__decorate([
    Action(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "streamArrived", null);
tslib_1.__decorate([
    Action(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "leave", null);
tslib_1.__decorate([
    Action(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Object)
], Store.prototype, "clear", null);
Store = tslib_1.__decorate([
    StoreDecorator
], Store);
export default new Store();
//# sourceMappingURL=index.js.map