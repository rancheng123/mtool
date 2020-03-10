export class People {
    constructor(opt) {
        this.isStreamArrived = false;
        this.type = 'user';
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
        this.controllerId = opt.controllerId;
        this.linkedUid = opt.linkedUid;
        this.visble = !!opt.visble;
        this.type = opt.type || 'user';
        this.isStreamArrived = !!opt.isStreamArrived;
        this.onlineStatus = opt.onlineStatus || 'online';
        this.audio = opt.audio;
        this.video = opt.video;
        this.displayName = opt.displayName;
    }
    setType(type) {
        this.role = type;
    }
    getType() {
        return this.role;
    }
    setStatus(status) {
        this.status = status;
    }
    checkSharing() {
        return this.status === 'sharing'
    }
    isCreator() {
        return this.role === 'creator'
    }
    isPhone() {
        return this.type === 'phone'
    }
    isTv() {
        return this.type === 'tv'
    }
    isMicrophone() {
        return this.type === 'microphone' || this.type === 'android_microphone'
    }
    checkChanged(people) {
        return this.status != people.status || this.role != people.role || this.video != people.video || this.audio != people.audio;
    }
    setAudioStatus(disable) {
        this.audio = !disable ? 'on' : 'off';
    }
    setVideoStatus(disable) {
        this.video = !disable ? 'on' : 'off';
    }
}
export class MeetingStore {
    constructor() {
        this.map = new Map();
        this.streamMap = new Map();
    }
    init(who) {
        if (this.room && this.room !== who.room) {
            this.clear();
        }
        who.isLocal = true;
        this.room = who.room;
        who.isStreamArrived = true;
        who.visble = true;
        this.local = new People(who);
        this.map.set(this.local.uid, this.local);
    }

    async join(who) {
        who.isLocal = false;
        if (this.streamMap.get(who.streamId)) {
            who.isStreamArrived = true;
            who.visble = true;
        }

        if (this.local.uid !== who.uid) {
            let p = new People(who);
            this.map.set(p.uid + '', p);
            this.resetSharingStatus(p);
        }
    }

    addUsers(whos) {
        whos.forEach(w => {
            w.visble = false;
            this.join(w);
        });
    }

    resetSharingStatus(p) {
        this.map.forEach(p => {
            // TODO: 这个明显错了吧
            if (p.uid !== p.uid && p.status === 'sharing') {
                p.status = 'meeting';
            }
        });
    }

    leave(who) {
        this.map.delete(who.uid + '');
    }

    localStatus(status) {
        return new Promise((resovle, reject) => {
            this.local.setStatus(status);
            resovle();
        });
    }

    getLocal() {
        return new People(JSON.parse(JSON.stringify(this.local || {})));
    }

    getLocalJson() {
        return JSON.stringify(this.local);
    }

    clear() {
        this.map.clear();
    }

    hasSharing() {
        // 有不是本地的分享
        let flag = false;
        let id = this.local.uid;
        this.map.forEach(m => {
            if (m.checkSharing() && id != m.uid) {
                flag = true;
            }
        });
        return flag;
    }

    getSharing() {
        let sharingOne = false
        let id = this.local.uid
        this.map.forEach(m => {
            if (m.checkSharing() && id != m.uid) {
                sharingOne = m;
            }
        });
        return sharingOne
    }

    leaveIfPhone(streamId) {
        let people
        let self = this
        this.map.forEach((p) => {
            if (p.streamId === Number(streamId)) {
                people = p;
            }
        });
        if(people && people.type && people.type === 'phone') {
            self.leave(people)
        }
    }

    getPeopleByStreamId(streamId) {
        let people;
        this.map.forEach((p) => {
            if (p.streamId === Number(streamId)) {
                people = p;
            }
        });
        return people;
    }

    getPeopleByUId(uid) {
        let people;
        this.map.forEach((p) => {
            if (p.uid + '' === uid + "") {
                people = p;
            }
        });
        return people;
    }

    getMemberCount() {
        let count = 0
        this.map.forEach(p => {
            if(!p.isMicrophone() && !p.isTv()) {
                count++
            }
        })
        return count
    }

    getMembersCountAll() {
        let count = 0
        this.map.forEach(p => {
            count++
        })
        return count
    }

    getTvMembers() {
        let tvs = []
        this.map.forEach(p => {
            if(p.isTv()) {
                tvs.push(p)
            }
        })

        return tvs
    }

    sortMembers(majarId) {
        const local = this.local;
        let members = [];
        let tvs = [];
        let creators = [];
        let microphones = [];
        let joiners = [];
        let sharing = [];
        let orderMap = {};
        this.map.forEach(p => {
            p.visble = true;

            if (p.checkSharing()) {
                sharing.push(p);
                orderMap[p.uid] = p;
            }
            else if (p.isTv()) {
                tvs.push(p);
            }
            else if (p.isCreator() && p.uid !== local.uid && !orderMap[p.uid]) {
                creators.push(p);
                orderMap[p.uid] = p;
            }
            // TODO: 控制麦克风的panel显示
            else if(p.isMicrophone() && p.uid !== local.uid && !orderMap[p.uid]) {
                microphones.push(p)
                orderMap[p.uid] = p;
            }
            else {
                orderMap[p.uid] = p;
                joiners.push(p);
            }
        });
        if (majarId) {
            joiners.sort((a, b) => {
                if (a.streamId == majarId) {
                    return -1;
                }
                else if (b.streamId == majarId) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
        }
        if (microphones.length > 0) {
            microphones.forEach(m => {
                m.visble = false;
            });
        }
        members = members.concat(sharing, tvs, creators, joiners, microphones);
        if (tvs.length > 0) {
            tvs.forEach(t => {
                creators.forEach(c => {
                    if (t.controllerId + '' == c.uid + '' && !c.checkSharing()) {
                        // 使用电视的panel 不用控制者的
                        c.visble = false;
                    }
                });
            });
        }

        if (sharing.length === 0) {
            members.sort((a, b) => {
                return a.uid === local.uid ? -1 : 1;
            });
        }
        return members;
    }

    streamArrived(streamId) {
        this.streamMap.set(streamId, true);
        this.map.forEach(m => {
            if (m.streamId === streamId) {
                m.isStreamArrived = true;
            }
        });
    }

    checkAllStreamArrived() {
        let result = true;
        this.map.forEach(m => {
            if (!m.isStreamArrived) {
                result = false;
            }
        });
        return result;
    }

    checkedMemebersChangeed(members) {
        let changed = false;
        let localLeave = true;
        let local = this.local;
        changed = members.length !== this.map.size;
        members.forEach(p => {
            p.visble = true;
            let o = this.map.get(p.uid);
            if (!o) {
                changed = true;
            }
            else {
                if (o.checkChanged(p)) {
                    changed = true;
                }
            }
            if (Number(p.uid) === Number(local.uid)) {
                localLeave = false;
            }
        });
        if (changed) {
            this.clear();
            this.addUsers(members);
            if (!localLeave) {
                this.map.set(this.local.uid, this.local);
            }
        }
        return {
            changed: changed,
            localLeave: localLeave
        };
    }

    setAudioStatus(disable) {
        this.local.setAudioStatus(disable);
    }

    setVideoStatus(disable) {
        this.local.setVideoStatus(disable);
    }

    updateMemberStatus(member) {
        if (this.getPeopleByUId(member.uid)) {
            this.join(member);
        }
    }

    getMembers() {
        let members = [];
        this.map.forEach(p => {
            members.push(p);
        });
        return members;
    }
}
