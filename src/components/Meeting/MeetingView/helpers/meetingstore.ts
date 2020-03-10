/**
 * @file meetingstore.ts
 * @author shijh
 *
 * 会议用户维护
 */
import store from '../../../../stores'

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
    displayName?: string,

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
    linkedUid : number
    visble: boolean = true
    onlineStatus: NetworkStatus = 'online'
    audio: 'on' | 'off' = 'on'
    video: 'on' | 'off' = 'on'
    displayName: string
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
        this.controllerId = opt.controllerId
        this.linkedUid = opt.linkedUid
        this.visble = !!opt.visble
        this.type = opt.type || 'user'
        this.isStreamArrived = !!opt.isStreamArrived
        this.onlineStatus = opt.onlineStatus || 'online'
        this.audio = opt.audio
        this.video = opt.video
        this.displayName = opt.displayName
    }
    setType(type: role): void {
        this.role = type
    }
    getType(): role {
        return this.role
    }
    setStatus(status: roleStatus): void {
        this.status = status
    }
    checkSharing(): boolean {
        return this.status === 'sharing'
    }
    isCreator(): boolean {
        return this.role === 'creator'
    }
    isPhone(): boolean {
        return this.type === 'phone'
    }
    isTv(): boolean {
        return this.type === 'tv'
    }
    isMicrophone(): boolean {
        return this.type === 'microphone' || this.type === 'android_microphone'
    }
    checkChanged(people): boolean {
        return this.status !== people.status || this.role !== people.role || this.video !== people.video || this.audio !== people.audio
    }
    setAudioStatus(disable?: boolean): void {
        this.audio = !disable ? 'on' : 'off'
    }
    setVideoStatus(disable: boolean): void {
        this.video = !disable ? 'on' : 'off'
    }
}

export class MeetingStore {
    map: Map<any, any>
    streamMap: Map<any, any>
    room: string | number
    local: People
    constructor() {
        this.map = new Map()
        this.streamMap = new Map()
    }
    init(who: PeopleOption): any {
        if (this.room && this.room !== who.room) {
            this.clear()
        }
        who.isLocal = true
        this.room = who.room
        who.isStreamArrived = true
        who.visble = true
        this.local = new People(who)
        this.map.set(this.local.uid, this.local)

        store.commit('meeting/addPeople', this.local)
    }

    join(who: PeopleOption): any {
        who.isLocal = false
        if (this.streamMap.get(who.streamId)) {
            who.isStreamArrived = true
            who.visble = true
        }

        if (this.local.uid !== who.uid) {
            let p = new People(who)
            this.map.set(`${p.uid}`, p)

            store.commit('meeting/addPeople', p)
            // this.resetSharingStatus(p)
        }
    }

    addUsers(whos: Array<PeopleOption>): any {
        whos.forEach(w => {
            w.visble = false
            this.join(w)
        })
    }

    resetSharingStatus(p) {
        this.map.forEach(p => {
            // TODO: 这个明显错了吧
            // if (p.uid !== p.uid && p.status === 'sharing') {
            //     p.status = 'meeting'
            // }
        })
    }

    leave(who: People): void {
        this.map.delete(`${who.uid}`)

        store.commit('meeting/leave', who.uid)
    }

    localStatus(status: roleStatus): Promise<any> {
        return new Promise((resovle, reject) => {
            this.local.setStatus(status)
            resovle()
        })
    }

    getLocal(): People {
        return new People(JSON.parse(JSON.stringify(this.local || {})))
    }

    getLocalJson(): any {
        return JSON.stringify(this.local)
    }

    clear(): void {
        this.map.clear()
    }

    hasSharing(): boolean {
        // 有不是本地的分享
        let flag = false
        let id = this.local.uid
        this.map.forEach(m => {
            if (m.checkSharing() && id !== m.uid) {
                flag = true
            }
        })
        return flag
    }

    getSharing(): People {
        let sharingOne
        let id = this.local.uid
        this.map.forEach(m => {
            if (m.checkSharing() && id !== m.uid) {
                sharingOne = m
            }
        })
        return sharingOne
    }

