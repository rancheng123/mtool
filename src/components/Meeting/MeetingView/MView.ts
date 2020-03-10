import {
    Message,
    Popover
} from 'element-ui'
const {
    clipboard
} = require('electron')

import SmartOfficeAPI from '../../../service/SmartOfficeAPI'
import meetingService from '../../../service/meetingService'
import AgoraError from '../../../helpers/error/agoraerror'
import InviteModal from '../InviteModal/index.vue'
import TvOrShare from './TvOrShare.vue'
import inviter from '../InviteUser/InviteUser.vue'
import Callphone from '../callPhone/CallPhone.vue'
import PhoneHelper from '../../../helpers/phoneHelper'

import ViewComponent from './View.vue'

import AgoraWebRTC from './helpers/agorawebrtc'
import {
    SignalingClient
} from '../../../helpers/agora/signClient'

import {
    DomHelper
} from '../../../helpers/agora/domhelper'
import {
    MeetingStore
} from './helpers/meetingstore'
import {
    capture
} from '../../../helpers/agora/chrome'
import { MemberUtils } from '../../../stores/helpers'

Vue.use(Popover)

const electron = require('electron')
const remote = electron.remote
const ipc = electron.ipcRenderer
const Promise = require('bluebird')
const os = require('os')
const platform = os.platform()

const uuid = require('uuid')
const logger = remote.require('./app/logger')
const config = remote.require('./app/configuration')
// const agoragent = remote.require('./app/agoragent')
const deviceCtl = remote.require('./app/devicecontroll')
const MQ = remote.require('./app/mqmessage')

const MtoolUUID = config.readSettings('mtoolUUID')
const mToolVideoResolution = config.readSettings('mToolVideoResolution')
let HasReadGuide = config.readSettings('HasReadGuide')
import { Getter, State, Action, Mutation  } from 'vuex-class'
import { mapState } from 'vuex'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'
import { getPeopleByStreamId, getPeopleByUId } from './helpers'
import Handle from './mixins/handle'

@Component({
    components: {
        'Inviter': inviter,
        'CallPhone': Callphone,
        'ViewComponent': ViewComponent,
        'TvShare': TvOrShare,
        InviteModal
    }
})
export default class MView extends mixins(Handle) {
    @Prop() screen: string
    @Prop() room: string | number
    @Prop() tostart: boolean
    @Prop() roomInfo: any
    @Prop() isVip: boolean
    @Prop() toquit: any

    @Getter('meeting/major') storeMajor: any
    @Getter('isFullscreenMode') isFullscreenMode: boolean
    @Getter('isShowHeader') isStoreShowHeader: boolean
    @Getter('isShowInviteMenu') isShowInviteMenu: boolean
    @Getter('meeting/members') storeMembers: Array<any>
    @Getter('meeting/getLocal') storeGetLocal: any
    @Getter('meeting/getLocalJson') storeGetLocalJson: any
    @Getter('meeting/hasSharing') storeHasSharing: any
    @Getter('meeting/getMemberCount') storeGetMemberCount: any
    @Getter('meeting/getTvMembers') storeGetTvMembers: any
    @Getter('meeting/getMembersCountAll') storeGetMembersCountAll: any
    @Getter('meeting/sortMembers') storeSortMembers: any
    @Getter('meeting/getSharing') storeGetSharing: any
    @Mutation('meeting/getPeopleByStreamId') storeGetPeopleByStreamId: any
    @Mutation('meeting/addPeople') storeAddPeople: any
    @Mutation('meeting/getPeopleByUId') storeGetPeopleByUId: any
    @Mutation('meeting/checkAllStreamArrived') storeCheckAllStreamArrived: any
    @Mutation('meeting/setAudioStatus') storeSetAudioStatus: any
    @Mutation('meeting/setVideoStatus') storeSetVideoStatus: any
    @Mutation('meeting/updateMemberStatus') storeUpdateMemberStatus: any
    @Mutation('meeting/localStatus') storeLocalStatus: any
    @Mutation('meeting/checkChangedAndSync') storeCheckChangedAndSync: any
    @Mutation('meeting/changeLocalRole') storeChangeLocalRole: any
    @Mutation('meeting/updateMajorByUId') storeUpdateMajorByUId: any
    @Mutation('toFullscreenMode') storeToFullscreenMode: any
    @Mutation('toNormalMode') storeToNormalMode: any
    @Mutation('meeting/updateMemberPoorNetwork') storeUpdateMemberPoorNetwork: any
    @Action('meeting/join') storeJoin: any
    @Action('meeting/leave') storeLeave: any
    @Action('meeting/clear') storeClear: any
    @Action('meeting/init') storeMemberInit: any
    @Action('meeting/addUsers') storeAddUsers: any
    @Action('meeting/leaveIfPhone') storeLeaveIfPhone: any
    @Action('meeting/streamArrived') storeStreamArrived: any
    
    hasReadGuide: boolean = !!HasReadGuide
    signClient: any
    // 分享中视频开关控制
    isShareMutedVideo: boolean = false
    isTest: boolean = false
    showInviteLink: boolean = false
    showSIP: boolean = false
    isSIPUser: boolean = false
    showInviteContent: boolean = false
    sipPhonenum: string = ''
    callingPhone: string = ''
    linkingTV: boolean = false
    oldmode: string = ''
    agoraClient: any = null
    isCreator: boolean = false
    attendToHome: boolean = false
    isInitialing : boolean = true
    notifiction: any = {
        type: 'info',
        message: ''
    }
    screenStatus: any = {
        video: false,
        speaker: false,
        mic: false
    }
    screenDeviceStatus: any = {
        video: false,
        speaker: false,
        mic: false,
        disableCamera: true,
        disableMic: true,
        disableSpeaker: true
    }
    MQInstance: any = MQ.getInstance()
    meetingStore: any = new MeetingStore()
    userInfo: any = {}
    isCurrentRouter: boolean = false
    createClientFial: boolean = false
    createRoomStatus: boolean = false
    isMutedAudio: boolean = false
    isMutedVideo: boolean = false
    isSharingScreen: boolean = false
    sharingProcessing: boolean = false
    joinScreen: string = ''
    isJoined: boolean = false
    localStreamId: string = ''
    oldlocalStreamId: string = ''
    afterUserId: any = null
    dynamicKey: string = ''
    showJoinRoonTip: boolean = false
    visiblewlist: boolean = false
    windowRefreshTimer: any = null
    windows: Array<any> = []
    processing: any = {
        mic: false,
        camera: false,
        share: false
    }
    error: any = {
        screen_not_exist: false,
        empty_screen: false,
        room_is_full: false,
        room_not_exist: false,
        can_not_start: false,
        screen_not_support: false,
        screenid_error: false
    }
    inviteScreen: string = ''
    hasSharing: boolean = false
    invitePopover: any = null
    invitePopoverShow: boolean = false
    repaintTimer: any = null
    $route: any

    get isShowHeader() {
        return this.isFullscreenMode ? this.isStoreShowHeader : true
    }

