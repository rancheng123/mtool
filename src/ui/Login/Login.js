const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const config = remote.require('./app/configuration')
const logger = remote.require('./app/logger')
const guestMode = remote.require('./app/guest-mode')
const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})
const SockJS = remote.require('sockjs-client')
//const StompJS = remote.require('stompjs')
const StompJS = electron.remote.require('./stomp/index')



import QRCode from 'qrcodejs2'
import { tooltip } from 'element-ui';
import SmartOfficeAPI from '../../service/SmartOfficeAPI'

import Config from 'components/Config/Config.vue'
import About from 'components/About/About.vue'

import ErrorHandle from '../../helpers/error/errorhandle'

export default {
    components: {
        'config': Config,
        'about': About,
        'ElTooltip': tooltip
    },

    props: [],

    data() {
        return {
            isGetQrCodeFailed: false,
            isShowCloseBtn: false,
            isShowConfigBtn: true,
            isShowAboutBtn: true,
            isShowAbout: false,
            isShowConfig: false,
            userName: '',
            password: '',
            isLog: false,
            loginFail: false,
            submitBtnText: '登录',
            isSubmitBtnEnable: true,
            isQrCodeLogin: true,
            isNetworkError: false,
            isQrCodeExpired: false,
            isSubmitBtnDisabled: false,
            emptyError: false,
            expiredTimer: null,
            qrCode: '',
            subscribeUuid: '',
            stompClient: null,
            iotStatus: '',
            isGuest: false,
            isPrivateCloud: false
        }
    },

    computed: {},

    watch: {
        'userName': 'resetLoginError',
        'password': 'resetLoginError'
    },

    created() { },

    mounted() {
        console.log('Login mounted~~~!')
        var self = this

        let _isGuest = guestMode.isGuestMode()
        self.isGuest = _isGuest

        this.iotStatus = config.readSettings('iotStatus')
        this.isPrivateCloud = config.readSettings('privateCloud')

        if (this.iotStatus !== 'ok') {
            let messInst = ErrorHandle.showErrorMessage({
                message: '您所在的场地没有授权，请在合法场地初始化程序',
                duration: 0
            })
            ipc.on('iot-ok', () => {
                logger.info('iot-ok')
                self.iotStatus = 'ok'
                self.initStomp()
                ErrorHandle.hideErrorMessage()
            })
        }

        window.addEventListener('online', self.networkOnlineHandler)
        window.addEventListener('offline', self.networkOfflineHandler)

        ipc.on('login-failed', function (event, data) {
            logger.info('browser show login failed: ', JSON.stringify(data))
            self.$store.state.isLogin = false
            if (data.qrcode) {
                window.alert('登录失败')
            }
            self.loginFail = true
            self.submitBtnText = '登录'
            self.isSubmitBtnDisabled = false
        })



        self.submitBtnText = '登录'
        self.isSubmitBtnDisabled = false

        self.$nextTick(() => {
            if (self.isGuest) {
                self.login('screenShareGuest', 'scr11nShareGu1st')
            } else {

                self.checkTokenAndLogin()
            }
        })
    },

    destroyed() {
        console.log('login ui destroyed')
        let self = this
        window.removeEventListener('online', self.networkOnlineHandler)
        window.removeEventListener('offline', self.networkOfflineHandler)
    },

    methods: {
        agoraProjector() {
            this.$router.replace({
                path: '/meeting-project',
                query: {
                    'type': 'projector',
                    'prefix': '访客'
                }
            })
        },
        networkOnlineHandler() {
            this.isNetworkError = false
            this.checkTokenAndLogin()
        },

        networkOfflineHandler() {
            this.isNetworkError = true
        },
        resetLoginError() {
            this.loginFail = false
        },
        logout() {
            let self = this
            ipc.send('logout')
            self.$store.state.isLogin = false
        },
        checkTokenAndLogin() {
            let self = this
            let userInfo = config.readSettings('userInfo')
            self.checkIfAuthTokenExpired().then(function (isExpired) {
                if (!isExpired && userInfo) {
                    remote.getCurrentWebContents().send('login-success', {
                        routerPath: '/app/home',
                        userInfo: userInfo
                    })

                    return
                } else {
                    self.$store.state.isLogin = false
                    return self.initStomp()

                }
            }).catch(function (error) {
                logger.error('checkIfAuthTokenExpired failed: ' + error.stack)
                self.isNetworkError = true
            })
        },

        renderQrcode(url) {
            if (this.qrcodeContext) {
                this.qrcodeContext.makeCode(url)
                return
            }
            this.qrcodeContext = new QRCode('qrcode', {
                width: 150,
                height: 150, // 高度
                text: url, // 二维码内容
                render: 'canvas'
            })
        },

        initStomp() {
            let self = this
            if (this.iotStatus !== 'ok') {
                return
            }

            return self.getLoginQrCode().then(function (result) {
                if (self.isPrivateCloud) {
                    self.qrCode = 'data:image/jpeg;base64,' + result.qrCode;
                } else {
                    self.qrCode = result.url
                }
                self.isQrCodeExpired = false
                self.subscribeUuid = result.uuid
                self.isGetQrCodeFailed = false
                if (!self.isPrivateCloud) {
                    self.renderQrcode(result.url)
                }
                if (self.expiredTimer) {
                    clearTimeout(self.expiredTimer)
                }
                self.qrCodeExpiredCounter()
                return self.connectToStomp()
            }).catch(function (error) {
                logger.error('get login qrcode error' + error.message)
                if (error.message.indexOf('get login qrcode failed') >= 0 ||
                    error.message.indexOf('get login csrf token failed' >= 0)) {
                    self.isGetQrCodeFailed = true
                }
            })
        },
        qrCodeExpiredCounter() {
            let self = this
            self.expiredTimer = setTimeout(function () {
                self.isQrCodeExpired = true
            }, 3 * 1000 * 60)
        },
        switchLoginMode() {
            this.isQrCodeLogin = !this.isQrCodeLogin
        },
        subscribe() {
            let self = this
            // 收到stomp服务的connect_ack, 服务器返回topicId, 开始订阅属于设备的topic
            self.stompClient.subscribe('/topic/wechat/auth/login/' + self.subscribeUuid, function (serverMessage) {
                logger.info(serverMessage.body)
                let resp = JSON.parse(serverMessage.body)
                let params = {
                    ...resp,
                    routerPath: '/app/home'
                }
                ipc.send('sns-login', params)
            }, function (error) {
                logger.error('***************** Erro Message When subscribe Stomp Topic: ' + error)
            })
        },
        connectToStompO() {
            logger.info(`ready to connect stomp client`)
            let self = this

            if (self.stompClient && self.stompClient.connected) {
                this.subscribe()
                return
            }

            let smartOfficeUrl = config.getSoUrl()

            let socket = new SockJS(smartOfficeUrl + '/websocket/wechat')
            self.stompClient = StompJS.over(socket)
            self.stompClient.heartbeat.incoming = 10000
            self.stompClient.heartbeat.outgoing = 10000

            self.stompClient.connect({}, function (frame) {
                var topicId = frame.body
                logger.info('***************** Subscribe stomp topic: ' + topicId)
                // this.subscribe()
                self.stompClient.subscribe('/topic/wechat/auth/login/' + self.subscribeUuid, function (serverMessage) {
                    logger.info(serverMessage.body)
                    let resp = JSON.parse(serverMessage.body)
                    let params = {
                        ...resp,
                        routerPath: '/app/home'
                    }
                    ipc.send('sns-login', params)
                }, function (error) {
                    logger.error('***************** Erro Message When subscribe Stomp Topic: ' + error)
                })
            }, function (error) {
                logger.error('*************** stomp connection error: ' + error)
                self.isQrCodeExpired = true
            })

        },
        connectToStomp() {
            // 私有云使用老逻辑
            if (this.isPrivateCloud) {
                this.connectToStompO();
            }
            logger.info(`ready to connect stomp client`)
            let polling = (uuid) => {
                return new Promise((resolve, reject) => {
                    SmartOfficeAPI.longin(uuid).then((response) => {
                        resolve(response)
                    })
                })
            }
            let me = this
            let beginPolling = (uuid) => {
                // 如果已经登录不在尝试
                if (me.$store.state.isLogin) {
                    return
                }
                return new Promise((resolve, reject) => {
                    polling(uuid).then((response) => {
                        if (response.code === '401' || response.code === 401) {
                            setTimeout(() => {
                                beginPolling(me.subscribeUuid)
                            }, 1000);
                        } else {
                            let resp = JSON.parse(response.data)
                            let params = {
                                ...resp,
                                routerPath: '/app/home'
                            }
                            ipc.send('sns-login', params)
                        }
                    }).catch(() => {
                        // beginPolling(me.subscribeUuid)
                    })
                })
            }
            beginPolling(me.subscribeUuid)
        },
        getLoginQrCode() {
            let self = this
            let smartOfficeUrl = config.getSoUrl()
            let uri
            if (self.isPrivateCloud) {
                uri = smartOfficeUrl + '/api/qrcode/auth/login?cacheBuster=' + Date.now();
            } else {
                uri = smartOfficeUrl + '/api/qrcode/auth'
            }
            logger.info('get login qr code from: ' + uri)
            let getLoginQrCodeOpts = {
                uri: uri,
                method: 'GET',
                json: true,
                transform: function (body, response, resolveWithFullResponse) {
                    if (response.statusCode === 200) {
                        return response.body
                    } else {
                        throw new Error('get login qrcode failed, status code: ' + response.statusCode)
                    }
                }
            }

            return rp(getLoginQrCodeOpts)
        },

        checkIfAuthTokenExpired() {
            let self = this
            logger.info('check if authToken is expired')
            let smartOfficeUrl = config.getSoUrl()
            let authToken = config.readSettings('authToken')
            return rp({
                uri: smartOfficeUrl + '/api/printing/quota',
                method: 'GET',
                json: true,
                headers: {
                    'auth-token': authToken
                },
                transform: function (body, response, resolveWithFullResponse) {
                    if (response.statusCode === 200) {
                        return false
                    }
                    if (response.statusCode === 401) {
                        return true
                    } else {
                        return true
                    }
                }
            })
        },

        login(name, password) {
            let self = this

            if (name && password) {
                ipc.send('login', {
                    userName: name,
                    password: password,
                    routerPath: '/app/home'
                })

                return
            }

            if (self.isSubmitBtnDisabled) {
                return
            }
            if (!self.userName || !self.password) {
                this.emptyError = true
                return
            }
            this.emptyError = false
            self.isSubmitBtnDisabled = true

            self.submitBtnText = '登录中...'
            this.isQrCodeLogin = false
            ipc.send('login', {
                userName: self.userName,
                password: self.password,
                routerPath: '/app/home'
            })
        },

        getQrCodeClicked() {
            this.initStomp()
        },

        loginSwitchBtnClicked() {
            let self = this
            if (this.iotStatus !== 'ok') {
                return
            }

            this.isQrCodeLogin = !this.isQrCodeLogin

            if (!this.isQrCodeLogin) {
                setTimeout(() => {
                    self.$refs.txtUserName.focus()
                }, 200)
            }

            this.loginFail = false
            this.emptyError = false
            if (this.isQrCodeExpired) {
                return this.initStomp()
            }
        },

        hideWindow() {
            remote.getCurrentWindow().hide()
        },

        configSelected() {
            this.isShowConfig = true
            this.isShowConfigBtn = false
            this.isShowAbout = false
            this.isShowAboutBtn = false
            this.isShowCloseBtn = true
        },

        finishedConfig() {
            this.closeClicked()
        },

        aboutSelected() {
            this.isShowConfig = false
            this.isShowConfigBtn = false
            this.isShowAbout = true
            this.isShowAboutBtn = false
            this.isShowCloseBtn = true
        },

        closeClicked() {
            this.isShowAbout = false
            this.isShowAboutBtn = true
            this.isShowConfig = false
            this.isShowConfigBtn = true
            this.isShowCloseBtn = false
        }
    }
}