    leaveIfPhone(streamId): void {
        let people
        let self = this
        this.map.forEach((p) => {
            if (p.streamId === Number(streamId)) {
                people = p
            }
        })
        if (people && people.type && people.type === 'phone') {
            self.leave(people)
        }
    }

    getPeopleByStreamId(streamId): People {
        let people
        this.map.forEach((p) => {
            if (p.streamId === Number(streamId)) {
                people = p
            }
        })
        return people
    }

    getPeopleByUId(uid): People {
        let people
        this.map.forEach((p) => {
            if (`${p.uid}` === `${uid}`) {
                people = p
            }
        })
        return people
    }

    getMemberCount(): number {
        let count = 0
        this.map.forEach(p => {
            if (!p.isMicrophone() && !p.isTv()) {
                count++
            }
        })
        return count
    }

    getMembersCountAll(): number {
        let count = 0
        this.map.forEach(p => {
            count++
        })
        return count
    }

    getTvMembers(): Array<People> {
        let tvs = []
        this.map.forEach(p => {
            if (p.isTv()) {
                tvs.push(p)
            }
        })
        return tvs
    }

    sortMembers(majarId): Array<People> {
        const local = this.local
        let members = []
        let tvs = []
        let creators = []
        let microphones = []
        let joiners = []
        let sharing = []
        let orderMap = {}
        this.map.forEach(p => {
            p.visble = true

            if (p.checkSharing()) {
                sharing.push(p)
                orderMap[p.uid] = p
            } else if (p.isTv()) {
                tvs.push(p)
            } else if (p.isCreator() && p.uid !== local.uid && !orderMap[p.uid]) {
                creators.push(p)
                orderMap[p.uid] = p
            } else if (
                p.isMicrophone() && p.uid !== local.uid && !orderMap[p.uid]
            ) { // TODO: 控制麦克风的panel显示
                microphones.push(p)
                orderMap[p.uid] = p
            } else {
                orderMap[p.uid] = p
                joiners.push(p)
            }
        })
        if (majarId) {
            joiners.sort((a, b) => {
                if (a.streamId === majarId) {
                    return -1
                } else if (b.streamId === majarId) {
                    return 1
                } else {
                    return 0
                }
            })
        }
        if (microphones.length > 0) {
            microphones.forEach(m => {
                m.visble = false
            })
        }

        members = members.concat(sharing, tvs, creators, joiners, microphones)
        if (tvs.length > 0) {
            tvs.forEach(t => {
                creators.forEach(c => {
                    if (`${t.controllerId}` === `${c.uid}` && !c.checkSharing()) {
                        // 使用电视的panel 不用控制者的
                        c.visble = false
                    }
                })
            })
        }

        if (sharing.length === 0) {
            members.sort((a, b) => {
                return a.uid === local.uid ? -1 : 1
            })
        }
        return members
    }

    streamArrived(streamId): void {
        this.streamMap.set(streamId, true)
        this.map.forEach(m => {
            if (m.streamId === streamId) {
                m.isStreamArrived = true
            }
        })
    }

    checkAllStreamArrived(): boolean {
        let result = true
        this.map.forEach(m => {
            if (!m.isStreamArrived) {
                result = false
            }
        })
        return result
    }

    checkedMemebersChangeed(members): any {
        let changed = false
        let localLeave = true
        let local = this.local
        changed = members.length !== this.map.size
        members.forEach(p => {
            p.visble = true
            let o = this.map.get(p.uid)
            if (!o) {
                changed = true
            } else {
                if (o.checkChanged(p)) {
                    changed = true
                }
            }
            if (Number(p.uid) === Number(local.uid)) {
                localLeave = false
            }
        })
        if (changed) {
            this.clear()
            this.addUsers(members)
            if (!localLeave) {
                this.map.set(this.local.uid, this.local)
            }
        }
        return {
            changed: changed,
            localLeave: localLeave
        }
    }

    setAudioStatus(disable): void {
        this.local.setAudioStatus(disable)
    }

    setVideoStatus(disable): void {
        this.local.setVideoStatus(disable)
    }

    updateMemberStatus(member): void {
        if (this.getPeopleByUId(member.uid)) {
            this.join(member)
        }
    }

    getMembers(): Array<People> {
        let members = []
        this.map.forEach(p => {
            members.push(p)
        })
        return members
    }
}