    @Watch('$route')
    routeChange() {
        this.resetStatus()
        this.isCurrentRouter = this.$route.path === '/app/meeting'
    }
    @Watch('tostart')
    async startMeeting(n, o) {
        const self: any = this
        let room = this.room
        let roomInfo = this.roomInfo
        logger.info(`Step: meeting startMeeting(newval:${n}, oldval:${o}) room:${room}`)
        let startTime = Number(new Date())
        logger.info(`SmartOfficeAPI.account start`)
        try {
            const res = await SmartOfficeAPI.account()
            let endTime = Number(new Date())
            logger.info(`SmartOfficeAPI.account time-consume:${endTime - startTime}`)
            logger.info(`SmartOfficeAPI.account:${JSON.stringify(res)}`)
            if (res && res.sip) {
                self.isSIPUser = true
            }
        } catch (err) {
            logger.error(`SmartOfficeAPI.account error:${JSON.stringify(err)}`)
        }

        self.attendToHome = false
        self.signClient = new SignalingClient()
        if (n === 'yes' && !self.isVip) {
            if (self.screen) {
                self.isCreator = true
                this.showJoinRoonTip = false
            }
            let streamId = MQ.generateNumberID()
            let joiner = this.roomInfo.member

            this.localStreamId = joiner ? joiner.streamId : streamId
            logger.info(`Step: meeting startMeeting() localStreamId:${this.localStreamId}`)

            this.storeMemberInit(joiner || {
                id: this.userInfo.id + '',
                uid: this.userInfo.id + '', // electron-main 生成
                streamId: self.localStreamId,
                userName: this.userInfo.fullName || '',
                room: this.room,
                screen: this.screen,
                role: self.isCreator ? 'creator' : 'joiner'
            })
            logger.info(`roominfo: `, JSON.stringify(this.roomInfo))
            self.startmqtt()
        }
        if (n === 'yes' && self.isVip) {
            if (self.screen) {
                self.isCreator = true
                if (this.roomInfo.isVip) {
                    this.showJoinRoonTip = true
                }
            }
            let streamId = MQ.generateNumberID()
            let joiner = this.roomInfo.member

            this.localStreamId = joiner ? joiner.streamId : streamId
            logger.info(`Step: meeting vip startMeeting() localStreamId:${this.localStreamId}`)
            this.storeMemberInit(joiner || {
                id: this.userInfo.id,
                uid: this.userInfo.id,
                streamId: self.localStreamId,
                userName: this.userInfo.fullName || '',
                room: this.room,
                screen: this.screen,
                type: 'user',
                role: self.isCreator ? 'creator' : 'joiner'
            })
            logger.info(`roominfo:`, JSON.stringify(this.roomInfo))
            // 更改到有顶部蓝色条的模式
            self.vipShowMode()
            self.startmqtt()
        }
    }
    @Watch('isCreator')
    checkShowJoinTip(n, o) {
        logger.debug(`checkShowJoinTip n:${JSON.stringify(n)}`)
        if (!n) {
            if (this.agoraClient) {
                let members = this.storeMembers
                if (members.length > 1) {
                    this.showJoinRoonTip = false
                } else {
                    this.showJoinRoonTip = true
                }
                this.screenStatus = {
                    video: false,
                    speaker: false,
                    mic: false
                }
                this.screenDeviceStatus.disableCamera = true
                this.screenDeviceStatus.disableMic = true
                this.screenDeviceStatus.disableSpeaker = true
            }
        } else {
            this.storeToNormalMode()
        }
    }
    @Watch('toquit')
    quit(n, o) {
        const self: any = this
        if (n === true) {
            logger.info(`quit()`)
            self.closeMeeting()
        }
    }
    @Watch('room')
    reset() {
        this.showInviteContent = false
    }

    mounted() {
        const self: any = this
        self.userInfo = config.readSettings('userInfo')
        let con = document.querySelector('#meeting-view-con')
        let resizeTimer
        window.addEventListener('resize', () => {
            logger.info(`window resize`)
            if (self.agoraClient) {
                setTimeout(function() {
                    logger.info(`resize streams fixSize`)
                    self.agoraClient.streams.forEach(s => {
                        // 等切换完了layout在fixsize
                        s.autoFixSize()
                    })
                }, 150)
            }
        })
        window.addEventListener('endcall', (res: any) => {
            logger.info(`&&&&&&&&&&&&&&& endcall ${JSON.stringify(res)}`)
            if (self.agoraClient && self.signClient && res.phoneId) {
                let people = getPeopleByUId(this.storeMembers, res.phoneId)
                if (people) {
                    self.signClient.endcall('sipgw_mxj' + people.uid)
                    self.storeLeave(people)
                    self.MQPublish(self.room, 'leave', people)
                }
            }
        })
        this.invitePopover = this.$refs['addscreen']
    }

    async startmqtt() {
        const self = this
        let agoraId = config.readSettings('agoraId')
        let expiredTime = Math.floor(Date.now() / 1000) + 3600 * 24
        let tokenReqOpt = {
            appId: agoraId,
            account: `${self.localStreamId}`,
            expiredTsInSeconds: expiredTime
        }
        try {
            const result = await meetingService.signalToken(tokenReqOpt)
            self.signClient.login(agoraId, result.token, `${self.localStreamId}`, function(uid) {
                logger.info(`signClient.login success`)
                self.afterUserId = uid
                self.mqttInit()
            })
        } catch (err) {
            logger.error(`get signal token error: ${err}`)
        }
    }

    switchMode() {
        const self: any = this
        return function(toFullscreenMode) {
            logger.info(`swtichMode toFullscreenMode:${toFullscreenMode}`)
            self.$store.state.isFullscreenMode = toFullscreenMode
        }
    }

    sipCall(callingPhone) {
        const self: any = this
        self.callingPhone = callingPhone
        if (self.callingPhone === '') {
            self.error.empty = true
            return
        }
        self.sipPhonenum = self.callingPhone
        self.callingPhone = ''
        self.showSIP = false
        logger.info(`sipCall self.sipPhonenum:${self.sipPhonenum}`)
        let streamId = MQ.generateNumberID()
        let sipMember = {
            id: self.sipPhonenum,
            uid: `${self.sipPhonenum}`,
            streamId: streamId,
            userName: self.sipPhonenum,
            room: self.room,
            type: 'phone',
            screen: self.screen,
            role: 'joiner'
        }
        let old = getPeopleByUId(this.storeMembers, self.sipPhonenum)
        if (old) {
            self.ErrorHandle(`${self.sipPhonenum}已在会议中`)
            return
        }

        // if (self.storeGetMembersCountAll === 7) {
        //     self.ErrorHandle('参会人数已满')
        // } else {
        self.storeJoin(sipMember)
        logger.info(`sipCall MQ.publish action:join member:${JSON.stringify(sipMember)}`)
        self.MQPublish(self.room, 'join', sipMember)
        let onInviteReceivedByPeer = function(res) {
            logger.info(`sipCall onInviteReceivedByPeer:${self.sipPhonenum} success`)
        }
        let onInviteFailed = function(res) {
            logger.error(`sipCall onInviteFailed:${self.sipPhonenum} failed`)
        }
        // 之前显示拨打页面，success之后显示默认页面
        let onInviteEndByPeer = function(res) {
            logger.info(`sipCall onInviteEndByPeer:${self.sipPhonenum} success`)
        }
        self.signClient.call('sipgw_mxj' + self.sipPhonenum, streamId, onInviteReceivedByPeer, onInviteFailed, onInviteEndByPeer)
        // }

    }
    showHeader(event) {
        let { clientY } = event
        if (clientY >= 30 && this.isFullscreenMode) {
            this.$store.state.isShowHeader = true
            logger.info(`showHeader ${this.$store.state.isShowHeader}`)
        }
    }
    hideHeader() {
        const self: any = this
        if (this.isFullscreenMode && !this.invitePopoverShow) {
            self.$store.state.isShowHeader = false
            logger.info(`hideHeader ${self.$store.state.isShowHeader}`)
        }
    }
    closeInviteLink() {
        this.showInviteLink = false
    }
    closeSip() {
        this.showSIP = false
    }
    showInviteLinkPanel() {
        this.showSIP = false
        this.showInviteLink = !this.showInviteLink
    }

