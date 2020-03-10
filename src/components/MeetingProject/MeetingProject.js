import {
    MessageBox
} from 'element-ui'
import {
    desktopCapturer
} from 'electron'
import AccessorialTitleBar from '../AccessorialTitleBar/AccessorialTitleBar.vue'
import TitleBar from '../TitleBar/TitleBar.vue'
import SmartOfficeAPI from '../../service/SmartOfficeAPI'
import meetingService from '../../service/meetingService'
import {
    AgoraWebRTC
} from '../../helpers/agora/agorawebrtc'
import {
    MeetingStore
} from '../../helpers/agora/meetingstore'

import {
    capture
} from '../../helpers/agora/chrome'

import AgoraError from '../../helpers/error/agoraerror'
import ErrorHandle from '../../helpers/error/errorhandle'
import Projector from '../Projector/Projector.vue'
const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const logger = remote.require('./app/logger')

const config = remote.require('./app/configuration')

const MQ = remote.require('./app/mqmessage')

let serverAddress = ''

const _ = require('lodash')
export default {
    components: {
        'janusprojector': Projector,
        AccessorialTitleBar,
        TitleBar
    },

    props: [],

    data() {

        return {
            notifiction: {
                type: 'info',
                message: ''
            },
            prefix: '',
            netinfo: '',
            netinfo1: '',
            agoraClient: null,
            isAgle: true,
            p2p: null,
            isconfirmWindow: false,
            isSharing: false,
            startBtnDisabled: false,
            cancelDisabled: false,
            isJoined: false,
            windows: [],
            publishing: false,
            showHelpPage: false,
            showWindowSeletor: false,
            screenId: '', // 点击开始按钮，input UI控件的绑定值
            roomId: '',
            isLootObj: null,
            useScreen: '',
            userInfo: {},
            shareTimer: null,
            useJanus: false,
            janusProjecting: false,
            checkRoomOK: false,
            error: {
                screen_not_exist: false,
                empty_screen: false,
                screenid_error: false
            },
            selectWinId: '',
            localStreamId: '',
            meetingStore: new MeetingStore(),
            selectedWindow: {},
            timer: null,
            speakerTarget: 'tv',
            publishWinId: '' // 当前正在投屏的id
        }
    },
    computed: {
        isAlreadyLogin() {
            return this.$store.state.isLogin
        }
    },
    beforeRouteEnter(to, from, next) {
        setTimeout(() => {
            let input = document.getElementById('meeting-input-project')
            if (input) {
                input.focus()
            }
        }, 200)
        next(vm => {
        })
    },
    mounted() {
        this.prefix = this.$route.query.prefix || '';
        let self = this
        self.userInfo = config.readSettings('userInfo') || {}
    },
    methods: {
        /**
         * 重新选择投频按钮
         */
        changeSharingScreen() {
            if (this.isSharing) {
                this.getWindow()
                this.showWindowSeletor = true
                this.isconfirmWindow = false
            }
        },

        /**
         * 校验roomId是否有效
         * @param {*} id
         */
        validateRoomId(id) {
            return !!id
        },

        /**
         * 路由修改
         */
        routeChange() {
            if (this.$route.path === '/meeting-projector') {
                let input = document.getElementById('meeting-input-project')
                if (input) {
                    setTimeout(() => {
                        input.focus()
                    }, 100)
                }
            }
            this.clearError()
        },

        /**
         * 清除错误信息
         */
        clearError() {
            if (this.isJoined) {
                return
            }

            // this.screenId = ''
            this.useScreen = ''
            this.error = {
                screen_not_exist: false,
                empty_screen: false,
                screenid_error: false
            }
        },
        /**
         * 重置页面状态
         */
        resetStatus() {
            logger.info(`Step: sharescreen resetStatus start`)
            this.screenId = ''
            this.useJanus = false
            this.useScreen = ''
            this.isJoined = false
            this.isAgle = true
            this.janusProjecting = false
            this.showWindowSeletor = false
            this.windows = []
            this.publishing = false
            this.isLootObj = null
            this.showHelpPage = false
            this.startBtnDisabled = false
            this.cancelDisabled = false
            this.checkRoomOK = false
            this.isSharing = false
            this.error = {
                screen_not_exist: false,
                empty_screen: false,
                screenid_error: false
            }
            if (this.agoraClient) {
                this.agoraClient.stopShareScreen().then(() => {
                    logger.info('close screen share');
                })
            }
            this.agoraClient = null
            this.selectedWindow = {}
            this.localStreamId = ''
            this.selectWinId = ''
            this.useScreenMacAddr = ''
            this.meetingStore = new MeetingStore()
            this.timer = null
            this.publishWinId = ''
            MQ.close()
            ipc.send('renderer-command', {
                'command': 'recoverDpi'
            })
        },

        /**
         * 修改错误提示
         * @param {*} errTip
         */
        changeErrTip(errTip) {
            const self = this
            Object.keys(self.error).forEach(function (key) {
                self.error[key] = false
            })
            self.error[errTip] = true
        },

        /**
         * 控制帮助信息显示和影藏
         * @param {*} flag
         */
        switchshowHelp(flag) {
            if (flag) {
                this.showHelpPage = true
            } else {
                this.showHelpPage = false
            }

        },

        /**
         * 停止分享屏幕
         * @param {*} e
         */
        stopSharingScreen(e) {
            logger.info(`Step: sharescreen stopSharingScreen(${e}) start `)
            const self = this
            this.isSharing = false
            this.checkRoomOK = false
            self.isconfirmWindow = false
            this.startBtnDisabled = false
            this.cancelDisabled = false
            this.janusProjecting = false
            let local = self.meetingStore.getLocal()
            logger.info(`Step: sharescreen stopSharingScreen(${e}) mq publish leave member ${JSON.stringify(local)}`)
            MQ.publish(`meetingid-` + self.roomId, JSON.stringify({
                // MQ.publish(self.roomId, JSON.stringify({
                action: 'leave',
                member: local
            }), () => {
                MQ.close()
            })
            if (this.roomId && this.useScreen) {
                let startTime = new Date()
                logger.info(`Step: sharescreen SmartOfficeAPI.freeScreen(roomId:${self.roomId}) useScreen:${self.useScreen}) start`)
                SmartOfficeAPI.freeScreen(this.roomId, this.useScreen, !this.isAlreadyLogin).then(res => {
                    let endTime = new Date()
                    logger.info(`Step: sharescreen SmartOfficeAPI.freeScreen(roomId:${self.roomId}) useScreen:${self.useScreen}) time-consume:${endTime - startTime} response ${JSON.stringify(res)} `)
                })
            }
            if (this.p2p) {
                self.publishing = false
                if (self.localScreen) {
                    self.p2p.unpublish(self.localScreen, self.useScreenMacAddr, function () {
                        logger.info('p2p unpublish success.')

                    }, function (err) {
                        logger.error(`p2p unpublish failed: ${err.message}`)
                    })
                    self.localScreen.close()
                    self.localScreen = undefined
                }

                self.p2p.stop(self.useScreenMacAddr, function () {
                    logger.info(`p2p.stop ${self.useScreenMacAddr} success.`)
                    self.p2p = null

                }, function (err) {
                    logger.error(`stop failed with message: ` + err.message)
                })
            }
            self.resetStatus()
            if (this.agoraClient) {
                // 离开后不显示错误信息
                this.agoraClient.on('global', (e) => { })
                logger.info(`Step: sharescreen agoraClient.leave()`)
                let startTime = new Date()
                this.agoraClient.leave(() => {
                    let endTime = new Date()
                    logger.info(`Step: sharescreen agoraClient.leave() time-consume:${endTime - startTime} success`)
                }, (err) => {
                    let endTime = new Date()
                    logger.info(`Step: sharescreen agoraClient.leave() time-consume:${endTime - startTime} fail ${JSON.stringify(err)}`)
                })
            }
            this.agoraClient = null
            setTimeout(() => {
                let input = document.getElementById('meeting-input-project')
                if (input) {
                    input.focus()
                }
            }, 300)
        },

        /**
         * 投频30秒没有成功处理逻辑
         */
        startShareTimer() {
            // 30秒没有走到tv的mq join就可以退出
            logger.info(`startShareTimer()`)
            let self = this
            self.cancelDisabled = true
            if (self.shareTimer) {
                clearTimeout(self.shareTimer)
                self.shareTimer = null
            }

            self.shareTimer = setTimeout(() => {
                logger.info(`shareTimer 30s timeout self.cancelDisabled:${self.cancelDisabled}`)
                self.errorInstance = ErrorHandle.showErrorMessage({
                    message: '本次投影出现延迟，可选择取消稍后重试'
                })
                this.stopSharingScreen();
                self.cancelDisabled = false
                // bugfix:2529 30s超时后需要调到发起界面
                self.isconfirmWindow = false
                self.isSharing = false
                self.startBtnDisabled = false
            }, 60000)
        },

        /**
         * 输入屏幕id点击开始投屏
         */
        startBtnClicked() {
            let self = this
            if (self.startBtnDisabled) {
                return false
            }
            if (self.isJoined) {
                return
            }
            this.agoraClient = null
            let screen = self.screenId
            this.useScreen = screen

            if (!/^[0-9]+$/.test(self.screenId)) {
                this.changeErrTip('screenid_error')
                return
            }
            logger.info(`Step: start MeetingProject`)
            if (self.validateRoomId(screen) && screen.trim() !== '') {
                logger.info(`Step: sharescreen checkScreenExist start`)
                self.startBtnDisabled = true

                SmartOfficeAPI.checkScreenExist(screen).then((res) => {
                    // 测试连接速度
                    if (res.status && res.status.localIP) {
                        logger.logPing(`http://${res.status.localIP}`)
                    }
                    logger.info(`screen:isOnline:${res.isOnline}`)
                    if (res.status && res.isOnline && (res.type === 'ScreenPro')) {
                        // if (res.isAgle) {
                        // 使用agle投屏
                        self.isAgle = true
                        // }
                        let screenStatusstartTime = new Date()
                        return meetingService.screenStatus(res.macAddr).then((screenStatusRes) => {
                            let screenStatusendTime = new Date()
                            logger.info(`MeetingService.screenStatus time-consume:${screenStatusendTime - screenStatusstartTime}`)
                            if (screenStatusRes.status) {
                                if (screenStatusRes.data === 'used') {
                                    logger.info(`Step: screenStatusRes.data === 'used'`)
                                    MessageBox.confirm(`屏幕(${screen})正在使用, 是否将对方踢下线?`, '提示', {
                                        showCancelButton: true,
                                        confirmButtonText: '确定',
                                        cancelButtonText: '取消',
                                        showConfirmButton: true,
                                        closeOnClickModal: false
                                    }).then(() => {
                                        self.isLootObj = {
                                            'mac': res.macAddr
                                        }
                                        self.join(res)
                                    }).catch(() => {
                                        logger.info(`Step: sharescreen  取消抢屏`)
                                        self.isJoined = false
                                        self.startBtnDisabled = false
                                        self.cancelDisabled = false
                                    })
                                } else if (screenStatusRes.data === 'unused') {
                                    logger.info(`Step: screenStatusRes.data === 'unused'`)
                                    self.join(res)
                                }
                            } else {
                                self.isJoined = false
                                self.startBtnDisabled = false
                                self.cancelDisabled = false
                                self.changeErrTip('screen_not_exist')
                                logger.info(`MeetingService.screenStatus response screenStatusRes.status false`)
                            }
                        }).catch((err) => {
                            logger.error(`meetingService.screenStatus err: ${JSON.stringify(err)}`)
                            self.isJoined = false
                            self.startBtnDisabled = false
                            self.cancelDisabled = false
                        })
                    } else if (res.status && res.isOnline && (res.type !== 'ScreenPro')) {
                        // janus 没有ms
                        self.join(res)
                    } else {
                        self.isJoined = false
                        self.changeErrTip('screen_not_exist')
                        self.startBtnDisabled = false
                        self.cancelDisabled = false
                    }
                    self.isJoined = false
                }).catch((e) => {
                    logger.error(`MeetingProject.js checkScreenExist e:${e}`)
                    ErrorHandle.showErrorMessage({
                        code: 'server_error'
                    })
                    self.isJoined = false
                    self.startBtnDisabled = false
                    self.cancelDisabled = false
                })
                self.checkRoomOK = true
                ipc.send('reset-agent')
            } else {
                self.changeErrTip('empty_screen')
                return
            }
        },

        /**
         * 加入事件
         * @param {*} res
         */
        join(res) {
            let self = this
            logger.info(`Step: sharescreen join() start`)
            self.isJoined = true
            self.startBtnDisabled = false

            self.checkRoomOK = true
            this.getWindow(res)
        },

        /**
         * 获取窗口/重新获取窗口
         */
        getWindow(res) {
            const self = this
            res && (this.res = res)
            if (this.res.type === 'ScreenPro') {
                logger.info(`Step: sharescreen join type ScreenPro`)
                // self.useScreen = res.macAddr
                self.useScreenMacAddr = this.res.macAddr
                let startTime = new Date()

                // agle 投屏
                capture.getWindows().then((wins) => {
                    let current = ''
                    wins.forEach(w => {
                        w.title = w.name
                        w.isSelected = false
                        // 切换投屏时，选中当前选中项
                        if (w.id === self.publishWinId) {
                            current = w
                        }
                    })
                    // logger.info(`wins: ${JSON.stringify(wins)}`)
                    self.windows = wins
                    self.showWindowSeletor = true
                    self.selectWindow(current || self.windows[0])
                }, (error) => {
                    logger.error(`capture get windows error: ${error}`)
                })
            } else {
                logger.info(`Step: sharescreen join getJanusWindows()`)
                let current = ''
                self.getJanusWindows().then((wins) => {
                    self.useJanus = true

                    wins.forEach(w => {
                        w.title = w.name
                        w.isSelected = false
                        if (w.id === self.publishWinId) {
                            current = w
                        }
                    })
                    self.windows = wins
                    self.showWindowSeletor = true
                    self.selectWindow(current || self.windows[0])
                })
            }
        },
        cancel() {
            logger.info(`cancel to home`)
            let self = this
            ipc.send('stop-agent')
            this.resetStatus()
            this.$router.replace({
                path: '/app/home'
            })

            setTimeout(() => {
                let input = document.getElementById('meeting-input-project')
                if (input) {
                    input.focus()
                }
            }, 300)
            self.isconfirmWindow = false
        },
        cancelWindow() {
            if (this.isSharing) {
                this.showWindowSeletor = false
                return
            }
            logger.info(`cancelWindow`)
            let self = this
            this.resetStatus()

            setTimeout(() => {
                let input = document.getElementById('meeting-input-project')
                if (input) {
                    input.focus()
                }
            }, 300)
            self.isconfirmWindow = false
        },
        createMeetingRoom() {
            const self = this
            logger.info(`Step: sharescreen createMeetingRoom() start `)
            this.roomId = 'sharescreen:' + this.useScreen
            let con = document.getElementById('m-projectors-con')
            con.innerHTML = ''

            this.localStreamId = MQ.generateNumberID()
            console.log(self.userInfo)
            this.meetingStore.init({
                id: this.isAlreadyLogin ? (self.userInfo.id + '') : this.roomId + '0',
                uid: this.isAlreadyLogin ? (self.userInfo.id + '') : this.roomId + '0',
                streamId: self.localStreamId,
                userName: this.isAlreadyLogin ? (self.userInfo.fullName || '') : '访客',
                room: self.roomId,
                type: 'user',
                screen: self.useScreen,
                role: 'creator'
            })
            // let win = this.selectedWindow || {}
            logger.info('start MettingRoom.....');
            meetingService.startMeeting(self.roomId, this.meetingStore.getLocal()).then(res => {
                if (res.status) {
                    logger.info(`start mqtt........`);
                    self.mqttInit()
                } else {
                    self.startBtnDisabled = false
                    self.cancelDisabled = false
                    self.isJoined = false
                }
            }).catch(() => {
                ErrorHandle.showErrorMessage({
                    code: 'server_error'
                })
                self.startBtnDisabled = false
                self.cancelDisabled = false
                self.isJoined = false
            })
        },
        getStats() {
            let self = this
            if (self.p2p !== null) {
                self.p2p.getConnectionStats(self.useScreenMacAddr, function (streamStats) {
                    if (streamStats.length > 0) {
                        logger.info('p2p getStats streamStats.length:' + streamStats.length)
                        let logObj = {}
                        streamStats.forEach(function (stats) {
                            if (stats.type === 'ssrc_video_send') {
                                let video = `,分辨率:${stats.stats.send_frame_width}x${stats.stats.send_frame_height},帧率:${stats.stats.framerate_sent}`
                                self.netinfo1 = video
                                logger.info(video);
                            }
                        })
                    }
                }, function (err) {
                    logger.error('get connection stats failed : ' + err.message)
                })
            }
        },
        startNetInfo() {
            const mqttServer = config.readSettings('meetingMqttDomain')
            logger.info(`ping ${mqttServer} .........`);
            this.getStats()
            if (this.isSharing) {
                logger.lognet(mqttServer, (m, t) => {
                    this.netinfo = `丢包率：${m}, 延迟率:${t}ms`
                    setTimeout(() => {
                        this.startNetInfo()
                    }, 10000)

                });
            }
        },
        /**
         * 初始化高龙客户端
         */
        initAgleClient() {
            const self = this
            logger.info('initAgleClient')
            if (config.readSettings('agle') && config.readSettings('agle').length > 1) {
                serverAddress = 'https://' + config.readSettings('agle') + ':8096'
                logger.info('initAgleClient agle serverAddress ' + serverAddress)
            } else {
                let logObj = {}
                logger.error('share screen failed(CONFIG)')
                ErrorHandle.showErrorMessage({
                    message: '获取投屏配置为空'
                })
                self.stopSharingScreen()
                return
            }
            let startTime = new Date()

            self.roomId = 'sharescreen:' + self.useScreen

            let con = document.getElementById('m-projectors-con')
            con.innerHTML = ''

            self.p2p = new global.JSClient.PeerClient({
                videoCodec: 'VP8',
                audioCodec: 'OPUS'
                // videoCodec: 'H264'
            })
            self.p2p.on('chat-accepted', function (e) {
                logger.info('Invitation to ' + e.senderId + ' has been accepted.')
            })

            self.p2p.on('chat-denied', function (e) {
                logger.info('Invitation to ' + e.senderId + ' has been denied.')
            })

            self.p2p.on('chat-started', function (e) { // Chat started
                let chatstartedTime = new Date()
                logger.info(`chat started. time-consume:${chatstartedTime - startTime}`)
                try {
                    if (self.localScreen !== undefined) {
                        self.localScreen.close()
                        self.localScreen = undefined
                    }
                    global.JSClient.LocalStream.create({
                        video: {
                            device: 'screen',
                            resolution: 'hd1600p',
                            frameRate: [7, 20],
                            windowId: self.selectWinId
                        },
                        audio: false
                    }, function (err, stream) {
                        if (err) {
                            return logger.error('create Screen data failed:', err)
                        }
                        let publishTime = new Date()

                        // 当前投屏id
                        self.publishWinId = self.selectWinId
                        self.localScreen = stream

                        logger.info(`p2p.publish(${JSON.stringify(self.localScreen)},${self.useScreenMacAddr} time-consume:${publishTime - startTime})`)
                        self.p2p.publish(self.localScreen, self.useScreenMacAddr, function () {
                            logger.info('publish success.')
                            document.querySelector('#video-thumbnail').src = global.URL.createObjectURL(stream.mediaStream)
                            self.publishing = true
                        }, function (err) {
                            logger.info(`publish failed: ${err.message} `)
                        }) // Publish screen data to remote client
                    })
                } catch (e) {
                    logger.error(`p2p chat-started error ${JSON.stringify(e)}`)
                }
            })

            self.p2p.on('chat-stopped', function (e) {
                self.publishing = false
                logger.info('chat stopped.')
                if (self.localScreen) {
                    self.localScreen.close()
                    self.localScreen = undefined
                }
                self.p2p.stop(self.useScreenMacAddr, function () {
                    logger.info(`p2p.stop ${self.useScreenMacAddr} success.`)
                    self.p2p = null
                    if (self.isSharing) {
                        self.errorInstance = ErrorHandle.showErrorMessage({
                            message: '网络异常,请检测网络'
                        })
                        // self.stopSharingScreen()
                    }
                }, function (err) {
                    logger.error(`stop failed with message: ` + err.message)
                })
                if (self.timer) {
                    clearInterval(self.timer)
                }
                // self.stopSharingScreen(e)
                logger.info('Chat stopped. Sender ID: ' + e.senderId + ', peer ID: ' + e.peerId)
            })
            self.p2p.on('chat-failed', function (e) {
                self.publishing = false
                if (self.timer) {
                    clearInterval(self.timer)
                }
                logger.info('Chat failed. Peer ID: ' + e.peerId)
                self.errorInstance = ErrorHandle.showErrorMessage({
                    message: '无法连接到电视,请检测网络'
                })
            })

            self.p2p.on('stream-closed', function (e) {
                if (self.publishing) {
                    logger.info('stream-closed. Screen stream to ' + e.senderId + ' was closed by low level.')
                    logger.info(`p2p.publish(${JSON.stringify(self.localScreen)},${self.useScreenMacAddr})`)
                    ipc.send('disable-gpu', {})
                    setTimeout(function () {
                        self.p2p.publish(self.localScreen, self.useScreenMacAddr, function () {
                            logger.info('publish success.')
                            self.publishing = true
                        }, function (err) {
                            logger.info(`publish failed: ${err.message} `)
                        })
                    }, 500)
                }
            })
            logger.info(`p2p connect serverAddress:${serverAddress} localStreamId:${self.localStreamId}`)

            let me = self.meetingStore.getLocal()
            self.p2p.connect({
                host: serverAddress,
                token: me.uid
            }, function () {
                let connectendTime = new Date()
                logger.info(`p2p connect success time-consume:${connectendTime - startTime}`)
                self.controlScreen(self.useScreen)
                let job = function (retry_chance) {
                    if (retry_chance === 0) {
                        return
                    }
                    self.showWindowSeletor = false
                    self.isSharing = true
                    // 开始计算
                    self.startNetInfo();
                    // navigator.getUserMedia(hints, success, error)

                    self.p2p.invite(self.useScreenMacAddr, function () {
                        let inviteendTime = new Date()
                        logger.info(`p2p Invite success. useScreenMacAddr:${self.useScreenMacAddr} time-consume:${inviteendTime - startTime}`)
                    }, function (err) {
                        logger.error(`p2p Invite useScreenMacAddr:${self.useScreenMacAddr} failed with message: ${err.message}`)
                        if (retry_chance === 40) {
                            logger.error(`share screen failed(INVITE)`)
                        }
                        setTimeout(() => {
                            job(--retry_chance)
                        }, 1000)
                    })
                }
                job(40)

            }, function (err) {
                logger.error('p2p connect failed with message: ' + err.message)
                logger.error(`share screen failed(CONNECT)`)
                self.p2p = null
            })
        },

        /**
         * 初始化声网客户端
         */
        initAgoraClient() {
            const mToolVideoResolution = config.readSettings('mToolVideoResolution')
            logger.info(`initAgoraClient  mToolVideoResolution:${mToolVideoResolution}`)
            const self = this
            const agoraId = config.readSettings('agoraId')

            self.roomId = 'sharescreen:' + self.useScreen
            logger.info(`Step: sharescreen  initAgoraClient() start agoraId:${agoraId} roomId:${self.roomId}`)
            let con = document.getElementById('m-projectors-con')
            con.innerHTML = ''

            let win = this.selectedWindow || {}

            let agoraClient = new AgoraWebRTC({
                appId: agoraId,
                roomName: self.roomId,
                dom: con,
                disableSubcribe: true,
                videoProfile: mToolVideoResolution || '720P',
                localStreamConfig: {
                    screen: true,
                    audio: false
                }
            })
            this.agoraClient = agoraClient

            agoraClient.on('global', (e) => {
                console.log(e)
                self.handleAgoraEvent(e)
                self.isJoined = false
            })
            logger.info(`Step: sharescreen  agoraClient.joinChannel() start `)
            let joinChannelstartTime = new Date()
            agoraClient.joinChannel().then(() => {
                let joinChannelendTime = new Date()
                logger.info(`Step: sharescreen agoraClient.joinChannel time-consume:${joinChannelendTime - joinChannelstartTime}`)
                logger.info(`Step: sharescreen  agoraClient.joinRoom() start `)
                let joinRoomstartTime = new Date()
                agoraClient.joinRoom(self.roomId, self.localStreamId, (error) => {
                    let joinRoomendTime = new Date()
                    logger.info(`Step: sharescreen agoraClient.joinRoom time-consume:${joinRoomendTime - joinRoomstartTime}`)
                    error = true
                    if (error) {
                        logger.error('agora join room error')
                        ErrorHandle.showErrorMessage({
                            message: '发送视频流失败'
                        })
                        self.isJoined = false
                        self.startBtnDisabled = false
                        self.cancelDisabled = false
                        return
                    }
                    console.log('start m')
                    self.showWindowSeletor = false
                    self.isSharing = true
                    self.controlScreen(self.useScreen)
                })
            }).catch(() => {
                logger.error('agora join chenel error')
                ErrorHandle.showErrorMessage({
                    message: '视频客户端初始化失败'
                })
                self.isJoined = false
            })


        },
        changePublish() {
            const self = this
            let startTime = new Date()

            try {
                // 先取消上次的流
                if (self.localScreen !== undefined) {
                    self.p2p.unpublish(self.localScreen, self.useScreenMacAddr, function () {
                        logger.info('p2p unpublish success.')
                    }, function (err) {
                        logger.error(`p2p unpublish failed: ${err.message}`)
                    })
                    self.localScreen.close()
                    self.localScreen = undefined
                }
                global.JSClient.LocalStream.create({
                    video: {
                        device: 'screen',
                        resolution: 'hd1600p',
                        frameRate: [5, 30],
                        windowId: self.selectWinId
                    },
                    audio: false
                }, function (err, stream) {
                    if (err) {
                        return logger.error('create Screen data failed:', err)
                    }
                    let publishTime = new Date()

                    // 当前投屏id
                    self.publishWinId = self.selectWinId
                    self.localScreen = stream
                    logger.info(`p2p.publish(${JSON.stringify(self.localScreen)},${self.useScreenMacAddr} time-consume:${publishTime - startTime})`)
                    self.p2p.publish(self.localScreen, self.useScreenMacAddr, function () {
                        logger.info('publish success.')
                        self.publishing = true

                        self.lastSendPackets = 0
                        self.lastLostPackets = 0

                        document.querySelector('#video-thumbnail').src = global.URL.createObjectURL(stream.mediaStream)

                    }, function (err) {
                        logger.info(`publish failed: ${err.message} `)
                    }) // Publish screen data to remote client
                })
            } catch (e) {
                logger.error(`p2p chat-started error ${JSON.stringify(e)}`)
            }
        },

        /**
         * 选中需要分享的窗口
         * @param {*} w 窗口对象
         */
        selectWindow(w) {
            this.windows.forEach(win => {
                win.isSelected = false
            })
            w.isSelected = true
            this.selectedWindow = w
            try {
                capture.selectStreamSource(w.id)
            } catch (e) {
                logger.error(`capture.selectStreamSourc e ${JSON.stringify(e)}`)
            }

            this.selectWinId = w.id
        },

        /**
         * 选中窗口点击确定
         */
        confirmWindow() {
            logger.info(`confirmWindow()`)
            const self = this

            if (self.isSharing) {
                capture.getScreenStream().then(stream => {
                    self.changePublish()
                    this.showWindowSeletor = false
                })
                return
            }

            if (self.isconfirmWindow) {
                return
            }
            self.isconfirmWindow = true

            self.startShareTimer()
            if (self.isLootObj && self.isLootObj.mac) {
                let genNewScreenIdstartTime = new Date()
                logger.info(`Step: sharescreen 抢屏 genNewScreenId ${self.isLootObj.mac}}`)
                SmartOfficeAPI.genNewScreenId(self.isLootObj.mac).then((result) => {
                    let genNewScreenIdendTime = new Date()
                    logger.info(`Step: sharescreen 抢屏 genNewScreenId  time-consume:${genNewScreenIdendTime - genNewScreenIdstartTime} response: ${JSON.stringify(result)}`)
                    if (result.status) {
                        self.screenId = self.useScreen = result.screenId
                        // self.screenId = result.screenId
                        logger.info(`Step: sharescreen confirmWindow() isSharing is: ${this.isSharing} useJanus is: ${this.useJanus}`)
                        if (this.isSharing) {
                            return
                        }

                        if (this.useJanus) {
                            this.janusProjecting = true
                            self.showWindowSeletor = false
                            this.windows = []
                        } else {
                            ipc.send('renderer-command', {
                                'command': 'changeDpi'
                            })
                            this.createMeetingRoom()
                        }
                    } else {
                        logger.error(`SmartOfficeAPI.genNewScreenId return status false`)
                        return
                    }

                }).catch(() => {
                    logger.error(`SmartOfficeAPI.genNewScreenId fail`)
                })
            } else {
                logger.info(`Step: sharescreen confirmWindow() isSharing is: ${this.isSharing} useJanus is: ${this.useJanus}`)
                if (this.isSharing) {
                    return
                }

                if (this.useJanus) {
                    this.janusProjecting = true
                    self.showWindowSeletor = false
                    this.windows = []
                } else {
                    ipc.send('renderer-command', {
                        'command': 'changeDpi'
                    })
                    this.createMeetingRoom()
                }
            }
        },
        controlScreen(screen) {
            const self = this
            let s = screen || this.inviteScreen
            logger.info(`Step: sharescreen  controlScreen(${s}) start `)
            logger.info(`Step: sharescreen  createMeetingRoom(roomId:${self.roomId}, s:${s}) start `)
            let startTime = new Date()
            let local = self.meetingStore.getLocal()
            return SmartOfficeAPI.createMeetingRoom(self.roomId, s, {
                meetingCreatorId: local.uid,
                meetingCreatorClient: 'mtool'
            }, null, !this.isAlreadyLogin).then(res => {
                let endTime = new Date()
                logger.info(`Step: sharescreen  SmartOfficeAPI.createMeetingRoom(roomId:${self.roomId}, s:${s}) time-consume:${endTime - startTime} response:${JSON.stringify(res)}`)
                if (res.status) {

                } else {
                    ErrorHandle.showErrorMessage({
                        message: '连接屏幕失败'
                    })
                }
                self.isJoined = false
                return res
            }).catch((err) => {

                logger.info(`SmartOfficeAPI.createMeetingRoom err:${JSON.stringify(err)}`)
                ErrorHandle.showErrorMessage({
                    code: 'server_error'
                })
                self.stopSharingScreen()
                self.startBtnDisabled = false
                self.cancelDisabled = false
                self.isJoined = false
            })
        },
        mqttInit() {
            const self = this
            logger.info(`Step: sharescreen mqttInit() start`)
            MQ.init({
                topic: this.roomId,
                member: this.meetingStore.getLocal(),
                mqeventHandle: (event) => {
                    logger.info(`mq event handle ${event.type} `)
                    self.mqttConnectHandle(event)
                },
                msgHandle: (msg) => {
                    logger.info(`message callback  self.roomId:${self.roomId} msg.topic:${msg.topic} : ${JSON.stringify(msg)}`)
                    if (msg.topic === self.roomId) {
                        self.handleMQMessage(msg.data)
                    }

                }
            })
        },
        handleMQMessage(msg) {
            const self = this
            let member = msg.member
            const meetingStore = this.meetingStore
            let local = meetingStore.getLocal()
            logger.info(`投屏 handleMQMessage msg ${JSON.stringify(msg)} `)

            switch (msg.action) {
                case 'join':
                    self.startBtnDisabled = false
                    self.cancelDisabled = false
                    if (self.shareTimer) {
                        clearTimeout(self.shareTimer)
                        self.shareTimer = null
                    }
                    if (self.errorInstance) {
                        self.errorInstance.close()
                        self.errorInstance = null
                    }
                    break
                case 'leave':
                case 'leave-exception':
                    if (member.type === 'tv' && member.controllerId + '' === local.uid + '') {
                        logger.info(`tv leave leave-exception`)
                        this.notifiction.message = `${member.userName} 已退出`
                        this.notifiction.type = 'error'
                        setTimeout(() => {
                            self.stopSharingScreen()
                        }, 1000)
                        setTimeout(() => {
                            self.notifiction = {
                                message: '',
                                type: ''
                            }
                        }, 3000)

                    }
                    break
            }
        },
        mqttConnectHandle(event) {
            const type = event.type
            let self = this
            logger.info(`Step sharescreen mqttConnectHandle event ${JSON.stringify(event)}`)
            switch (type) {
                case 'connect':
                    let local = this.meetingStore.getLocal()
                    MQ.publish(`meetingid-` + this.roomId, JSON.stringify({
                        // MQ.publish(this.roomId, JSON.stringify({
                        action: event.isReConnected ? 'reconnect' : 'join',
                        member: local
                    }), () => {

                    })

                    if (self.isAgle) {
                        if (!self.p2p) {
                            this.initAgleClient()
                        }
                    } else {
                        if (!this.agoraClient) {
                            this.initAgoraClient()
                        }
                    }

                    break
                case 'error':
                    ErrorHandle.showErrorMessage({
                        message: '投影服务连接失败'
                    })
                    this.stopSharingScreen()
                    break
                case 'reconnect':
                    logger.info(`mq reconnect:${event.retried}`)
                    // 测试mqtt连接
                    const mqttServer = config.readSettings('meetingMqttDomain')
                    logger.logPing(mqttServer);
                    if (event.retried < 10) {

                    } else {
                        logger.info('重试失败，断开连接');
                        ErrorHandle.showErrorMessage({
                            message: '投影服务中断，请稍后重试'
                        })
                        this.stopSharingScreen()
                    }
                    break
            }
        },
        closeAero() {
            logger.info(`closeAero`)
            ipc.send('closeAero', {})

        },
        handleAgoraEvent(e) {
            const self = this
            logger.info(`投屏 handleAgoraEvent e ${JSON.stringify(e)}`)
            let type = e.type
            switch (type) {
                case 'init_local_stream':
                    break
                case 'start-share-screen':

                    break
                case 'stop-share-screen':
                    if (e.status) {
                        this.isSharing = false
                    }
                    break
                case 'client_init':
                case 'error':
                    let err = e.error
                    if (err) {
                        let error = AgoraError.handleError(e)
                        if (error.code) {
                            logger.error(`Agora Client ${error.code}`)
                            ErrorHandle.showErrorMessage(error)
                        }
                    }
                    break
            }
        },
        getJanusWindows() {
            let self = this
            logger.info(`投屏 getJanusWindows`)
            return new Promise((resolve, reject) => {
                let types = ['window', 'screen']

                desktopCapturer.getSources({
                    types: types,
                    thumbnailSize: {
                        width: 215,
                        height: 131
                    }
                }, (err, data) => {
                    if (!err) {
                        for (var i = 0; i < data.length; i++) {
                            data[i]['img'] = data[i]['thumbnail'].toDataURL()
                        }
                        resolve(data)
                    } else {
                        console.log(err)
                        reject()
                    }
                })
            })

        }
    }
}
