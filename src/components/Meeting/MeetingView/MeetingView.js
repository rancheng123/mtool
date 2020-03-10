import Vue from 'vue'
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
import ErrorHandle from '../../../helpers/error/errorhandle'
import inviter from '../InviteUser/InviteUser.vue'
import CallPhone from '../callPhone/CallPhone.vue'
import PhoneHelper from '../../../helpers/phoneHelper'

import {
    AgoraWebRTC
} from '../../../helpers/agora/agorawebrtc'
import {
    SignalingClient
} from '../../../helpers/agora/signClient'

import {
    DomHelper
} from '../../../helpers/agora/domhelper'
import {
    MeetingStore
} from '../../../helpers/agora/meetingstore'
import {
    capture
} from '../../../helpers/agora/chrome'

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

export default {
    components: {
        'inviter': inviter,
        'CallPhone': CallPhone
    },

    props: ['screen', 'room', 'tostart', 'roomInfo', 'isVip', 'toquit'],

    data() {
        return {
            hasReadGuide: !!HasReadGuide,
            // 分享中视频开关控制
            isShareMutedVideo: false,
            isTest: false,
            showInviteLink: false,
            showSIP: false,
            isSIPUser: false,
            showInviteContent: false,
            meetinglink: '',
            emailAddr: '',
            sipPhonenum: '',
            callingPhone: '',
            copied: false,
            genStatus: '',
            linkingTV: false,
            memberCount: 0,
            sended: {
                done: false,
                status: ''
            },
            code: '',
            oldmode: '',
            agoraClient: null,
            isCreator: false,
            time: {
                label: '',
                count: 0,
                timer: null
            },
            notifiction: {
                type: 'info',
                message: ''
            },
            screenStatus: {
                video: false,
                speaker: false,
                mic: false
            },
            screenDeviceStatus: {
                video: false,
                speaker: false,
                mic: false,
                disableCamera: true,
                disableMic: true,
                disableSpeaker: true
            },
            MQInstance: MQ.getInstance(),
            meetingStore: new MeetingStore(),
            userInfo: {},
            isCurrentRouter: false,
            createClientFial: false,
            createRoomStatus: false,
            isMutedAudio: false,
            isMutedVideo: false,
            isSharingScreen: false,
            sharingProcessing: false,
            joinScreen: '',
            isJoined: false,
            localStreamId: '',
            oldlocalStreamId: '',
            afterUserId: null,
            dynamicKey: '',
            showJoinRoonTip: false,
            visiblewlist: false,
            windowRefreshTimer: null,
            windows: [],
            processing: {
                mic: false,
                camera: false,
                share: false
            },
            error: {
                empty: false,
                format: false,
                screen_not_exist: false,
                empty_screen: false,
                room_is_full: false,
                room_not_exist: false,
                can_not_start: false,
                screen_not_support: false,
                screenid_error: false
            },
            inviteScreen: '',
            hasSharing: false,
            invitePopover: null,
            invitePopoverShow: false,
            repaintTimer: null
        }
    },

    computed: {
        isFullscreenMode: function() {
            return this.$store.state.isFullscreenMode
        },
        isShowHeader: function() {
            return this.$store.state.isShowHeader
        },
        isShowInviteMenu: function() {
            return this.$store.state.isShowInviteMenu
        }
    },

    watch: {
        '$route': 'routeChange',
        'tostart': 'startMeeting',
        'isCreator': 'checkShowJoinTip',
        'toquit': 'quit',
        'room': 'reset',
        'memberCount': 'changeMeetingCountInfo'

    },

    created() {

    },

    mounted() {
        const self = this
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
        window.addEventListener('endcall', (res) => {
            logger.info(`&&&&&&&&&&&&&&& endcall ${JSON.stringify(res)}`)
            if (self.agoraClient && self.signClient && res.phoneId) {
                let people = self.meetingStore.getPeopleByStreamId(res.phoneId)
                if (people) {
                    self.signClient.endcall('sipgw_mxj' + people.uid)
                    self.agoraClient.layoutController.removePanelByOId(res.phoneId)
                    self.meetingStore.leave(people)
                    self.memberCount = self.meetingStore.getMemberCount()
                    self.agoraClient.syncByStore(self.meetingStore, true)

                    MQ.publish(`meetingid-` + self.room, JSON.stringify({
                        action: 'leave',
                        member: people
                    }))
                }

            }
        })
        this.invitePopover = this.$refs['addscreen']
    },

    destroyed() {
        if (this.addedWindowResizeHandler) {
            window.removeEventListener('resize', this.onWindowResize)
            this.addedWindowResizeHandler = false
        }
    },

    methods: {
        changeMeetingCountInfo(n) {
            let self = this
            let infoDom = document.querySelector('.info')
            if (infoDom) {
                infoDom.innerHTML = n + `人参会`
            }
            if (n === 1) {
                if (self.agoraClient) {
                    self.agoraClient.layoutController.hideSwitch()
                }
            } else {
                if (self.agoraClient) {
                    self.agoraClient.layoutController.showSwitch()
                }
            }
        },
        switchMode() {
            let self = this
            return function(toFullscreenMode) {
                logger.info(`swtichMode toFullscreenMode:${toFullscreenMode}`)
                self.$store.state.isFullscreenMode = toFullscreenMode
            }
        },

        sipCall(callingPhone) {
            let self = this
            self.callingPhone = callingPhone
            if (self.callingPhone === '') {
                self.error.empty = true
                return
            }
            self.resetInviteError()
            // this.syncMembers()
            self.sipPhonenum = self.callingPhone
            self.callingPhone = ''
            self.showSIP = false
            logger.info(`sipCall self.sipPhonenum:${self.sipPhonenum}`)
            let streamId = MQ.generateNumberID()

            let sipMember = {
                id: self.sipPhonenum,
                uid: self.sipPhonenum + '',
                streamId: streamId,
                userName: self.sipPhonenum,
                room: self.room,
                type: 'phone',
                screen: self.screen,
                role: 'joiner'
            }

            let old = self.meetingStore.getPeopleByUId(self.sipPhonenum)
            if (old) {
                ErrorHandle.showErrorMessage({
                    message: self.sipPhonenum + '已在会议中'
                })
                return
            }
            if (self.meetingStore.getMembersCountAll() === 7) {
                ErrorHandle.showErrorMessage({
                    message: '参会人数已满'
                })
            } else {
                self.meetingStore.join(sipMember)
                self.agoraClient.syncByStore(self.meetingStore, true)

                self.memberCount = self.meetingStore.getMemberCount()
                logger.info(`sipCall MQ.publish action:join member:${JSON.stringify(sipMember)}`)
                MQ.publish(`meetingid-` + self.room, JSON.stringify({
                    action: 'join',
                    member: sipMember
                }))

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
            }

        },
        showHeader(event) {
            let self = this
            let { clientY } = event
            /**
             * 这结构要改2668并且header、controller只有做位置判断
             */
            if (clientY >= 30 && this.isFullscreenMode) {
                self.$store.state.isShowHeader = true
                logger.info(`showHeader ${self.$store.state.isShowHeader}`)
            }
        },
        hideHeader() {
            let self = this
            if (this.isFullscreenMode && !this.invitePopoverShow) {
                self.$store.state.isShowHeader = false
                logger.info(`hideHeader ${self.$store.state.isShowHeader}`)
            }
        },
        closeInviteLink() {
            this.showInviteLink = false
        },
        closeSip() {
            this.showSIP = false
        },
        showInviteLinkPanel() {
            this.showSIP = false
            this.showInviteLink = !this.showInviteLink
            if (!this.meetinglink) {
                this.genInviteLink()
            }
        },

        showSIPPanel() {
            this.showInviteLink = false
            this.showSIP = !this.showSIP
        },
        toggleTrigger() {
            this.handleReadGuide()
            this.$store.state.isShowInviteMenu = !this.$store.state.isShowInviteMenu
        },
        /**
         * 当点击按钮 将阅读引导标志置为true， 并写入配置文件
         */
        handleReadGuide() {
            if (this.hasReadGuide) return
            this.hasReadGuide = true
            HasReadGuide = true
            config.saveSettings('HasReadGuide', this.hasReadGuide)
        },
        routeChange() {
            this.resetStatus()
            this.isCurrentRouter = this.$route.path === '/app/meeting'
        },
        resetStatus() {
            this.agoraClient = null
            this.isShareMutedVideo = false
            this.isTest = false
            this.isCreator = false
            this.$store.state.isFullscreenMode = false
            this.$store.state.isShowHeader = true
            this.dynamicKey = ''
            this.callingPhone = ''
            this.sipPhonenum = ''
            this.afterUserId = ''
            this.linkingTV = false
            this.time = {
                label: '',
                count: 0,
                timer: null
            }
            this.userStatus = {
                uid: '',
                status: ''
            }
            this.notifiction = {
                type: '',
                message: ''
            }
            this.isCurrentRouter = false
            this.createClientFial = false
            this.createRoomStatus = false
            this.showJoinRoonTip = false
            this.isMutedAudio = false
            this.isMutedVideo = false
            this.isSharingScreen = false
            this.joinScreen = ''
            this.localStreamId = ''
            this.inviteScreen = ''
            this.windows = []
            this.isJoined = false
            this.hasSharing = false
            this.error = {
                screen_not_exist: false,
                empty_screen: false,
                room_is_full: false,
                empty: false,
                format: false,
                room_not_exist: false,
                can_not_start: false,
                screen_not_support: false,
                screenid_error: false
            }
            // 清空拨打
            PhoneHelper.reset()
            PhoneHelper.resetNames()

            this.meetingStore = new MeetingStore()
            clearInterval(this.time.timer)

            if (this.invitePopover) {
                this.invitePopover.doClose()
            }

        },
        quit(n, o) {
            let self = this
            if (n === true) {
                logger.info(`quit()`)
                self.closeMeeting()
            }
        },
        genInviteLink() {
            const self = this
            let room = this.room || 27618
            if (room) {
                this.genStatus = 'loading'
                return meetingService.genInviteCode(room).then(res => {
                    if (res.status) {
                        self.genStatus = 'done'
                        self.code = res.data
                        self.meetinglink = meetingService.getServiceUrl() + `/web#${res.data}`
                    } else {
                        self.genStatus = 'fail'
                    }
                }).catch(() => {
                    self.genStatus = 'fail'
                })
            }
        },
        resetSendStatus() {
            const self = this
            setTimeout(function() {
                self.sended = {
                    done: false,
                    status: ''
                }
            }, 5000)
        },
        copy() {
            if (this.meetinglink && !this.copied) {
                clipboard.writeText(this.meetinglink)
                this.copied = true
                setTimeout(() => {
                    this.copied = false
                }, 5000)
            } else if (this.genStatus === 'fail') {
                this.genInviteLink()
            }
        },
        resetInviteError() {
            this.error.empty = false
            this.error.format = false
        },
        reset() {
            this.meetinglink = ''
            this.resetInviteError()
            this.showInviteContent = false
        },
        send(email) {
            const self = this
            if (!this.checkEmailValid(email) || self.sended.status === 'sending') {
                return
            }

            self.sended.status = 'sending'
            return meetingService.sendInvite(this.code, email).then(res => {

                self.sended.done = true
                if (res.status) {
                    self.sended.status = 'ok'
                } else {
                    self.sended.status = 'fail'
                }
                this.emailAddr = ''
                self.resetSendStatus()

                return res
            }).catch(() => {
                this.emailAddr = ''
                self.sended.done = true
                self.sended.status = 'fail'
                self.resetSendStatus()
            })

        },
        checkEmailValid(email) {
            let regex = /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/ig
            let flag = false
            if (!email) {
                this.error.empty = true
                return false
            }

            flag = regex.test(email)
            this.error.format = !flag

            return flag
        },

        closeMeeting(e, opt) {
            logger.info(`closeMeeting()`)
            const self = this
            let room = this.room
            let local
            if (self.meetingStore) {
                local = self.meetingStore.getLocal()
            }
            clearInterval(this.time.timer)
            logger.debug(`closeMeeting mq leave local ${JSON.stringify(local)}`)
            MQ.publish(`meetingid-` + self.room, JSON.stringify({
                action: 'leave',
                member: local
            }), () => {
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

                self.$router.replace({
                    path: '/app/home',
                    query: {
                        redirect: (opt || {}).redirect
                    }
                })
            })

            if (this.room && (this.screen || this.inviteScreen) && (this.isCreator || this.roomInfo.isVip)) {
                let startTime = new Date()
                SmartOfficeAPI.freeScreen(this.room, this.screen).then(res => {
                    let endTime = new Date()
                    logger.info(`SmartOfficeAPI.freeScreen time-consume:${endTime - startTime}`)
                }).catch((err) => {
                    logger.error(`SmartOfficeAPI.freeScreen error: ${JSON.stringify(err)}}`)
                }).finally(() => {
                    self.inviteScreen = ''
                    self.isCreator = false
                    self.$router.replace({
                        path: '/app/home'
                    })
                })
            }
        },
        initAgoraClient() {
            let agoraId = config.readSettings('agoraId')
            // need to remove
            // agoraId = '6dbe3daf6f394694ba11865fc7b02ce1'
            logger.info(`Step: meeting initAgoraClient() agoraId:${agoraId} mToolVideoResolution:${mToolVideoResolution}`)
            const self = this
            let room = this.room
            let con = document.getElementById('video-call-con')
            con.innerHTML = ''

            // let local = this.meetingStore.getLocal()
            let agoraClient = new AgoraWebRTC({
                appId: agoraId,
                roomName: room,
                signClient: self.signClient,
                dom: con,
                switchHandler: this.switchMode(),
                disableSubcribe: false,
                videoProfile: mToolVideoResolution || '480P',
                useSideLayout: true,
                localStreamConfig: {
                    audio: true
                }
            })

            self.agoraClient = agoraClient

            if (this.roomInfo.users.length > 0) {
                this.meetingStore.addUsers(this.roomInfo.users)
                agoraClient.syncByStore(this.meetingStore, true)

                self.memberCount = this.meetingStore.getMemberCount()
                logger.info(`initAgoraClient memberCount:${self.memberCount}`)
                if (this.meetingStore.hasSharing()) {
                    // 有分享全屏模式
                    let sharingOne = this.meetingStore.getSharing()
                    if (sharingOne) {
                        self.agoraClient.layoutController.updateMajorByOId(sharingOne.streamId)
                        self.agoraClient.layoutController.switchLayout('fullscreen')
                    }

                } else {
                    // 没有分享，普通模式，local显示在第一个
                    self.agoraClient.layoutController.sortByMeetingStore(this.meetingStore)
                    self.agoraClient.layoutController.switchLayout('normal')
                }
                // setTimeout(function() {
                //     logger.info(`initAgoraClient streams fixSize`)
                //     self.agoraClient.streams.forEach(s => {
                //         // 等切换完了layout在fixsize
                //         s.autoFixSize()
                //     })
                // }, 150)

                Vue.nextTick(() => {
                    logger.info(`initAgoraClient streams fixSize`)
                    self.agoraClient.streams.forEach(s => {
                        // 等切换完了layout在fixsize
                        s.autoFixSize()
                    })
                })
            }

            agoraClient.on('global', (e) => {
                console.log(e.type, e)
                self.handleAgoraEvent(e)
            })

            logger.info(`Step: meeting agoraClient.joinChannel() -- start room:${self.room} localStreamId:${self.localStreamId}`)
            let joinChannelstartTime = new Date()

            agoraClient.joinChannel().then(() => {
                // streamId 最大值为4294967295，如超过则设置视频流id会失效
                let joinChannelendTime = new Date()
                logger.info(`Step: meeting agoraClient.joinChannel time-consume:${joinChannelendTime - joinChannelstartTime}`)
                // time-consuming:${endTime - startTime}
                logger.info(`Step: meeting agoraClient.joinRoom(${room},${self.localStreamId}) start`)
                let joinRoomstartTime = new Date()

                let opt = {
                    'appID': agoraClient.appId,
                    'channel': self.room + '',
                    'expiredTs': 0,
                    'salt': Math.floor(Math.random() * 1000000),
                    'ts': Math.floor(new Date() / 1000),
                    'uid': self.localStreamId
                }

                return meetingService.dynamicKey(opt).then(res => {
                    if (res.status) {
                        // 获得key
                        self.dynamicKey = res.key

                        // param key, channel, userid,
                        agoraClient.joinRoom(res.key, self.room + '', self.localStreamId, (err) => {
                            let joinRoomendTime = new Date()
                            logger.info(`Step: meeting agoraClient.joinRoom(${room},${self.localStreamId}) time-consume:${joinRoomendTime - joinRoomstartTime}  self.screen:${self.screen}`)
                            if (err) {
                                logger.error(`agoraClient.joinRoom err:${err}`)
                                ErrorHandle.showErrorMessage({
                                    message: '传输视频数据失败, ERROR_AGORA_JoinRoom'
                                })

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

                                let joinMeetingstartTime = new Date()
                                return SmartOfficeAPI.joinMeeting(self.room).then((res) => {
                                    let joinMeetingendTime = new Date()
                                    self.countTime(self.roomInfo.duration)
                                    logger.info(`SmartOfficeAPI.joinMeeting(${self.room}) time-consume:${joinMeetingendTime - joinMeetingstartTime} response:${JSON.stringify(res)}`)
                                })
                            }
                        })

                    } else {
                        logger.error(`meetingService.dynamicKey status false`)
                        ErrorHandle.showErrorMessage({
                            message: '获得dynammickey错误'
                        })
                        self.closeMeeting()
                        return
                    }
                }).catch((err) => {
                    logger.error(`meetingService.dynamicKey ${err}`)
                    ErrorHandle.showErrorMessage({
                        message: '获得dynammickey错误'
                    })
                    self.closeMeeting()
                    return
                })

            }).catch((e) => {
                logger.info(`agoraClient.joinChannel()`)
                ErrorHandle.showErrorMessage({
                    message: '初始化视频失败, ERROR_AGORA_JoinChannel'
                })
                self.closeMeeting()

                return
            })

            this.initVitualScroller()
        },
        startMeeting(n, o) {
            const self = this
            let room = this.room
            let roomInfo = this.roomInfo

            logger.info(`Step: meeting startMeeting(newval:${n}, oldval:${o}) room:${room}`)


            let startTime = new Date()
            logger.info(`SmartOfficeAPI.account start`)
            SmartOfficeAPI.account().then(res => {
                let endTime = new Date()
                logger.info(`SmartOfficeAPI.account time-consume:${endTime - startTime}`)
                logger.info(`SmartOfficeAPI.account:${JSON.stringify(res)}`)
                if (res && res.sip) {
                    self.isSIPUser = true
                }
            }).catch(err => {
                logger.error(`SmartOfficeAPI.account error:${JSON.stringify(err)}`)
            })

            let token = ''
            let agoraId = config.readSettings('agoraId')
            // need to remove
            // agoraId = '6dbe3daf6f394694ba11865fc7b02ce1'

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

                this.meetingStore.init(joiner || {
                    id: this.userInfo.id + '',
                    uid: this.userInfo.id + '', // electron-main 生成
                    streamId: self.localStreamId,
                    userName: this.userInfo.fullName || '',
                    room: this.room,
                    screen: this.screen,
                    role: self.isCreator ? 'creator' : 'joiner'
                })
                logger.info(`roominfo: `, JSON.stringify(this.roomInfo))
                // need to fetch token from server
                let expiredTime = Math.floor(Date.now() / 1000) + 3600 * 24
                let tokenReqOpt = {
                    appId: agoraId,
                    account: String(self.localStreamId),
                    expiredTsInSeconds: expiredTime
                }
                meetingService.signalToken(tokenReqOpt).then(async result => {
                    token = result.token

                    let signClientLoginResult = await self.signClient.loginAsync(agoraId, token, parseInt(self.localStreamId) + '')
                    if (signClientLoginResult.state === 0) {
                        logger.info(`signClient.login success`)
                        self.afterUserId = signClientLoginResult.uid
                        self.mqttInit()
                    } else {
                        ErrorHandle.showErrorMessage({
                            message: '当前网络异常，请退出重新发起...'
                        })
                    }
                }).catch(err => {
                    logger.error(`get signal token error: ${err}`)
                    ErrorHandle.showErrorMessage({
                        message: '屏幕状态查询失败'
                    })
                })

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
                this.meetingStore.init(joiner || {
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

                // need to fetch token from server
                let expiredTime = Math.floor(Date.now() / 1000) + 3600 * 24
                let tokenReqOpt = {
                    appId: agoraId,
                    account: String(self.localStreamId),
                    expiredTsInSeconds: expiredTime
                }
                meetingService.signalToken(tokenReqOpt).then(async result => {
                    token = result.token

                    let signClientLoginResult = await self.signClient.loginAsync(agoraId, token, parseInt(self.localStreamId) + '')
                    if (signClientLoginResult.state === 0) {
                        logger.info(`signClient.login success`)
                        self.afterUserId = signClientLoginResult.uid
                        self.mqttInit()
                    } else {
                        ErrorHandle.showErrorMessage({
                            message: '当前网络异常，请退出重新发起...'
                        })
                    }
                }).catch(err => {
                    logger.error(`get signal token error: ${err}`)
                })
            }
        },
        getScreenDevice(inviteScreen) {
            let self = this
            logger.info(`Step: meeting getScreenDevice()`)
            let screen = inviteScreen || self.screen
            const agoraClient = this.agoraClient
            return new Promise((resolve, reject) => {
                if (screen) {
                    logger.info(`Step: meeting SmartOfficeAPI.getScreenDevices(self.room:${self.room}, screen:${self.screen}) start`)
                    let getScreenDevicesstartTime = new Date()
                    return SmartOfficeAPI.getScreenDevices(self.room, screen).then((res) => {
                        let getScreenDevicesendTime = new Date()
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
                            let startTime = new Date()
                            return SmartOfficeAPI
                                .checkScreenExist(screen)
                                .then((checkScreeres) => {
                                    let endTime = new Date()
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

        },
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
        },
        createRoom() {
            let self = this
            let roomInfo = this.roomInfo
            if (roomInfo.isFake) {
                self.isCreator = false
            }
            logger.info(`Step: meeting createRoom() start`)
            logger.info(`Step: meeting meetingService.startMeeting(self.room:${self.room}, member:${this.meetingStore.getLocal()})) start`)
            let startTime = new Date()
            meetingService.startMeeting(self.room, this.meetingStore.getLocal())
                .then((res) => {
                    let endTime = new Date()
                    logger.info(`Step: meeting meetingService.startMeeting time-consume:${endTime - startTime} response: ${JSON.stringify(res)}`)
                    if (res.status) {
                        self.memberCount = 1
                        if (!roomInfo.isFake) {
                            if (!roomInfo.isVip) {
                                self.getScreenDevice()
                                self.controlScreen(self.screen)
                            } else {
                                logger.debug(`############# self.showJoinRoonTip = true`)
                                self.showJoinRoonTip = true
                                self.agoraClient.showInfoByStore(self.meetingStore)
                            }
                        } else {
                            self.showJoinRoonTip = true
                        }
                        self.countTime(res.duration)
                    } else {
                        logger.error(`创建会议失 res.status ${JSON.stringify(res.status)}`)
                        ErrorHandle.showErrorMessage({
                            message: '创建会议失败，请重试'
                        })
                        self.closeMeeting()
                    }
                    return res
                }).catch((err) => {
                    ErrorHandle.showErrorMessage({
                        message: '创建会议失败，请重试'
                    })
                    logger.error(`创建会议失 err ${JSON.stringify(err)}`)
                    self.closeMeeting()
                })
        },
        handleAgoraEvent(e) {
            const self = this

            const Base64 = window.Base64
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
                            ErrorHandle.showErrorMessage(error)
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

                    this.meetingStore.setAudioStatus(data.muted)

                    MQ.publish(`meetingid-` + self.room, JSON.stringify({
                        action: data.muted ? 'audio_muted' : 'audio_unmuted',
                        member: self.meetingStore.getLocal()
                    }))
                    if (e.data && sds.disableMic && !ss.mic || !this.isCreator) {
                        this.isMutedAudio = e.data.muted
                    }

                    sds.disableMic = true
                    self.processing.mic = false
                    break
                case 'local-stream-video':
                    logger.info('agora:event local-stream-video' + JSON.stringify(e))
                    this.meetingStore.setVideoStatus(data.muted)
                    MQ.publish(`meetingid-` + self.room, JSON.stringify({
                        action: data.muted ? 'video_muted' : 'video_unmuted',
                        member: self.meetingStore.getLocal()
                    }))

                    logger.info('local-stream-video' + JSON.stringify(e.data))
                    if (!e.notChange && (e.data && sds.disableCamera && !ss.video || !this.isCreator)) {
                        this.isMutedVideo = e.data.muted
                    }

                    sds.disableCamera = true
                    self.processing.camera = false
                    break
                case 'peer-leave':
                    logger.info('agora:event peer-leave', e.data)
                    self.agoraClient.autoSize()
                    let people = self.meetingStore.getPeopleByStreamId(e.data)
                    if (people && people.type && people.type === 'phone') {
                        self.meetingStore.leave(people)
                        self.agoraClient.syncByStore(self.meetingStore, true)
                        self.memberCount = self.meetingStore.getMemberCount()
                        MQ.publish(`meetingid-` + self.room, JSON.stringify({
                            action: 'leave',
                            member: people
                        }))
                    }
                    break
                case 'start-share-screen':
                    logger.info(`agora:event start-share-screen`)
                    // ipc.send('renderer-command', {
                    //     'command': 'changeDpi'
                    // })
                    if (e.status) {
                        this.meetingStore.localStatus('sharing').then(() => {

                            MQ.publish(`meetingid-` + self.room, JSON.stringify({
                                action: 'share_start',
                                member: self.meetingStore.getLocal()
                            }))
                        })
                        if (ss.mic) {
                            this.agoraClient.toggleAudio(false)
                        }
                        if (this.isMutedAudio) {
                            this.agoraClient.toggleAudio(false)
                        }
                    } else {
                        this.meetingStore.localStatus('meeting')
                    }
                    break
                case 'stop-share-screen':
                    logger.info(`agora:event stop-share-screen ${JSON.stringify(e)}`)
                    if (e.status) {
                        this.meetingStore.localStatus('meeting').then(() => {

                            MQ.publish(`meetingid-` + self.room, JSON.stringify({
                                action: 'share_stop',
                                member: self.meetingStore.getLocal()
                            }))
                        })
                        if (ss.mic) {
                            this.agoraClient.toggleAudio(false)
                        }
                        if (this.isMutedAudio) {
                            this.agoraClient.toggleAudio(false)
                        }
                    } else {
                        this.meetingStore.localStatus('sharing')
                    }
                    // ipc.send('renderer-command', {
                    //     'command': 'recoverDpi'
                    // })
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
                    this.agoraClient.showInfoByStore(self.meetingStore)
                    break
                case 'init_local_stream_fail':
                    logger.error(`init_local_stream_fail e:${JSON.stringify(e)}`)
                    break
            }
        },
        checkStatus(errorName) {
            const self = this
            let error = this.error[errorName]
            return setInterval(() => {
                let time = (new Date()).getTime()
                if (time - error.time > 5 * 1000) {
                    clearInterval(error.timer)
                    self.error.status = false
                }
            }, 1000)
        },

        leave(e) {
            this.closeMeeting(e)
        },
        toggleSpeaker() {
            let ss = this.screenStatus
            let sds = this.screenDeviceStatus
            if (ss.speaker && this.isCreator) {
                let na = !sds.speaker
                let startTime = new Date()
                SmartOfficeAPI.constrolDevice(this.room, this.inviteScreen || this.screen, {
                    name: 'speaker',
                    action: na ? 'enable' : 'disable'
                }).then(() => {
                    let endTime = new Date()
                    sds.speaker = !sds.speaker
                    logger.info(`SmartOfficeAPI.constrolDevice time-consume:${endTime - startTime}`)
                }).catch((err) => {
                    console.log(err)
                })
            } else {
                ipc.send('mute-systemvolume')
            }
        },
        toggleAudio(e) {
            if (e) {
                e.preventDefault()
                e.stopPropagation()

                let targetClasses = e.target.classList.value
                console.log(targetClasses)
                let isTriggeredByInValideClassName = targetClasses.indexOf('toggle-btn') < 0
                let deviceSwithDom = document.getElementsByClassName('device-switch')
                if (deviceSwithDom && deviceSwithDom.length > 0) {
                    if (deviceSwithDom[0].contains(e.target) && isTriggeredByInValideClassName) {
                        return
                    }
                }
            }

            const self = this
            if (self.processing.mic) {
                return
            }
            self.processing.mic = true
            let ss = this.screenStatus
            let sds = this.screenDeviceStatus
            if (ss.mic && this.isCreator) {
                let na = !sds.mic
                let startTime = new Date()
                return SmartOfficeAPI.constrolDevice(this.room, this.inviteScreen || this.screen, {
                    name: 'mic',
                    action: na ? 'enable' : 'disable'
                }).then(() => {
                    let endTime = new Date()
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
        },
        toggleVideo(e) {
            e.preventDefault()
            e.stopPropagation()

            this.handleVideo()
        },
        handleVideo() {
            const self = this
            if (self.processing.camera) {
                return
            }
            self.processing.camera = true
            let ss = this.screenStatus
            let sds = this.screenDeviceStatus
            if (ss.video && this.isCreator) {
                // 使用了tv的时候
                let nv = !sds.video
                let startTime = new Date()
                return SmartOfficeAPI.constrolDevice(this.room, this.inviteScreen || this.screen, {
                    name: 'camera',
                    action: nv ? 'enable' : 'disable'
                }).then(() => {
                    let endTime = new Date()
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
        },
        handleShareVideo(flag, notChange) {
            return this.agoraClient.toggleShareVideo(flag, notChange)
        },
        handleVideoByShare(flag) {
            const self = this

            let ss = this.screenStatus
            let sds = this.screenDeviceStatus

            if (!ss.video || !this.isCreator) {
                // 没有使用tv的时候
                console.log('toggleVideo', flag)
                this.agoraClient.toggleVideo(flag)
            }
        },
        countTime(duration) {
            console.log('count time')
            const self = this
            let count = duration || 0
            clearInterval(this.time.timer)

            this.time.timer = setInterval(() => {

                count += 1
                if (count < 60) {
                    let countlabel = ''
                    if (count < 10) {
                        countlabel = '0' + count
                    } else {
                        countlabel = count
                    }
                    self.time.label = `00:00:${countlabel}`
                } else if (count < 60 * 60) {
                    let min = parseInt(count / 60)
                    let minLabel = ''
                    if (min < 10) {
                        minLabel = '0' + min
                    } else {
                        minLabel = min
                    }
                    let sec = parseInt(count % 60)
                    let secLabel = ''
                    if (sec < 10) {
                        secLabel = '0' + sec
                    } else {
                        secLabel = sec
                    }
                    self.time.label = `00:${minLabel}:${secLabel}`
                } else {
                    let hour = parseInt(count / 3600)
                    let temp = parseInt(count % 3600)
                    let min = parseInt(temp / 60)


                    let hourLabel = ''
                    if (hour < 10) {
                        hourLabel = '0' + hour
                    } else {
                        hourLabel = hour
                    }

                    let minLabel = ''
                    if (min < 10) {
                        minLabel = '0' + min
                    } else {
                        minLabel = min
                    }

                    let sec = parseInt(temp % 60)
                    let secLabel = ''
                    if (sec < 10) {
                        secLabel = '0' + sec
                    } else {
                        secLabel = sec
                    }
                    self.time.label = `${hourLabel}:${minLabel}:${secLabel}`
                }

            }, 1000)
        },
        resetEmailError() {
            this.error.empty = false
            this.error.format = false
        },
        resetError() {
            // this.error.empty = false
            // this.error.format = false
            this.error = {
                empty: false,
                format: false,
                screen_not_exist: false,
                empty_screen: false,
                room_is_full: false,
                room_not_exist: false,
                can_not_start: false,
                screen_not_support: false,
                screenid_error: false
            }
            this.inviteScreen = ''
        },
        async shareScreen(e) {
            const self = this
            e.preventDefault()
            e.stopPropagation()

            if (this.isSharingScreen) {
                await this.handleVideoByShare(!this.isMutedVideo)
            } else {
                const result = await this.handleShareVideo(false, true)
                this.isTest = true
            }

            logger.info(`Step: meeting 分享屏幕 shareScreen()`)
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
                self.meetingStore.localStatus('meeting')
                client.stopShareScreen()

                // 停止分享重置大小
                Vue.nextTick(() => {
                    self.agoraClient.autoSize()
                })
            } else {
                // 分享
                this.meetingStore.localStatus('sharing')
                this.hasSharing = false
                this.selectWindowToShare()

                // 开始分享重置大小
                Vue.nextTick(() => {
                    self.agoraClient.autoSize()
                })
            }
        },
        selectWindowToShare() {
            let self = this
            logger.info(`Step: meeting 分享屏幕 selectWindowToShare() sharingProcessing:${this.sharingProcessing}`)
            if (this.sharingProcessing) {
                return
            }
            this.isSharingScreen = true
            this.sharingProcessing = true

            let uid = this.userInfo.id
            return capture.getWindows().then((wins) => {
                logger.info(`Step: meeting 分享屏幕 agoraClient.startShareScreen() in capture.getWindows callback`)

                let op = {
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: wins[0].id,
                            minWidth: 1280,
                            maxWidth: 1920,
                            minHeight: 720,
                            maxHeight: 1080
                        }
                    }
                }
                let success = function(stream) {
                    document.querySelector('#video-thumbnail').src = global.URL.createObjectURL(stream)
                }
                let error = function(e) {
                    logger.error(e)
                }
                navigator.getUserMedia(op, success, error)

                self.agoraClient.startShareScreen()
                self.sharingProcessing = false
            }, (error) => {
                logger.error(`capture get windows error: ${error}`)
                self.sharingProcessing = false
                if (this.isTest) {
                    self.handleShareVideo(true, true)
                    this.isTest = false
                }
            })
        },

        onPoperHide() {
            logger.info(`onPoperHide`)
            this.invitePopoverShow = false
            logger.info(`onPoperHide this.invitePopoverShow:${this.invitePopoverShow}`)
        },
        onPoperShow() {
            logger.info(`onPoperShow`)
            this.invitePopoverShow = true
            logger.info(`onPoperShow this.invitePopoverShow:${this.invitePopoverShow}`)
        },
        changeErrTip(errTip) {
            const self = this
            Object.keys(self.error).forEach(function(key) {
                self.error[key] = false
            })
            self.error[errTip] = true
        },
        startShareTimer() {
            // 30秒没有走到tv的mq join就可以退出
            let self = this
            if (self.shareTimer) {
                clearTimeout(self.shareTimer)
                self.shareTimer = null
            }
            self.processing.share = true
            self.shareTimer = setTimeout(() => {
                logger.info(`shareTimer start`)
                self.processing.share = false
            }, 3000)
        },
        checkRoomIsFull() {
            const self = this
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

            return meetingService.checkRoomFull(this.room, uuid.v4()).then((res) => {
                logger.info(`meetingService.checkRoomFull callback: ${JSON.stringify(res)}`)
                if (res.status) {
                    self.checkScreenExist()
                } else {
                    self.isJoined = false
                    self.linkingTV = false
                    if (!res.error) {
                        // error.room_is_full = true
                        self.changeErrTip('room_is_full')
                    } else {
                        // error.room_not_exist = true
                        self.changeErrTip('room_not_exist')
                    }

                }

            }).catch((err) => {
                console.log('check error')
                console.log(err)
                ErrorHandle.showErrorMessage({
                    code: 'server_error'
                })
                self.linkingTV = false
                self.isJoined = false
            })
        },
        checkScreenExist() {
            if (this.inviteScreen === '') {
                self.changeErrTip('empty_screen')
                self.linkingTV = false
                return
            }
            if (this.isJoined) {
                return
            }
            this.isJoined = true
            let self = this
            let screen = this.inviteScreen
            let startTime = new Date()
            return SmartOfficeAPI.checkScreenExist(screen).then((res) => {
                let endTime = new Date()
                logger.info(`SmartOfficeAPI.checkScreenExist time-consume:${endTime - startTime}`)
                if (res.status && res.isOnline && res.hasCamera) {
                    let screenStatusstartTime = new Date()
                    meetingService.screenStatus(res.macAddr).then((screenStatusRes) => {
                        let screenStatusendTime = new Date()
                        logger.info(`meetingService.screenStatus time-consume:${screenStatusendTime - screenStatusstartTime} response:${JSON.stringify(screenStatusRes)}`)
                        if (screenStatusRes.status) {
                            if (screenStatusRes.data === 'unused') {
                                let joinMeetingstartTime = new Date()
                                meetingService.joinMeeting(screen).then(response => {
                                    let joinMeetingendTime = new Date()
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
                            ErrorHandle.showErrorMessage({
                                message: '屏幕状态查询失败'
                            })
                        }
                    }).catch((err) => {
                        ErrorHandle.showErrorMessage({
                            message: '屏幕状态查询失败'
                        })
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
                ErrorHandle.showErrorMessage({
                    code: 'server_error'
                })
                self.isJoined = false
            })
        },
        vipShowMode() {
            let self = this
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
        },
        changeShowMode(e) {
            const self = this
            if (e) {
                e.preventDefault()
                e.stopPropagation()
            }
            logger.info(`changeShowMode isCreator${this.isCreator}`)
            if (this.isCreator) {
                this.isCreator = false
                this.showJoinRoonTip = true

                let local = self.meetingStore.local
                self.agoraClient.layoutController.removeTVByCtlId(local.streamId)
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
                    //
                    self.meetingStore.local.role = 'joiner'
                    let local = self.meetingStore.getLocal()
                    local.role = 'joiner'

                    MQ.publish(`meetingid-` + self.room, JSON.stringify({
                        action: 'role_change',
                        member: local
                    }))

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
                // this.invitePopoverShow = true
                let input = document.getElementById('screenInviteInput')
                if (input) {
                    setTimeout(() => {
                        input.focus()
                    }, 100)

                }
            }
        },
        controlScreen(screen) {
            const self = this
            let s = screen || this.inviteScreen
            logger.debug('control screen', s)
            let startTime = new Date()

            let local = self.meetingStore.getLocal()
            return SmartOfficeAPI.createMeetingRoom(this.room, s, {
                meetingCreatorId: local.uid,
                meetingCreatorClient: 'mtool'
            }).then(res => {
                let endTime = new Date()
                logger.info(`SmartOfficeAPI.createMeetingRoom time-consume:${endTime - startTime}`)
                if (res.status) {
                    self.isCreator = true
                    self.linkingTV = false
                    self.getScreenDevice(s)
                    self.meetingStore.local.role = 'creator'
                    logger.info(`controlScreen switchLayout to normal`)
                    self.agoraClient.layoutController.switchLayout('normal')
                    MQ.publish(`meetingid-` + self.room, JSON.stringify({
                        action: 'role_change',
                        member: self.meetingStore.getLocal()
                    }))
                } else {
                    self.isCreator = false
                }
                self.isJoined = false
                return res
            }).catch((err) => {
                console.log('check error')
                console.log(err)
                ErrorHandle.showErrorMessage({
                    code: 'server_error'
                })
                self.isCreator = false
                self.isJoined = false
            })
        },
        mqttInit() {
            const self = this
            logger.info(`Step: meeting mqttInit() start`)
            MQ.init({
                topic: this.room + '',
                member: this.meetingStore.getLocal(),
                mqeventHandle: (event) => {
                    self.mqttConnectHandle(event)
                },
                msgHandle: (msg) => {
                    if (msg.topic === self.room) {
                        self.handleMQMessage(msg.data)
                    }
                }
            })
        },
        mqttConnectHandle(event) {
            const type = event.type
            let self = this
            logger.info(`Step 会议 mqttConnectHandle event ${JSON.stringify(event)}`)
            switch (type) {
                case 'connect':
                    let local = this.meetingStore.getLocal()
                    logger.info(`Step 会议 MQ.publish action:${event.isReConnected ? 'reconnect' : 'join'} member:${JSON.stringify(local)}`)

                    MQ.publish(`meetingid-` + this.room, JSON.stringify({
                        action: event.isReConnected ? 'reconnect' : 'join',
                        member: local
                    }))
                    // 确保成员信息在agora 消息之前有？但是函数体里如果没有agoraclient 直接返回了
                    this.syncMembers()

                    if (!this.agoraClient) {
                        this.initAgoraClient()
                    }
                    break
                case 'error':
                    logger.error(`mq error`)
                    ErrorHandle.showErrorMessage({
                        message: 'MQ服务连接失败'
                    })
                    this.closeMeeting()
                    break
                case 'offline':
                    logger.error(`mq offline`)
                    ErrorHandle.showErrorMessage({
                        message: '会议服务连接中断'
                    })
                    break
                case 'reconnect':
                    logger.error(`mq reconnect`)
                    if (event.retried < 10) {
                        ErrorHandle.showErrorMessage({
                            message: '当前网络异常，无法保障视频会议质量'
                        })
                    } else {
                        ErrorHandle.showErrorMessage({
                            message: '会议服务连接中断'
                        })

                        this.closeMeeting()
                        // 退出声网
                    }

                    break
            }
        },
        handleMQMessage(msg) {
            const self = this
            const agoraClient = this.agoraClient
            self.userInfo = config.readSettings('userInfo')
            if (!agoraClient) {
                return
            }
            const meetingStore = this.meetingStore
            let local = meetingStore.getLocal()


            let member = msg.member
            let streamId = member.streamId
            let controller = null
            switch (msg.action) {
                case 'join':
                    logger.debug(`meetingStore join: ${JSON.stringify(member)}`)
                    if (member.type === 'tv' && member.controllerId + '' !== local.uid + '') {
                        // 切换Meeting.vue 为 showview

                    } else if (member.type === 'microphone' || member.type === 'android_microphone') {
                        let tvMembers = meetingStore.getTvMembers()
                        let linkedTv = tvMembers.find(p => p.linkedUid === member.uid)
                        logger.info(`local uid is: ${local.uid}, find linked tv: ${JSON.stringify(linkedTv)}`)
                        // 如果与麦克风绑定的屏幕的控制者是自己才切换麦克风
                        if (linkedTv && String(linkedTv.controllerId) === String(local.uid)) {
                            self.switchDevice('mic', true)
                        }
                    }
                    member.isMajor = true
                    meetingStore.join(member)
                    agoraClient.syncByStore(meetingStore, true)
                    agoraClient.addPanelByMqtt(member)
                    self.memberCount = self.meetingStore.getMemberCount()
                    logger.info(`join memberCount:${self.memberCount}`)
                    self.$emit('show-view')
                    if (member.type === 'tv' && member.controllerId + '' === local.uid + '') {
                        // 切换Meeting.vue 为 showview

                    }
                    if (member.type === 'tv') {
                        // 先找到对应的controller的stream id
                        // let cotrollerStreamId = self.agoraClient.layoutController.findCtlStreamIdById(member.controllerId)
                        // if (cotrollerStreamId) {
                        //     self.agoraClient.layoutController.hidePanelById(cotrollerStreamId)
                        // }
                        controller = self.meetingStore.getPeopleByUId(member.controllerId)
                        // let cotrollerStreamId = self.agoraClient.layoutController.findCtlStreamIdById(member.controllerId)
                        if (controller && controller.streamId) {
                            self.agoraClient.layoutController.hidePanelById(Number(controller.streamId))
                        }
                    }

                    break
                case 'leave':
                case 'leave-exception':
                    logger.debug(`leave | leave-exception msg ${JSON.stringify(msg)}`)
                    if (Number(member.streamId) === Number(local.streamId)) {
                        self.closeMeeting()
                    }

                    if (member.type === 'microphone' || member.type === 'android_microphone') {
                        // microphone 异常退出使用电脑
                        logger.info(`microphone leave-exception`)
                        let tvMembers = meetingStore.getTvMembers()
                        let linkedTv = tvMembers.find(p => p.linkedUid === member.uid)
                        logger.info(`local uid is: ${local.uid}, find linked tv: ${JSON.stringify(linkedTv)}`)
                        // 如果与麦克风绑定的屏幕的控制者是自己才切换麦克风
                        if (linkedTv && String(linkedTv.controllerId) === String(local.uid)) {
                            self.switchDevice('mic', false)
                        }

                        this.screenDeviceStatus.disableMic = true
                        this.screenDeviceStatus.disableSpeaker = true
                        this.isMutedAudio = false

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
                    if (member.type === 'tv') {
                        controller = self.meetingStore.getPeopleByUId(member.controllerId)
                        // let cotrollerStreamId = self.agoraClient.layoutController.findCtlStreamIdById(member.controllerId)
                        if (controller && controller.streamId) {
                            self.agoraClient.layoutController.showPanelById(Number(controller.streamId))
                        }
                    }
                    if (String(member.uid) === String(self.userInfo.id)) {
                        ErrorHandle.showErrorMessage({
                            message: '会议服务连接中断'
                        })
                        this.closeMeeting()
                        return
                    }

                    if (!streamId) {
                        member = meetingStore.getPeopleByUId(member.uid) || member
                        streamId = member.streamId
                    }
                    // if (streamId) {
                    //     this.agoraClient.removeVideoStream(streamId)
                    // }

                    meetingStore.leave(member)
                    self.agoraClient.layoutController.removePanelByOId(member.streamId)
                    self.memberCount = self.meetingStore.getMemberCount()
                    self.agoraClient.syncByStore(self.meetingStore, true)
                    let mode = this.$store.state.isFullscreenMode ? 'fullscreen' : 'normal'
                    logger.info(`leave or leave-exception switchLayout to ${mode}`)
                    self.agoraClient.layoutController.switchLayout(mode)
                    Vue.nextTick(() => {
                        self.agoraClient.autoSize()
                    })
                    // this.fireRelayout(e.data true)
                    break
                case 'reconnect-proxy':
                    if (!streamId) {
                        let m = meetingStore.getPeopleByUId(member.uid)
                        member = m || member
                    }
                    this.agoraClient.hidePanelTipByStreamId(member.streamId)
                    break
                case 'audio_muted':
                case 'audio_unmuted':
                    break
                case 'video_muted':
                case 'video_unmuted':
                    this.agoraClient.toggleVideoByMemeber(member, msg.action === 'video_muted')
                    if (msg.action === 'video_muted') {
                        member.video = 'off'
                    } else {
                        member.video = 'on'
                    }
                    meetingStore.updateMemberStatus(member)
                    break

                case 'share_stop':
                    // member.isMajor = false
                    meetingStore.join(member)
                    if (String(member.uid) !== String(self.userInfo.id)) {
                        if (self.agoraClient.layoutController.isTVController(member.streamId)) {
                            self.agoraClient.layoutController.showTVByCtlStreamId(member.streamId)
                            self.agoraClient.layoutController.hidePanelById(member.streamId)
                        }

                        if (self.oldmode !== this.$store.state.isFullscreenMode ? 'fullscreen' : 'normal') {
                            logger.info(`share_stop ${member.userName} switchLayout to ${self.oldmode}`)
                            self.agoraClient.layoutController.switchLayout(self.oldmode)
                            self.$store.state.isShowHeader = true
                            self.agoraClient.autoSize()
                        }
                    } else {
                        Vue.nextTick(() => {
                            self.agoraClient.autoSize()
                        })
                    }
                    // if (this.isTest) {
                    //     self.handleShareVideo()
                    //     this.isTest = false
                    // }
                    break
                case 'share_start':
                    meetingStore.join(member)
                    if (String(member.uid) !== String(self.userInfo.id)) {
                        self.oldmode = this.$store.state.isFullscreenMode ? 'fullscreen' : 'normal'
                        if (self.isSharingScreen) {
                            logger.info(`================= stop sharing when other start sharing`)
                            self.agoraClient.stopShareScreen()
                        }

                        // 进入fullscreen模式, 将分享者变成major
                        // 如果是控制者，隐藏自己控制的tv
                        self.agoraClient.updateMajorByStreamId(msg.member.streamId)
                        if (self.agoraClient.layoutController.isTVController(member.streamId)) {
                            self.agoraClient.layoutController.hideTVByCtlStreamId(member.streamId)
                            self.agoraClient.layoutController.showPanelById(member.streamId)

                        }

                        if (
                            self.oldmode === 'normal' &&
                            !self.agoraClient.updateMajorByStreamId(msg.member.streamId) &&
                            !self.isCreator
                        ) {
                            self.agoraClient.layoutController.switchLayout('fullscreen')
                            self.$store.state.isShowHeader = true
                        } else {

                        }
                        self.agoraClient.autoSize()
                    }
                    if (this.isTest) {
                        self.handleShareVideo(true, true)
                        this.isTest = false
                    }
                    break
                case 'role_change':
                    // self.agoraClient.updateMajorByStreamId(msg.member.streamId)
                    meetingStore.join(member)
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
                agoraClient.updatePanelStatus(meetingStore)
            }

            let members = meetingStore.sortMembers() || []
            if (this.isCreator && !this.roomInfo.isVip) {
                logger.debug(`this.isCreator && !this.roomInfo.isVip this.showJoinRoonTip = false`)
                this.showJoinRoonTip = false
            } else {
                let membersnomic = 0
                members.forEach(m => {
                    if (!m.isMicrophone()) {
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
            if (stop) {
                return
            }

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
                        self.agoraClient.addPanelByMqtt(member)
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
                case 'poor-network':
                    if (member.type !== 'microphone' && member.type !== 'android_microphone') {
                        this.agoraClient.showPanelTip('对方网络不稳定', member.uid, this.meetingStore)
                    }

                    break
                case 'share_stop':

                    break
            }

            self.clearShowTip()

            if (meetingStore.hasSharing()) {
                // 界面上好像没有地方使用hasSharing
                this.hasSharing = true
            } else {
                this.hasSharing = false
            }
            this.fireRelayout(member.streamId, (msg.action === 'leave' || msg.action === 'leave-exception'))
        },
        /**
         * 清除tip显示
         */
        clearShowTip() {
            const self = this
            setTimeout(() => {
                self.notifiction = {
                    message: '',
                    type: ''
                }
            }, 3000)
        },
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
        },
        fireRelayout(id, isLeave) {
            const agoraClient = this.agoraClient
            const meetingStore = this.meetingStore
            let self = this
            meetingStore.streamArrived(id)
            clearTimeout(this.repaintTimer)
            // 处理插件版分享流被换成摄像头的流
            if (this.isSharingScreen) {
                return
            }

            self.agoraClient.layoutController.switchLayout(this.$store.state.isFullscreenMode ? 'fullscreen' : 'normal')
            self.agoraClient.autoSize()

            if (agoraClient.getVideoStreamById(id) && !this.isSharingScreen) {

                this.repaintTimer = setTimeout(() => {
                    logger.info('fire user join  relayout: ', id)
                    agoraClient.showInfoByStore(meetingStore)
                    agoraClient.relayoutByStore(meetingStore)

                }, 200)
            } else if (isLeave) {
                this.repaintTimer = setTimeout(() => {
                    logger.info('fire user leave  relayout: ', id)

                    agoraClient.showInfoByStore(meetingStore)
                    agoraClient.relayoutByStore(meetingStore)
                }, 200)
            }
        },
        closeTip() {
            this.showJoinRoonTip = false
        },
        switchDevice(name, unmuted) {
            logger.info(`switchDevice, isMutedAudio: ${this.isMutedAudio}`)
            if (this.isMutedAudio) return
            let ss = this.screenStatus
            ss[name] = unmuted

            if (this.agoraClient) {

                if (ss.mic) {
                    logger.info('mute system volume')
                    deviceCtl.muteVolume()
                    this.agoraClient.toggleAudio(false)
                    // this.isMutedAudio = this.screenDeviceStatus.mic
                } else {
                    deviceCtl.unMuteVolume()
                    this.agoraClient.toggleAudio(true)
                }
                const self = this
                if (self.processing.mic) {
                    return
                }
                self.processing.mic = true
                let sds = this.screenDeviceStatus
                return SmartOfficeAPI.constrolDevice(this.room, this.inviteScreen || this.screen, {
                    name: 'mic',
                    action: ss.mic ? 'enable' : 'disable'
                }).then(() => {
                    sds.mic = ss.mic
                    self.processing.mic = false
                }).catch(() => {
                    self.processing.mic = false
                })
            }
        },
        /**
         * 同步成员
         */
        syncMembers() {
            const self = this
            logger.info(`Step 会议 syncMembers() start`)
            let store = this.meetingStore
            let room = self.room
            if (this.isSharingScreen || !self.agoraClient) {
                return
            }
            logger.info(`Step 会议 meetingService.getMembers(room:${room})`)
            let startTime = new Date()
            return meetingService.getMembers(room).then(res => {
                let endTime = new Date()
                logger.info(`meetingService.getMembers time-consume:${endTime - startTime}`)
                if (res.status) {
                    let result = store.checkedMemebersChangeed(res.members || [])
                    if (result.localLeave) {
                        self.closeMeeting({})
                    } else {
                        self.agoraClient.syncByStore(store, result.changed)
                        self.memberCount = self.meetingStore.getMemberCount()
                    }
                } else {
                    self.closeMeeting({})
                }
            })

        },
        checkShowJoinTip(n, o) {
            logger.debug(`checkShowJoinTip n:${JSON.stringify(n)}`)
            if (!n) {
                if (this.meetingStore && this.agoraClient) {
                    let members = this.meetingStore.getMembers()
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
            }

            Vue.nextTick(() => {
                this.agoraClient && this.agoraClient.autoSize()
            })
        },

        initVitualScroller() {
            const doms = document.getElementsByClassName('virtual-scroller')
            if (doms.length === 0) {
                return
            }
            this.vscroller = doms[0]
            if (this.vscroller.getAttribute('data-handled') === 'true') {
                return
            }
            this.vscrollerInsider = document.getElementsByClassName('virtual-scroller-inside-div')[0]
            this.layoutMainView = document.getElementsByClassName('layout-mainview')[0]

            this.vscroller.addEventListener('scroll', this.onVscrollerScroll)
            this.layoutMainView.addEventListener('scroll', this.onLayoutMainViewScroll)

            this.panelObserver = new window.MutationObserver(mutations => {
                setTimeout(() => {
                    this.updateVscrollerSize()
                }, 10)
            })
            this.panelObserver.observe(this.layoutMainView, {
                childList: true
            })

            this.vscroller.setAttribute('data-handled', 'true')

            if (!this.addedWindowResizeHandler) {
                window.addEventListener('resize', this.onWindowResize)
                this.addedWindowResizeHandler = true
            }
        },
        onVscrollerScroll(evt) {
            if (this.ignoreVscrollerScrollOneTime) {
                this.ignoreVscrollerScrollOneTime = false
                return
            }
            const wView = this.layoutMainView.offsetWidth
            this.ignoreLayoutMainViewScrollOneTime = true
            this.layoutMainView.scrollLeft = Math.floor(this.vscroller.scrollLeft * (wView / 500))
        },
        onLayoutMainViewScroll(evt) {
            if (this.ignoreLayoutMainViewScrollOneTime) {
                this.ignoreLayoutMainViewScrollOneTime = false
                return
            }
            const wView = this.layoutMainView.offsetWidth
            this.ignoreVscrollerScrollOneTime = true
            this.vscroller.scrollLeft = Math.floor(this.layoutMainView.scrollLeft * (500 / wView))
        },
        updateVscrollerSize() {
            const wView = this.layoutMainView.offsetWidth
            const wAll = this.layoutMainView.scrollWidth
            const w = Math.floor(500 / wView * wAll)
            this.vscrollerInsider.style.width = w + 'px'
        },
        onWindowResize() {
            setTimeout(() => {
                this.updateVscrollerSize()
            }, 10)
        }
    }
}