    showSIPPanel() {
        this.showInviteLink = false
        this.showSIP = !this.showSIP
    }
    toggleTrigger() {
        this.handleReadGuide()
        this.$store.state.isShowInviteMenu = !this.$store.state.isShowInviteMenu
    }
    /**
     * 当点击按钮 将阅读引导标志置为true， 并写入配置文件
     */
    handleReadGuide() {
        if (this.hasReadGuide) return
        this.hasReadGuide = true
        HasReadGuide = true
        config.saveSettings('HasReadGuide', this.hasReadGuide)
    }
    resetStatus() {
        const self: any = this
        self.agoraClient = null
        self.isShareMutedVideo = false
        self.isTest = false
        self.isCreator = false
        self.$store.state.isFullscreenMode = false
        self.$store.state.isShowHeader = true
        self.dynamicKey = ''
        self.callingPhone = ''
        self.sipPhonenum = ''
        self.afterUserId = ''
        self.linkingTV = false
        self.time = {
            label: '',
            count: 0,
            timer: null
        }
        self.userStatus = {
            uid: '',
            status: ''
        }
        self.notifiction = {
            type: '',
            message: ''
        }
        self.isCurrentRouter = false
        self.createClientFial = false
        self.createRoomStatus = false
        self.showJoinRoonTip = false
        self.isMutedAudio = false
        self.isMutedVideo = false
        self.isSharingScreen = false
        self.joinScreen = ''
        self.localStreamId = ''
        self.inviteScreen = ''
        self.windows = []
        self.isJoined = false
        self.hasSharing = false
        self.isInitialing = true
        self.error = {
            screen_not_exist: false,
            empty_screen: false,
            room_is_full: false,
            room_not_exist: false,
            can_not_start: false,
            screen_not_support: false,
            screenid_error: false
        }
        // 清空拨打
        PhoneHelper.reset()
        PhoneHelper.resetNames()

        this.meetingStore = new MeetingStore()
        this.storeClear()
        clearInterval(this.time.timer)

        if (this.invitePopover) {
            this.invitePopover.doClose()
        }
    }

    async closeMeeting(e?: any, opt?: any) {
        logger.info(`closeMeeting()`)
        const self: any = this
        let room = this.room
        let local = self.storeGetLocal
        clearInterval(this.time.timer)
        logger.debug(`closeMeeting mq leave local ${JSON.stringify(local)}`)
        this.MQPublish(self.room, 'leave', local, () => {
            MQ.close()
            if (self.agoraClient) {
                // 离开后不显示错误信息
                try {
                    self.agoraClient.on('global', (e) => {})
                    self.agoraClient.leave(() => {
                        logger.info(`######### agora leave`)
                    }, (err) => {
                        logger.error(`agora leave fail ${JSON.stringify(err)}`)
                    })
                } catch (error) {
                    logger.info(`agora leave error:` + error)
                }
                self.resetStatus()
            } else {
                self.resetStatus()
            }
            self.attendToHome = true
            self.$router.replace({
                path: '/app/home',
                query: {
                    redirect: (opt || {}).redirect
                }
            })

            ipc.send('renderer-command', {
                'command': 'recoverDpi'
            })
        })

        if (this.room && (this.screen || this.inviteScreen) && (this.isCreator || this.roomInfo.isVip)) {
            let startTime = Number(new Date())
            try {
                const res = await SmartOfficeAPI.freeScreen(this.room, this.screen)
                let endTime = Number(new Date())
                logger.info(`SmartOfficeAPI.freeScreen time-consume:${endTime - startTime}`)
            } catch (err) {
                logger.error(`SmartOfficeAPI.freeScreen error: ${JSON.stringify(err)}}`)
            }
            self.inviteScreen = ''
            self.isCreator = false
            self.attendToHome = true
            self.$router.replace({
                path: '/app/home'
            })

            ipc.send('renderer-command', {
                'command': 'recoverDpi'
            })
        }
    }

