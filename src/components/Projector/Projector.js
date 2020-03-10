const electron = require('electron')
const ipc = electron.ipcRenderer
const desktopCapturer = electron.desktopCapturer
const remote = electron.remote
const config = remote.require('./app/configuration')
const uuid = require('node-uuid')
const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})

export default {
    components: {},

    props: ['isPrivateMode', 'selectWindowId', 'roomId', 'startProject', 'isAgora'],

    data() {
        return {
            myPurpose: '',
            isNetWorkOffline: false,
            janus: undefined,
            videoRoomPlugin: undefined,
            captureSourceType: 'screen',
            isSharing: false,
            role: 'publisher',
            startBtnDisabled: false,
            startButtonText: '开始',
            checkNetWorkIntervalHandler: undefined
        }
    },

    computed: {
        Janus() {
            return window.bridge.Janus
        }
    },

    watch: {
        '$route': 'routeChange',
        'startProject': 'watchProjecting'
    },

    created() {
        let self = this
        ipc.on('confirm-select-screen', self.onScreenSelected)

        // if (self.checkNetWorkIntervalHandler) {
        //     clearInterval(self.checkNetWorkIntervalHandler)
        // }

        // self.checkNetWorkIntervalHandler = setInterval(() => {
        //     self.checkNetWork()
        // }, 5000)
    },

    mounted() {
        console.log('Projector mounted~~~!')
        let self = this

        self.$nextTick(() => {
            const janusServerUrl = config.readSettings('janusServerUrl')

            if (!janusServerUrl) {
                window.alert('请先设置屏幕共享服务地址')
                self.$router.push({
                    path: 'config/from/projector'
                })
            }
        })
    },

    destroyed() {
        let self = this
        ipc.removeListener('confirm-select-screen', self.onScreenSelected)
        if (self.checkNetWorkIntervalHandler) {
            clearInterval(self.checkNetWorkIntervalHandler)
        }
    },

    methods: {
        onScreenSelected(event, arg) {
            let self = this
            window.sourceId = arg

            if (window.sourceId) {
                self.initJanus()
            } else {
                remote.getCurrentWebContents().send('error-msg', '获取屏幕共享源失败')
            }

        },

        watchProjecting(n, o) {
            if (n) {
                this.initJanus()
            }
        },
        validateRoomId(id) {
            const self = this
            if (id && !/^[0-9]{5}$/.test(id)) {
                remote.getCurrentWebContents().send('error-msg', '请设置屏幕ID为5位数字')
                return false
            } else {
                return true
            }
        },
        routeChange() {
            let query = this.$route.query
            console.log(query)
            if (query.screen) {
                this.roomId = query.screen
                this.startBtnClicked()
            }
        },
        stopBtnClicked() {
            console.log('old stopBtnClicked')
            this.stopSharingScreen()
        },

        stopSharingScreen() {
            console.debug('**************** stop Sharing Screen!!!')
            let self = this
            if (self.janus) {
                self.destroyRoom(self.roomId).then((result) => {
                    self.isSharing = false
                    console.debug('enable start button')
                    self.startBtnDisabled = false
                    self.startButtonText = '开始'
                    if (self.janus) {
                        self.janus.destroy()
                        self.janus = undefined
                    }
                    console.log('stop sharing success~~~!!!')
                    if (window.localstream && window.localstream.getTracks().length > 0) {
                        window.localstream.getTracks()[0].stop()
                    }
                }).catch((error) => {
                    console.log('stop sharing error: ' + error)
                    self.isSharing = false
                    console.debug('enable start button')
                    self.startBtnDisabled = false
                    self.startButtonText = '开始'
                    if (self.janus) {
                        self.janus.destroy()
                        self.janus = undefined
                    }
                    if (window.localstream && window.localstream.getTracks().length > 0) {
                        window.localstream.getTracks()[0].stop()
                    }
                })
            }
            if (!this.isAgora) {
                this.$emit('cancel', {
                    isJanus: true
                })
            }
        },

        startBtnClicked() {
            let self = this
            self.myPurpose = 'i_wanna_share_my_screen'
            if (self.validateRoomId(self.roomId)) {
                if (self.isPrivateMode) {
                    ipc.send('open-select-screen-window')
                } else {
                    self.initVideoStreams().then((result) => {
                        if (result && result.length > 0) {
                            window.capureSource = result[0]
                            self.initJanus()
                        } else {
                            remote.getCurrentWebContents().send('error-msg', '获取屏幕共享源失败')
                        }
                    }).catch((error) => {
                        console.log(error)
                        remote.getCurrentWebContents().send('error-msg', '获取屏幕共享源失败')
                    })
                }
            }
        },

        initVideoStreams() {
            let self = this
            return new Promise((resolve, reject) => {
                desktopCapturer.getSources({
                    types: [self.captureSourceType]
                }, (error, sources) => {
                    if (error) {
                        reject(new Error('获取屏幕共享源失败'))
                    }
                    resolve(sources)
                })
            })
        },

        initJanus() {
            var self = this
            const janusServerUrl = config.readSettings('janusServerUrl')

            if (!janusServerUrl) {
                window.alert('请先设置屏幕共享服务地址')
                self.$router.push({
                    path: 'config/from/projector'
                })

                return
            }

            self.Janus.init({
                debug: 'none',
                callback() {
                    if (!self.Janus.isWebrtcSupported()) {
                        console.log('No WebRTC support... ')
                        return
                    }
                    // 开始创建janus对象
                    console.debug('disable start button')
                    self.startBtnDisabled = true
                    self.startButtonText = '连接服务器中,请稍候......'
                    self.createJanusObject('https://' + janusServerUrl + ':8089/janus')
                }
            })
        },

        createJanusObject(url) {
            let self = this
            self.janus = new self.Janus({
                server: url,
                success: () => {
                    console.log('create janus object success')
                    self.janus.attach({
                        plugin: 'janus.plugin.videoroom',
                        success: (pluginHandle) => {
                            console.log('####################### attache video room plugin success #######################')
                            self.videoRoomPlugin = pluginHandle
                            if (self.roomId && self.roomId.length > 0) {
                                self.readyToShareScreen()
                            }
                            console.log('Plugin attached! (' + self.videoRoomPlugin.getPlugin() + ', id=' + self.videoRoomPlugin.getId() + ')')
                        },
                        error: (error) => {
                            console.log('####################### attache video room plugin error #######################')
                            console.error('  -- Error attaching plugin...', error)
                            console.log('Error attaching plugin... ' + error)
                            self.stopSharingScreen()
                            remote.getCurrentWebContents().send('error-msg', '初始化视频房间失败')
                        },
                        webrtcState: (on) => {
                            console.log('####################### webrtc state #######################')
                            console.log('Janus says our WebRTC PeerConnection is ' + (on ? 'up' : 'down') + ' now')
                            console.log('Your screen sharing session just started: pass the <b>' + self.roomId + '</b> session identifier to those who want to attend.')
                        },
                        onmessage: (msg, jsep) => {
                            console.log('####################### Janus message #######################')
                            console.log(' ::: Got a message (publisher) :::')
                            console.debug(msg)
                            var event = msg['videoroom']
                            if (event !== undefined && event !== null) {
                                if (event === 'joined') {
                                    // 成功加入房间
                                    const myid = msg['id']
                                    console.log('Successfully joined room ' + msg['room'] + ' with ID ' + myid)
                                    if (self.role === 'publisher') {
                                        // This is our session, publish our stream
                                        console.debug('Negotiating WebRTC stream for our screen (capture ' + self.captureSourceType + ')')
                                        self.shareScreen().then(() => {
                                            console.log('success shared screen')
                                        })
                                    } else {
                                        // We're just watching a session, any feed to attach to?
                                        if (msg['publishers'] !== undefined && msg['publishers'] !== null) {
                                            let list = msg['publishers']
                                            console.debug('Got a list of available publishers/feeds:')
                                            console.debug(list)
                                            for (const f in list) {
                                                const id = list[f]['id']
                                                const display = list[f]['display']
                                                console.debug('  >> [' + id + '] ' + display)
                                            }
                                        }
                                    }
                                } else if (event === 'event') {
                                    // Any feed to attach to?
                                    if (self.role === 'listener' && msg['publishers'] !== undefined && msg['publishers'] !== null) {
                                        let list = msg['publishers']
                                        console.debug('Got a list of available publishers/feeds:')
                                        console.debug(list)
                                        for (const f in list) {
                                            const id = list[f]['id']
                                            const display = list[f]['display']
                                            console.debug('  >> [' + id + '] ' + display)
                                        }
                                    } else if (msg['leaving'] !== undefined && msg['leaving'] !== null) {
                                        // One of the publishers has gone away?
                                        var leaving = msg['leaving']
                                        console.log('Publisher left: ' + leaving)
                                        if (self.role === 'listener' && msg['leaving'] === 'source') {
                                            console.log('The screen sharing session is over, the publisher left', () => {
                                                self.stopSharingScreen()
                                            })
                                        }
                                    } else if (msg['error'] !== undefined && msg['error'] !== null) {
                                        console.debug(msg)
                                        if (msg['error_code'] === 427) { // 427 means JANUS_VIDEOROOM_ERROR_ROOM_EXISTS
                                            if (self.roomId) {
                                                self.destroyRoom(self.roomId).then(() => {
                                                    return self.createRoom(self.roomId)
                                                }).then(() => {
                                                    self.joinRoom(self.roomId)
                                                })
                                            }
                                        } else if (msg['error_code'] === 426) { // 426 means JANUS_VIDEOROOM_ERROR_NO_SUCH_ROOM
                                            self.createRoom(self.roomId).then(() => {
                                                self.joinRoom(self.roomId)
                                            })
                                        } else if (msg['error_code'] === 425) { // 425 means JANUS_VIDEOROOM_ERROR_ALREADY_JOINED
                                            // Already in as a publisher on this handle
                                            self.shareScreen()
                                        } else {
                                            console.debug(`error message: ${JSON.stringify(msg)}`)
                                            self.stopSharingScreen()
                                            remote.getCurrentWebContents().send('error-msg', '未知错误，请重新分享屏幕')
                                        }
                                    }
                                }
                            }
                            if (jsep !== undefined && jsep !== null) {
                                console.debug('Handling SDP as well...')
                                console.debug(jsep)
                                self.videoRoomPlugin.handleRemoteJsep({
                                    jsep: jsep
                                })
                            }
                        },
                        onlocalstream: (stream) => {
                            window.localstream = stream
                            console.log('####################### localstream #######################')
                            console.debug(' ::: Got a local stream :::')
                            console.debug(JSON.stringify(stream))
                            self.isSharing = true
                            self.myPurpose = 'i_wanna_stop_share_my_screen'
                            window.attachMediaStream(document.getElementById('screenvideo'), stream)
                        },
                        oncleanup: () => {
                            console.log('####################### clean up #######################')
                            console.log(' ::: Got a cleanup notification :::')
                            if (self.myPurpose !== 'i_wanna_share_my_screen') {
                                self.stopSharingScreen()
                            }
                        }
                    })
                },
                error: (error) => {
                    console.log('####################### on error #######################')
                    console.error(error)
                    remote.getCurrentWebContents().send('error-msg', '服务器连接失败')
                    self.stopSharingScreen()
                },
                destroyed: () => {
                    console.log('####################### destroyed #######################')
                    if (self.myPurpose !== 'i_wanna_share_my_screen') {
                        self.stopSharingScreen()
                    }
                }
            })
        },

        checkRoomExist(roomId) {
            console.log('####################### check if room exist #######################')
            const self = this
            return new Promise((resolve, reject) => {
                var request = {
                    'room': parseInt(roomId),
                    'request': 'exists'
                }
                self.videoRoomPlugin.send({
                    'message': request,
                    success: (result) => {
                        resolve(result.exists)
                    },
                    error: (XMLHttpRequest, textStatus, errorThrown) => {
                        reject(textStatus + ': ' + errorThrown)
                    }
                })
            })
        },

        destroyRoom(id) {
            console.log('####################### destroy room #######################')
            const self = this
            return new Promise((resolve, reject) => {
                var destroy = {
                    'room': parseInt(id),
                    'request': 'destroy'
                }
                self.videoRoomPlugin.send({
                    'message': destroy,
                    success: (result) => {
                        resolve(result)
                    },
                    error: (XMLHttpRequest, textStatus, errorThrown) => {
                        reject(textStatus + ': ' + errorThrown)
                    }
                })
            })
        },

        createRoom(id) {
            console.log('####################### create room #######################')
            const self = this
            return new Promise((resolve, reject) => {
                var create = {
                    'room': parseInt(id),
                    'request': 'create',
                    'description': 'publisher',
                    'bitrate': 0,
                    'publishers': 1
                }
                self.videoRoomPlugin.send({
                    'message': create,
                    success: (result) => {
                        resolve(result)
                    },
                    error: (XMLHttpRequest, textStatus, errorThrown) => {
                        reject(textStatus + ': ' + errorThrown)
                    }
                })
            })
        },

        joinRoom(roomId) {
            console.log(`####################### join room ${roomId} #######################`)
            const self = this
            var join = {
                'request': 'join',
                'room': parseInt(roomId),
                'ptype': 'publisher',
                'display': `Room(${roomId})`
            }
            self.videoRoomPlugin.send({
                'message': join
            })
        },

        readyToShareScreen() {
            let self = this
            self.checkRoomExist(self.roomId).then((exists) => {
                console.log(`room ${self.roomId} is ${exists ? '' : 'not'} exists`)
                if (exists) {
                    // 房间存在
                    return self.destroyRoom(self.roomId)
                } else {
                    return Promise.resolve()
                }
            }).then(() => {
                self.createRoom(parseInt(self.roomId)).then((result) => {
                    var event = result['videoroom']
                    console.debug('Event: ' + JSON.stringify(result))
                    if (event !== undefined && event !== null) {
                        // Our own screen sharing session has been created, join it
                        console.log('Screen sharing session created: ' + self.roomId)
                        // 建房成功后加入房间
                        self.joinRoom(self.roomId)
                    }
                }, (error) => {
                    console.log(error)
                })
            })
        },

        shareScreen() {
            const self = this
            return new Promise((resolve, reject) => {
                console.log('####################### share screen #######################')
                var id = null

                if (self.selectWindowId) {
                    id = self.selectWindowId
                } else {
                    if (self.isPrivateMode) {
                        id = window.sourceId
                    } else {
                        id = window.capureSource.id
                    }
                }
                console.log(`window id is ${id}`)
                navigator.webkitGetUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: id,
                            minWidth: 1920,
                            maxWidth: 1920,
                            minHeight: 1080,
                            maxHeight: 1080,
                            minFrameRate: 60,
                            maxFrameRate: 60
                        }
                    }
                }, (stream) => {
                    window.stream = stream
                    self.videoRoomPlugin.createOffer({
                        stream: window.stream,
                        media: {
                            video: self.captureSourceType,
                            audio: false,
                            videoRecv: false
                        },
                        // Screen sharing doesn't work with audio, and Publishers are sendonly
                        success: (jsep) => {
                            window.jsep = jsep
                            console.debug('Got publisher SDP!')
                            console.debug(jsep)
                            var publish = {
                                'room': parseInt(self.roomId),
                                'request': 'configure',
                                'bitrate': 1024000,
                                'audio': false,
                                'video': true
                            }
                            self.videoRoomPlugin.send({
                                'message': publish,
                                'jsep': jsep
                            })
                        },
                        error: (error) => {
                            // isHandlingPublish = false
                            console.log('WebRTC error... ' + JSON.stringify(error))
                        }
                    })
                    resolve()
                }, (e) => {
                    reject(new Error(`Can't get User media Id:${id}`))
                    console.log(e)
                })
            })
        },

        checkNetWork() {
            let self = this
            const janusServerUrl = config.readSettings('janusServerUrl')
            const janusServerPingUrl = 'https://' + janusServerUrl + ':8089/janus'

            console.log('check net work......')
            let pingOpts = {
                uri: janusServerPingUrl,
                method: 'POST',
                json: true,
                timeout: 5000,
                body: {
                    janus: 'ping',
                    transaction: uuid.v4().toString()
                },
                transform: (body, response, resolveWithFullResponse) => {
                    if (response.statusCode === 200) {
                        return response.body
                    } else {
                        throw new Error('getPrinters failed, status code: ' + response.statusCode)
                    }
                }
            }

            rp(pingOpts).then((pong) => {
                self.isNetWorkOffline = false
                self.startButtonText = '开始'
            }).catch(() => {
                // console.log(error)
                console.log(`check net work failed`)
                self.stopSharingScreen()
                self.isNetWorkOffline = true
                self.startButtonText = '网络中断，请检查网络'
            })
        }
    }
}