    initAgoraClient() {
        let agoraId = config.readSettings('agoraId')
        logger.info(`Step: meeting initAgoraClient() agoraId:${agoraId} mToolVideoResolution:${mToolVideoResolution}`)
        const self: any = this
        let room = this.room
        let agoraClient = new AgoraWebRTC({
            appId: agoraId,
            roomName: room,
            signClient: self.signClient,
            switchHandler: this.switchMode(),
            disableSubcribe: false,
            videoProfile: mToolVideoResolution || '720P',
            useSideLayout: true,
            localStreamConfig: {
                audio: true
            }
        })

        self.agoraClient = agoraClient

        if (this.roomInfo.users.length > 0) {
            this.storeAddUsers(this.roomInfo.users)
            logger.info(`initAgoraClient memberCount:${self.storeGetMemberCount}`)
            if (this.storeHasSharing) {
                // 有分享全屏模式
                let sharingOne = this.storeGetSharing
                if (sharingOne) {
                    this.storeUpdateMajorByUId(sharingOne.uid)
                    this.storeToFullscreenMode()
                }
            }
        }

        agoraClient.on('global', (e) => {
            console.log('global event', e.type, e)
            self.handleAgoraEvent(e)
        })

        logger.info(`Step: meeting agoraClient.joinChannel() -- start room:${self.room} localStreamId:${self.localStreamId}`)
        let joinChannelstartTime = Number(new Date())

        agoraClient.joinChannel().then(() => {
            // streamId 最大值为4294967295，如超过则设置视频流id会失效
            let joinChannelendTime = Number(new Date())
            logger.info(`Step: meeting agoraClient.joinChannel time-consume:${joinChannelendTime - joinChannelstartTime}`)
            // time-consuming:${endTime - startTime}
            logger.info(`Step: meeting agoraClient.joinRoom(${room},${self.localStreamId}) start`)
            let joinRoomstartTime = Number(new Date())

            let opt = {
                'appID': agoraClient.appId,
                'channel': self.room + '',
                'expiredTs': 0,
                'salt': Math.floor(Math.random() * 1000000),
                'ts': Math.floor(Number(new Date()) / 1000),
                'uid': self.localStreamId
            }

            return meetingService.dynamicKey(opt).then(res => {
                if (res.status) {
                    // 获得key
                    self.dynamicKey = res.key

                    // param key, channel, userid,
                    agoraClient.joinRoom(res.key, self.room + '', self.localStreamId, (err) => {
                        let joinRoomendTime = Number(new Date())
                        logger.info(`Step: meeting agoraClient.joinRoom(${room},${self.localStreamId}) time-consume:${joinRoomendTime - joinRoomstartTime}  self.screen:${self.screen}`)
                        if (err) {
                            logger.error(`agoraClient.joinRoom err:${err}`)
                            self.ErrorHandle('当前网络异常，请稍后重试')
                            self.closeMeeting()
                            return
                        }

                        if (self.screen) {
                            // 创建会议
                            logger.info(`Step: meeting create meeting`)
                            self.createRoom()
                        } else {
                            // 加入会议
                            logger.info(`Step: meeting join meeting self.room:${self.room}`)
                            // so统计api
                            logger.info(`Step: SmartOfficeAPI.joinMeeting(self.room:${self.room})`)

                            let joinMeetingstartTime = Number(new Date())
                            return SmartOfficeAPI.joinMeeting(self.room).then((res) => {
                                self.isInitialing = false
                                let joinMeetingendTime = Number(new Date())
                                self.countTime(self.roomInfo.duration)
                                logger.info(`SmartOfficeAPI.joinMeeting(${self.room}) time-consume:${joinMeetingendTime - joinMeetingstartTime} response:${JSON.stringify(res)}`)
                            })
                        }
                    })

                } else {
                    logger.error(`meetingService.dynamicKey status false`)
                    self.ErrorHandle('获得dynammickey错误')
                    self.closeMeeting()
                    return
                }
            }).catch((err) => {
                logger.error(`meetingService.dynamicKey ${err}`)
                self.ErrorHandle('获得dynammickey错误')
                self.closeMeeting()
                return
            })

        }).catch((e) => {
            logger.info(`agoraClient.joinChannel()`)
            self.ErrorHandle('初始化视频失败, ERROR_AGORA_JoinChannel')
            self.closeMeeting()

            return
        })
    }
    getScreenDevice(inviteScreen) {
        const self: any = this
        logger.info(`Step: meeting getScreenDevice()`)
        let screen = inviteScreen || self.screen
        const agoraClient = this.agoraClient
        return new Promise((resolve, reject) => {
            if (screen) {
                logger.info(`Step: meeting SmartOfficeAPI.getScreenDevices(self.room:${self.room}, screen:${self.screen}) start`)
                let getScreenDevicesstartTime = Number(new Date())
                return SmartOfficeAPI.getScreenDevices(self.room, screen).then((res) => {
                    let getScreenDevicesendTime = Number(new Date())
                    logger.info(`Step: meeting  SmartOfficeAPI.getScreenDevices(self.room:${self.room}, screen:${self.screen}) time-consume:${getScreenDevicesendTime - getScreenDevicesstartTime} response: ${JSON.stringify(res)}`)
                    if (res.status) {

                        let ss = self.screenStatus
                        let sds = self.screenDeviceStatus
                        let data = res.data
                        if (data) {
                            ss.mic = data.isMicAvailable
                            sds.mic = data.isMicAvailable

                            ss.speaker = data.isSpeakerAvailable
                            sds.speaker = data.isSpeakerAvailable

                            ss.video = data.isCameraAvailable
                            sds.video = data.isCameraAvailable
                        }
                        /**
                         * 有外接麦克风，用外接
                         * 没有外接，用电脑。但是电脑和电视可以切换
                         */
                        logger.info(`Step: meeting SmartOfficeAPI.checkScreenExist(screen:${self.screen}) start`)
                        let startTime = Number(new Date())
                        return SmartOfficeAPI
                            .checkScreenExist(screen)
                            .then((checkScreeres) => {
                                let endTime = Number(new Date())
                                logger.info(`Step: meeting SmartOfficeAPI.checkScreenExist(screen:${self.screen}) time-consume:${endTime - startTime} response:${JSON.stringify(checkScreeres)}`)
                                if (checkScreeres.status) {
                                    let hasMic = checkScreeres.microphone
                                    let isMicOnline = !!checkScreeres.microphone && checkScreeres.microphone.deviceState === 'ONLINE'
                                    if (!hasMic || !isMicOnline) {
                                        logger.info(`Step: meeting getScreenDevice microphone offline`)
                                        return self.switchDevice('mic', false)
                                    } else if (isMicOnline) {
                                        logger.info(`Step: meeting getScreenDevice microphone online`)
                                        return self.switchDevice('mic', true)
                                    }
                                }
                            })
                    }
                    resolve()

                }).catch((err) => {
                    logger.error(`SmartOfficeAPI.getScreenDevices error:${JSON.stringify(err)}`)
                    resolve()
                })
            } else {
                resolve()
            }
        })

    }
    disableDevice(type) {
        switch (type) {
            case 'camera':
                if (this.agoraClient) {
                    this.agoraClient.toggleVideo(false)
                }
                break
            case 'speaker':
                deviceCtl.muteVolume()
                break
            case 'mic':
                deviceCtl.muteVolume()
                if (this.agoraClient) {
                    this.agoraClient.toggleAudio(false)
                }
                break
        }
    }
    async createRoom() {
        const self: any = this
        let roomInfo = this.roomInfo
        if (roomInfo.isFake) {
            self.isCreator = false
        }
        logger.info(`Step: meeting createRoom() start`)
        logger.info(`Step: meeting meetingService.startMeeting(self.room:${self.room}, member:${this.storeGetLocal})) start`)
        try {
            let startTime = Number(new Date())
            const res = await meetingService.startMeeting(self.room, this.storeGetLocal)
            let endTime = Number(new Date())
            logger.info(`Step: meeting meetingService.startMeeting time-consume:${endTime - startTime} response: ${JSON.stringify(res)}`)
            
            self.isInitialing = false
            if (res.status) {
                if (!roomInfo.isFake) {
                    if (!roomInfo.isVip) {
                        self.getScreenDevice()
                        self.controlScreen(self.screen)
                    } else {
                        logger.debug(`############# self.showJoinRoonTip = true`)
                        self.showJoinRoonTip = true
                    }
                } else {
                    self.showJoinRoonTip = true
                }
                self.countTime(res.duration)
            } else {
                logger.error(`创建会议失 res.status ${JSON.stringify(res.status)}`)
                self.ErrorHandle('创建会议失败，请重试')
                self.closeMeeting()
            }
            return res
        } catch (err) {
            self.ErrorHandle('创建会议失败，请重试')
            logger.error(`创建会议失 err ${JSON.stringify(err)}`)
            self.closeMeeting()
        }
    }
    handleAgoraEvent(e) {
        const self: any = this
        const w: any = window
        const Base64 = w.Base64
        let sds = self.screenDeviceStatus
        let ss = this.screenStatus
        let type = e.type
        logger.info(`Step: meeting handleAgoraEvent() start ` + type)
        let uid = this.userInfo.id
        let data = e.data || {}
        switch (type) {
            case 'error':
                self.createClientFial = true
                let err = e.error
                if (err) {
                    let error = AgoraError.handleError(e)
                    if (error.code) {
                        self.ErrorHandle(error)
                        if (error.code === 'CONNECTION_LOST') {
                            setTimeout(() => {
                                self.closeMeeting(null, {
                                    redirect: '/app/meeting'
                                })
                            }, 5000)

                        }
                    }
                }
                break
            case 'local-stream-audio':
                logger.info('agora:event local-stream-audio' + JSON.stringify(e))
                this.storeSetAudioStatus(data.muted)
                this.MQPublish(self.room, data.muted ? 'audio_muted' : 'audio_unmuted', self.storeGetLocal)
                if (e.data && sds.disableMic && !ss.mic || !this.isCreator) {
                    this.isMutedAudio = e.data.muted
                }
                sds.disableMic = true
                self.processing.mic = false
                break
            case 'local-stream-video':
                logger.info('agora:event local-stream-video' + JSON.stringify(e))
                this.storeSetVideoStatus(data.muted)
                this.MQPublish(self.room, data.muted ? 'video_muted' : 'video_unmuted', self.storeGetLocal)
                logger.info('local-stream-video' + JSON.stringify(e.data))
                if (!e.notChange && (e.data && sds.disableCamera && !ss.video || !this.isCreator)) {
                    this.isMutedVideo = e.data.muted
                }
                sds.disableCamera = true
                self.processing.camera = false
                break
            case 'peer-leave':
                logger.info('agora:event peer-leave', e.data)
                let people = getPeopleByStreamId(this.storeMembers, e.data)
                if (people && people.type && people.type === 'phone') {
                    self.storeLeave(people)
                    this.MQPublish(self.room, 'leave', people)
                }
                break
            case 'start-share-screen':
                logger.info(`agora:event start-share-screen and stop retina`)
                if (e.status) {
                    this.storeLocalStatus('sharing')
                    this.MQPublish(self.room, 'share_start', self.storeGetLocal)
                    if (ss.mic) {
                        this.agoraClient.toggleAudio(false)
                    }
                    if (this.isMutedAudio) {
                        this.agoraClient.toggleAudio(false)
                    }
                    ipc.send('renderer-command', {
                        'command': 'changeDpi'
                    })
                } else {
                    this.storeLocalStatus('meeting')
                }
                break
            case 'stop-share-screen':
                logger.info(`agora:event stop-share-screen ${JSON.stringify(e)} start retina`)
                if (e.status) {
                    this.storeLocalStatus('meeting')
                    this.MQPublish(self.room, 'share_stop', self.storeGetLocal)
                    if (ss.mic) {
                        this.agoraClient.toggleAudio(false)
                    }
                    if (this.isMutedAudio) {
                        this.agoraClient.toggleAudio(false)
                    }
                    ipc.send('renderer-command', {
                        'command': 'recoverDpi'
                    })
                } else {
                    this.storeLocalStatus('sharing')
                }
                break
            case 'subscribe_stream':
                logger.info('subscribe_stream', e.data)
                let mode = this.$store.state.isFullscreenMode ? 'fullscreen' : 'normal'
                // self.agoraClient.layoutController.switchLayout(mode)
                // setTimeout(function() {
                //     self.agoraClient.autoSize()
                // }, 5000)

                this.fireRelayout(e.data)
                break
            case 'init_local_stream':
                // this.agoraClient.showInfoByStore(self.meetingStore)
                break
            case 'init_local_stream_fail':
                logger.error(`init_local_stream_fail e:${JSON.stringify(e)}`)
                break
        }
    }
    checkStatus(errorName) {
        const self: any = this
        let error = this.error[errorName]
        return setInterval(() => {
            let time = Number(new Date().getTime())
            if (time - error.time > 5 * 1000) {
                clearInterval(error.timer)
                self.error.status = false
            }
        }, 1000)
    }

    leave(e) {
        this.closeMeeting(e)
    }
    toggleSpeaker() {
        let ss = this.screenStatus
        let sds = this.screenDeviceStatus
        if (ss.speaker && this.isCreator) {
            let na = !sds.speaker
            let startTime = Number(new Date())
            SmartOfficeAPI.constrolDevice(this.room, this.inviteScreen || this.screen, {
                name: 'speaker',
                action: na ? 'enable' : 'disable'
            }).then(() => {
                let endTime = Number(new Date())
                sds.speaker = !sds.speaker
                logger.info(`SmartOfficeAPI.constrolDevice time-consume:${endTime - startTime}`)
            }).catch((err) => {
                console.log(err)
            })
        } else {
            ipc.send('mute-systemvolume')
        }
    }
    toggleAudio(e) {
        if (e) {
            e.preventDefault()
            e.stopPropagation()

            let targetClasses = e.target.classList.value
            let isTriggeredByInValideClassName = targetClasses.indexOf('toggle-btn') < 0
            let deviceSwithDom = document.getElementsByClassName('device-switch')
            if (deviceSwithDom && deviceSwithDom.length > 0) {
                if (deviceSwithDom[0].contains(e.target) && isTriggeredByInValideClassName) {
                    return
                }
            }
        }

        const self: any = this
        if (self.processing.mic) {
            return
        }
        self.processing.mic = true
        let ss = this.screenStatus
        let sds = this.screenDeviceStatus
        if (ss.mic && this.isCreator) {
            let na = !sds.mic
            let startTime = Number(new Date())
            return SmartOfficeAPI.constrolDevice(this.room, this.inviteScreen || this.screen, {
                name: 'mic',
                action: na ? 'enable' : 'disable'
            }).then(() => {
                let endTime = Number(new Date())
                logger.info(`SmartOfficeAPI.constrolDevice time-consume:${endTime - startTime}`)
                sds.mic = !sds.mic
                self.isMutedAudio = !self.isMutedAudio
                self.processing.mic = false
            }).catch(() => {
                self.processing.mic = false
            })
        } else {
            self.processing.mic = false
            this.agoraClient.toggleAudio()
        }
    }
    toggleVideo(e) {
        e.preventDefault()
        e.stopPropagation()
        this.handleVideo()
    }
    handleVideo() {
        const self: any = this
        if (self.processing.camera) {
            return
        }
        self.processing.camera = true
        let ss = this.screenStatus
        let sds = this.screenDeviceStatus
        if (ss.video && this.isCreator) {
            // 使用了tv的时候
            let nv = !sds.video
            let startTime = Number(new Date())
            return SmartOfficeAPI.constrolDevice(this.room, this.inviteScreen || this.screen, {
                name: 'camera',
                action: nv ? 'enable' : 'disable'
            }).then(() => {
                let endTime = Number(new Date())
                logger.info(`SmartOfficeAPI.constrolDevice time-consume:${endTime - startTime}`)
                sds.video = !sds.video
                self.isMutedVideo = !self.isMutedVideo
                self.processing.camera = false
            }).catch(() => {
                self.processing.camera = false
            })
        } else {
            self.processing.camera = false
            if (self.isSharingScreen) {
                self.isMutedVideo = !self.isMutedVideo
                return
            }
            // 没有使用tv的时候
            console.log('toggleVideo')
            this.agoraClient.toggleVideo()
        }
    }
    handleShareVideo(flag, notChange) {
        return this.agoraClient.toggleShareVideo(flag, notChange)
    }
    handleVideoByShare(flag) {
        const self: any = this

        let ss = this.screenStatus
        let sds = this.screenDeviceStatus

        if (!ss.video || !this.isCreator) {
            // 没有使用tv的时候
            console.log('toggleVideo', flag)
            this.agoraClient.toggleVideo(flag)
        }
    }
    resetError() {
        this.error = {
            screen_not_exist: false,
            empty_screen: false,
            room_is_full: false,
            room_not_exist: false,
            can_not_start: false,
            screen_not_support: false,
            screenid_error: false
        }
        this.inviteScreen = ''
    }
    async shareScreen(e) {
        const self: any = this
        e.preventDefault()
        e.stopPropagation()
        if (this.isSharingScreen) {
            await this.handleVideoByShare(!this.isMutedVideo)
        } else {
            await this.handleShareVideo(false, true)
            this.isTest = true
        }
        logger.info(`Step: meeting 分享屏幕 shareScreen()`)
        logger.info(`self.processing.share: ${self.processing.share}`)
        if (self.processing.share) {
            return
        } else {
            self.startShareTimer()
        }
        const client = this.agoraClient
        if (this.invitePopover) {
            this.invitePopover.doClose()
        }

        if (this.isSharingScreen) {
            // 停止分享
            self.isSharingScreen = false
            self.storeLocalStatus('meeting')
            client.stopShareScreen()
        } else {
            // 分享
            this.storeToNormalMode()
            this.storeLocalStatus('sharing')
            this.hasSharing = false
            this.selectWindowToShare()
        }
    }
    async selectWindowToShare() {
        const self: any = this
        logger.info(`Step: meeting 分享屏幕 selectWindowToShare() sharingProcessing:${this.sharingProcessing}`)
        if (this.sharingProcessing) return
        self.sharingProcessing = true
        setTimeout(() => {
            // this.agoraClient.startShareScreen()
            this.isSharingScreen = true
            this.sharingProcessing = false
        }, 100)
    }

    onPoperHide() {
        logger.info(`onPoperHide`)
        this.invitePopoverShow = false
        logger.info(`onPoperHide this.invitePopoverShow:${this.invitePopoverShow}`)
    }
    onPoperShow() {
        logger.info(`onPoperShow`)
        this.invitePopoverShow = true
        logger.info(`onPoperShow this.invitePopoverShow:${this.invitePopoverShow}`)
    }
    changeErrTip(errTip) {
        const self: any = this
        Object.keys(self.error).forEach(function(key) {
            self.error[key] = false
        })
        self.error[errTip] = true
    }
    startShareTimer() {
        // 30秒没有走到tv的mq join就可以退出
        const self: any = this
        if (self.shareTimer) {
            clearTimeout(self.shareTimer)
            self.shareTimer = null
        }
        self.processing.share = true
        self.shareTimer = setTimeout(() => {
            logger.info(`shareTimer start`)
            self.processing.share = false
        }, 3000)
    }
    async checkRoomIsFull() {
        const self: any = this
        let error = this.error
        if (self.linkingTV) {
            return
        }
        self.linkingTV = true
        if (this.inviteScreen.trim() === '') {
            self.changeErrTip('empty_screen')
            self.linkingTV = false
            return
        }

        if (!/^[0-9]+$/.test(this.inviteScreen)) {
            self.changeErrTip('screenid_error')
            self.linkingTV = false
            return
        }
        try {
            const res = await meetingService.checkRoomFull(this.room, uuid.v4())
            logger.info(`meetingService.checkRoomFull callback: ${JSON.stringify(res)}`)
            if (res.status) {
                self.checkScreenExist()
            } else {
                self.isJoined = false
                self.linkingTV = false
                if (!res.error) {
                    self.changeErrTip('room_is_full')
                } else {
                    self.changeErrTip('room_not_exist')
                }
            }
        } catch(err) {
            self.ErrorHandle('server_error', 'code')
            self.linkingTV = false
            self.isJoined = false
        }
    }
    async checkScreenExist() {
        const self: any = this
        if (this.inviteScreen === '') {
            self.changeErrTip('empty_screen')
            self.linkingTV = false
            return
        }
        if (this.isJoined) return
        this.isJoined = true
        let screen = this.inviteScreen
        let startTime = Number(new Date())
        return SmartOfficeAPI.checkScreenExist(screen).then((res) => {
            let endTime = Number(new Date())
            logger.info(`SmartOfficeAPI.checkScreenExist time-consume:${endTime - startTime}`)
            if (res.status && res.isOnline) {
                let screenStatusstartTime = Number(new Date())
                meetingService.screenStatus(res.macAddr).then((screenStatusRes) => {
                    let screenStatusendTime = Number(new Date())
                    logger.info(`meetingService.screenStatus time-consume:${screenStatusendTime - screenStatusstartTime} response:${JSON.stringify(screenStatusRes)}`)
                    if (screenStatusRes.status) {
                        if (screenStatusRes.data === 'unused') {
                            let joinMeetingstartTime = Number(new Date())
                            meetingService.joinMeeting(screen).then(response => {
                                let joinMeetingendTime = Number(new Date())
                                logger.info(`meetingService.joinMeeting time-consume:${joinMeetingendTime - joinMeetingstartTime}`)
                                logger.info(`meetingService joinMeeting self.isMutedVideo:${self.isMutedVideo} self.isMutedAudio:${self.isMutedAudio}`)
                                let hasMic = res.microphone
                                let isMicOnline = !!res.microphone && res.microphone.deviceState === 'ONLINE'
                                if (!hasMic || !isMicOnline) {
                                    logger.debug(`MeetingView  microphone offline`)
                                    logger.debug(`MeetingView switchDevice false`)
                                    self.switchDevice('mic', false)
                                } else if (isMicOnline) {
                                    logger.debug(`MeetingView  microphone online`)
                                    logger.debug(`MeetingView switchDevice true`)
                                    self.switchDevice('mic', true)
                                }
                                self.isMutedVideo = false
                                self.isMutedAudio = false
                                // switchDevice('mic', true)
                                if (!response.status) {
                                    if (res.isScreenPro && res.isOnline) {
                                        self.controlScreen(screen)
                                        if (self.invitePopover) {
                                            self.invitePopover.doClose()
                                        }
                                        self.invitePopoverShow = false
                                    } else {
                                        self.isJoined = false
                                        self.changeErrTip('screen_not_support')
                                        self.linkingTV = false

                                    }
                                } else {
                                    self.isJoined = false
                                    logger.info(`meetingService.joinMeeting response.status false`)
                                    self.changeErrTip('can_not_start')
                                    self.linkingTV = false
                                }
                            })
                        } else if (screenStatusRes.data === 'used') {
                            self.changeErrTip('can_not_start')
                            self.isJoined = false
                            self.linkingTV = false
                        }
                    } else {
                        self.isJoined = false
                        logger.info(`meetingService.screenStatus return false`)
                        self.ErrorHandle('屏幕状态查询失败')
                    }
                }).catch((err) => {
                    self.ErrorHandle('屏幕状态查询失败')
                    logger.error(`meetingService.screenStatus fail ${JSON.stringify(err)}`)
                })

            } else {
                // res.status && res.isOnline && res.hasCamera false
                logger.info(`SmartOfficeAPI.checkScreenExist return status:${JSON.stringify(res.status)} isOnline:${JSON.stringify(res.isOnline)} hasCamera:${JSON.stringify(res.hasCamera)}`)
                self.isJoined = false
                self.changeErrTip('screen_not_exist')
                self.linkingTV = false
            }
        }).catch((err) => {
            logger.error(`SmartOfficeAPI.checkScreenExist fail ${JSON.stringify(err)}`)
            self.ErrorHandle('server_error', 'code')
            self.isJoined = false
        })
    }
    vipShowMode() {
        const self: any = this
        // 为了显示顶部有蓝条的页面
        if (self.roomInfo.isVip) {
            this.isCreator = false
        }

        if (this.invitePopover) {
            this.invitePopover.doClose()
        }
        this.screenStatus = {
            video: false,
            speaker: false,
            mic: false
        }
        this.screenDeviceStatus.disableCamera = true
        this.screenDeviceStatus.disableMic = true
        this.screenDeviceStatus.disableSpeaker = true

        if (!this.isSharingScreen) {
            setTimeout(() => {
                if (self.agoraClient) {
                    self.agoraClient.toggleVideo(true)
                    self.agoraClient.toggleAudio(true)
                }
            }, 500)

            this.isMutedAudio = false
            this.isMutedVideo = false
        }
    }
    changeShowMode(e?: any) {
        const self: any = this
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        logger.info(`changeShowMode isCreator${this.isCreator}`)
        if (this.isCreator) {
            this.isCreator = false
            this.showJoinRoonTip = true

            let local = self.storeGetLocal
            // self.agoraClient.layoutController.removeTVByCtlId(local.streamId)
            if (this.invitePopover) {
                this.invitePopover.doClose()
            }
            this.screenStatus = {
                video: false,
                speaker: false,
                mic: false
            }
            this.screenDeviceStatus.disableCamera = true
            this.screenDeviceStatus.disableMic = true
            this.screenDeviceStatus.disableSpeaker = true
            if (this.room && (this.inviteScreen || this.screen)) {
                SmartOfficeAPI.freeScreen(this.room, this.inviteScreen || this.screen).then(res => {
                    logger.info('freeScreen')
                    self.inviteScreen = ''
                })
                // self.meetingStore.local.role = 'joiner'
                self.storeChangeLocalRole('joiner')
                let local = self.storeGetLocal
                local.role = 'joiner'
                this.MQPublish(self.room, 'role_change', local)
                if (!this.isSharingScreen) {
                    setTimeout(() => {
                        self.agoraClient.toggleVideo(true)
                        self.agoraClient.toggleAudio(true)
                    }, 500)

                    this.isMutedAudio = false
                    this.isMutedVideo = false
                }
            }
        } else {
            // this.isCreator false 连接电视
            let input = document.getElementById('screenInviteInput')
            if (input) {
                setTimeout(() => {
                    input.focus()
                }, 100)
            }
        }
    }
    controlScreen(screen) {
        const self: any = this
        let s = screen || this.inviteScreen
        logger.debug('control screen', s)
        let startTime = Number(new Date())

        let local = self.storeGetLocal
        return SmartOfficeAPI.createMeetingRoom(this.room, s, {
            meetingCreatorId: local.uid,
            meetingCreatorClient: 'mtool'
        }).then(res => {
            let endTime = Number(new Date())
            logger.info(`SmartOfficeAPI.createMeetingRoom time-consume:${endTime - startTime}`)
            if (res.status) {
                self.isCreator = true
                self.linkingTV = false
                self.getScreenDevice(s)
                self.storeChangeLocalRole('creator')
                logger.info(`controlScreen switchLayout to normal`)
                this.MQPublish(self.room, 'role_change', self.storeGetLocal)
            } else {
                self.isCreator = false
            }
            self.isJoined = false
            return res
        }).catch((err) => {
            self.ErrorHandle('server_error', 'code')
            self.isCreator = false
            self.isJoined = false
        })
    }
    mqttInit() {
        const self: any = this
        logger.info(`Step: meeting mqttInit() start`)
        MQ.init({
            topic: this.room + '',
            member: this.storeGetLocal,
            mqeventHandle: (event) => {
                self.mqttConnectHandle(event)
            },
            msgHandle: (msg) => {
                if (msg.topic === self.room) {
                    self.handleMQMessage(msg.data)
                }
            }
        })
    }
    mqttConnectHandle(event) {
        const type = event.type
        const self: any = this
        logger.info(`Step 会议 mqttConnectHandle event ${JSON.stringify(event)}`)
        switch (type) {
            case 'connect':
                let local = this.storeGetLocal
                logger.info(`Step 会议 MQ.publish action:${event.isReConnected ? 'reconnect' : 'join'} member:${JSON.stringify(local)}`)
                this.MQPublish(self.room, event.isReConnected ? 'reconnect' : 'join', local)
                // 确保成员信息在agora 消息之前有？但是函数体里如果没有agoraclient 直接返回了
                if (event.isReConnected) {
                    this.syncMembers()                    
                }
                if (!this.agoraClient) {
                    this.initAgoraClient()
                }
                break
            case 'error':
                logger.error(`mq error`)
                this.ErrorHandle('MQ服务连接失败')
                this.closeMeeting()
                break
            case 'offline':
                logger.error(`mq offline`)
                this.ErrorHandle('会议服务连接中断')
                break
            case 'reconnect':
                logger.error(`mq reconnect`)
                if (event.retried < 10 && !this.attendToHome && this.$route.name === 'meeting') {
                    // bugfix：2987 重新连接时需要同步成员
                    this.ErrorHandle('当前网络异常，无法保障视频会议质量')
                } else {
                    this.ErrorHandle('会议服务连接中断')
                    this.closeMeeting()
                    // remote.getCurrentWindow().reload()
                    // 退出声网
                }

                break
        }
    }
    handleMQMessage(msg) {
        const self: any = this
        const agoraClient = this.agoraClient
        self.userInfo = config.readSettings('userInfo')
        if (!agoraClient) {
            return
        }
        const meetingStore = this.meetingStore
        let local = this.storeGetLocal

        
        let member = msg.member
        let streamId = member.streamId
        let controller = null
        switch (msg.action) {
            case 'join':
                logger.debug(`meetingStore join: ${JSON.stringify(member)}`)
                if (member.type === 'tv' && member.controllerId + '' !== local.uid + '') {
                    // 切换Meeting.vue 为 showview

                } else if (member.type === 'microphone' || member.type === 'android_microphone') {
                    let tvMembers = this.storeGetTvMembers
                    let linkedTv = tvMembers.find(p => p.linkedUid === member.uid)
                    logger.info(`local uid is: ${local.uid}, find linked tv: ${JSON.stringify(linkedTv)}`)
                    // 如果与麦克风绑定的屏幕的控制者是自己才切换麦克风
                    if (linkedTv && String(linkedTv.controllerId) === String(local.uid)) {
                        self.switchDevice('mic', true)
                    }
                }
                member.isMajor = true
                this.storeJoin(member)
                logger.info(`join memberCount:${self.storeGetMemberCount}`)
                self.$emit('show-view')
                if (member.uid == this.storeGetLocal.uid) {
                    this.syncMembers()
                }
                break
            case 'reconnect':
                logger.info(`${member.userName} reconnect`)
                if (member.uid === this.storeGetLocal.uid) {
                    this.syncMembers()
                }
                break;
            case 'leave':
            case 'leave-exception':
                logger.debug(`leave | leave-exception msg ${JSON.stringify(msg)}`)
                if (Number(member.streamId) === Number(local.streamId)) {
                    self.closeMeeting()
                }
                if (member.type === 'microphone' || member.type === 'android_microphone') {
                    // microphone 异常退出使用电脑
                    logger.info(`microphone leave-exception`)
                    let tvMembers = this.storeGetTvMembers
                    let linkedTv = tvMembers.find(p => p.linkedUid === member.uid)
                    logger.info(`local uid is: ${local.uid}, find linked tv: ${JSON.stringify(linkedTv)}`)
                    // 如果与麦克风绑定的屏幕的控制者是自己才切换麦克风
                    if (linkedTv && String(linkedTv.controllerId) === String(local.uid)) {
                        self.switchDevice('mic', false)
                    }
                    this.screenDeviceStatus.disableMic = true
                    this.screenDeviceStatus.disableSpeaker = true
                    this.isMutedAudio = this.$store.state.meeting.local.audio == 'off'
                } else if (member.type === 'tv' && member.controllerId + '' === local.uid + '') {
                    // tv 异常退出使用电脑
                    logger.info(`tv leave-exception`)
                    this.switchDevice('mic', false)
                    this.changeShowMode()
                    this.isCreator = false
                    this.showJoinRoonTip = true
                    this.inviteScreen = ''
                    this.screenStatus = {
                        video: false,
                        speaker: false,
                        mic: false
                    }
                    this.screenDeviceStatus.disableCamera = true
                    this.screenDeviceStatus.disableMic = true
                    this.screenDeviceStatus.disableSpeaker = true
                }
                if (String(member.uid) === String(self.userInfo.id)) {
                    this.ErrorHandle('会议服务连接中断')
                    this.closeMeeting()
                    return
                }
                if (!streamId) {
                    member = this.storeGetPeopleByUId(member.uid) || member
                    streamId = member.streamId
                }
                // if (this.storeMajor && this.storeMajor.uid === member.uid) {
                //     this.storeUpdateMajorByUId(null)
                //     this.storeToNormalMode()
                // }
                this.storeLeave(member)
                // 屏幕是主屏时，退出时， 控制者为主屏
                // if (
                //     member.type === 'tv' &&
                //     this.storeMajor &&
                //     `${member.uid}` === `${this.storeMajor.uid}`
                // ) {
                //     this.storeUpdateMajorByUId(member.controllerId)
                // }
                let mode = this.$store.state.isFullscreenMode ? 'fullscreen' : 'normal'
                logger.info(`leave or leave-exception switchLayout to ${mode}`)
                break
            case 'reconnect-proxy':
                this.storeUpdateMemberPoorNetwork({
                    uid: member.uid,
                    isPoorNetwork: false
                })
                break
            case 'poor-network':
                this.storeUpdateMemberPoorNetwork({
                    uid: member.uid,
                    isPoorNetwork: true
                })
                break
            case 'audio_muted':
            case 'audio_unmuted':
                this.storeUpdateMemberStatus(member)
                break
            case 'video_muted':
            case 'video_unmuted':
                if (msg.action === 'video_muted') {
                    member.video = 'off'
                } else {
                    member.video = 'on'
                }
                this.storeUpdateMemberStatus(member)
                break

            case 'share_stop':
                member.isMajor = false
                this.storeJoin(member)
                if (String(member.uid) !== String(self.userInfo.id)) {
                    if (self.oldmode !== this.$store.state.isFullscreenMode ? 'fullscreen' : 'normal') {
                        logger.info(`share_stop ${member.userName} switchLayout to ${self.oldmode}`)
                        self.$store.state.isShowHeader = true
                        this.storeToNormalMode()
                    }
                }
                if (this.isTest) {
                    self.handleShareVideo()
                    this.isTest = false
                }
                break
            case 'share_start':
                member.isMajor = true
                this.storeJoin(member)
                if (String(member.uid) !== String(self.userInfo.id)) {
                    self.oldmode = this.$store.state.isFullscreenMode ? 'fullscreen' : 'normal'
                    if (self.isSharingScreen) {
                        logger.info(`================= stop sharing when other start sharing`)
                        self.agoraClient.stopShareScreen()
                    }
                    // 进入fullscreen模式, 将分享者变成major
                    // 如果是控制者，隐藏自己控制的tv
                    self.storeUpdateMajorByUId(member.uid)
                    if (!self.isCreator) {
                        this.storeToFullscreenMode()
                    }
                }
                if (this.isTest) {
                    self.handleShareVideo(true, true)
                    this.isTest = false
                }
                break
            case 'role_change':
                // self.agoraClient.updateMajorByStreamId(msg.member.streamId)
                this.storeJoin(member)
                break
        }
        let notFireMap = {
            'poor-network': true,
            'reconnect': true,
            'video_unmuted': true,
            'video_muted': true,
            'audio_muted': true,
            'audio_unmuted': true
        }

        if (agoraClient) {
            // agoraClient.updatePanelStatus(meetingStore)
        }

        let members = this.storeSortMembers || []
        if (this.isCreator && !this.roomInfo.isVip) {
            logger.debug(`this.isCreator && !this.roomInfo.isVip this.showJoinRoonTip = false`)
            this.showJoinRoonTip = false
        } else {
            let membersnomic = 0
            members.forEach(m => {
                if (!MemberUtils.isMicrophone(m)) {
                    membersnomic++
                }
            })
            if (membersnomic > 1) {
                this.showJoinRoonTip = false
            } else {
                this.showJoinRoonTip = true
            }
        }
        if (notFireMap[msg.action]) {
            return
        }

        let stop = false
        if (String(member.uid) === String(self.userInfo.id)) {
            stop = true
        }
        if (msg.action === 'share_stop' && member.uid === self.userInfo.id) {
            stop = false
        }
        if (stop) return
        logger.info(`handleMQMessage member:${JSON.stringify(member)} isSharingScreen:${this.isSharingScreen}`)
        if (msg.action === 'share_start' && this.isSharingScreen && !this.sharingProcessing) {
            this.isSharingScreen = false
            this.hasSharing = false
        }
        const isPhone = member.type === 'phone'
        switch (msg.action) {
            case 'join':
                if ((member.type !== 'microphone' && member.type !== 'android_microphone') && member.userName) {
                    self.showTip(member, '加入会议', 'info')
                }
                break
            case 'leave':
                if ((member.type !== 'microphone' && member.type !== 'android_microphone') && member.userName) {
                    self.showTip(member, '离开会议', 'error')
                }
                // 挂断后清除
                isPhone && PhoneHelper.remove(member.userName)
                isPhone && PhoneHelper.removeName(member.userName)
                break
            case 'leave-exception':
                if ((member.type !== 'microphone' && member.type !== 'android_microphone') && member.userName) {
                    self.showTip(member, '异常退出会议', 'error')
                }
                // 挂断后清除
                isPhone && PhoneHelper.remove(member.userName)
                isPhone && PhoneHelper.removeName(member.userName)
                break
            case 'share_stop':
                break
        }
        self.clearShowTip()
        if (this.storeHasSharing) {
            // 界面上好像没有地方使用hasSharing
            this.hasSharing = true
        } else {
            this.hasSharing = false
        }
        this.fireRelayout(member.streamId, (msg.action === 'leave' || msg.action === 'leave-exception'))
    }
    /**
     * 清除tip显示
     */
    clearShowTip() {
        const self: any = this
        setTimeout(() => {
            self.notifiction = {
                message: '',
                type: ''
            }
        }, 3000)
    }
    /**
     * 显示提示
     * @param {*} member 成员数据
     * @param {*} tip 提示文案
     */
    showTip(member, tip, tipType) {
        const { userName, type } = member
        if (type === 'phone') {
            PhoneHelper.getName(userName)
            .then(name => {
                this.notifiction.message = `${name} ${tip}`
                this.notifiction.type = tipType
                this.clearShowTip()
            })
            .catch(name => {
                this.notifiction.message = `${name} ${tip}`
                this.notifiction.type = tipType
                this.clearShowTip()
            })
        } else {
            this.notifiction.message = `${userName} ${tip}`
            this.notifiction.type = tipType
        }
    }
    fireRelayout(id?: any, isLeave?: any) {
        this.storeStreamArrived(id)
    }
    async switchDevice(name, unmuted) {
        logger.info(`switchDevice, isMutedAudio: ${this.isMutedAudio}`)
        if (this.isMutedAudio) return
        let ss = this.screenStatus
        ss[name] = unmuted
        if (this.agoraClient) {
            if (ss.mic) {
                logger.info('mute system volume')
                deviceCtl.muteVolume()
                this.agoraClient.toggleAudio(false)
            } else {
                deviceCtl.unMuteVolume()
                this.agoraClient.toggleAudio(true)
            }
            const self: any = this
            if (self.processing.mic) return
            self.processing.mic = true
            let sds = this.screenDeviceStatus
            try {
                await SmartOfficeAPI.constrolDevice(
                    this.room, this.inviteScreen ||
                    this.screen, {
                    name: 'mic',
                    action: ss.mic ? 'enable' : 'disable'
                })
                sds.mic = ss.mic
                self.processing.mic = false
            } catch (error) {
                self.processing.mic = false
            }
        }
    }
    /**
     * 同步成员
     */
    async syncMembers() {
        const self: any = this
        logger.info(`Step 会议 syncMembers() start`)
        let room = self.room
        if (this.isSharingScreen) return
        logger.info(`Step 会议 meetingService.getMembers(room:${room})`)
        let startTime = Number(new Date())
        const res = await meetingService.getMembers(room)
        let endTime = Number(new Date())
        logger.info(`meetingService.getMembers time-consume:${endTime - startTime}`)
        if (res.status) {
            logger.info(`meetingService.getMembers sync members:${endTime - startTime}`)
            // TODO: 这个方法需要处理
            this.storeCheckChangedAndSync(res.members || [])
            if (!this.storeGetLocal) {
                self.closeMeeting({})
            }
        }
        // else {
        //     self.closeMeeting({})
        // }
    }
}
