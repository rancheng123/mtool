/**
 * @file agorawebrtc.js
 * @author shijh
 *
 * 声网sdk功能封装
 */
import AgoraRTC from '../../../../helpers/agora/agorartcsdk'
import VideoStream, { VideoStreamOpt } from './videostream'
// import Layout from './layout'
const electron = require('electron')
const remote = electron.remote
const logger = remote.require('./app/logger')
import { AgoraWebRTCD } from '../../../../interfaces/video.interface'
import store from '../../../../stores'

export type ClientStatus = 'meeting' | 'sharing' | undefined

export interface Devices {
    micphone: boolean,
    cemara: boolean,
    hasDetect: boolean
}

export type AgoraEvent = {
    type: string,
    status: boolean,
    error?: any,
    data?: any,
    notChange?: boolean
}

// import SignClient from './singClient.js'
export default class AgoraWebRTC {
    streams: Array<VideoStream> = []
    streamsMap = {}
    canExchange: boolean = false
    handles = {}
    signClient = null
    status: ClientStatus = 'meeting'
    switchHandler: (event: any) => void
    globalHandle: (event: AgoraEvent) => void = function (event: AgoraEvent) { }
    devices: Devices = { micphone: false, cemara: false, hasDetect: false }
    config: AgoraWebRTCD.SDKConfig
    client: AgoraWebRTCD.Client
    appId: string | number
    localStream: VideoStream
    localStreamId: string | number

    constructor(config) {
        this.switchHandler = config.switchHandler
        this.config = config
        this.config.chennelMode = this.config.chennelMode ? this.config.chennelMode : 'communication'
        // mode 必须这样设置否则android端无法得到视频流
        const client: any = AgoraRTC.createClient({
            mode: 'live'
        })
        client.setClientRole("host", function() {
            console.log("setHost success");
        }, function(e) {
            console.log("setHost failed", e);
        })
        this.client = client
        this.signClient = config.signClient
        this.appId = config.appId
        return this
    }
    /**
     * 创建流id
     */
    static createStreamId(): number {
        let d = new Date()
        return Number(`${d.getHours()}${d.getMinutes()}${d.getMilliseconds()}${Math.round(Math.random() * 10)}`)
    }
    /**
     * 加入通道
     * @param {Function} callback
     */
    joinChannel(callback?: (err?: any) => void): Promise<any> {
        const self = this
        const client = this.client
        const config = this.config
        this.windowResizeHandle()
        return new Promise((resolve, reject) => {
            client.init(config.appId, () => {
                self.globalHandle({
                    type: 'client_init',
                    status: true
                })
                resolve()
            }, (err) => {
                self.globalHandle({
                    type: 'client_init',
                    error: err,
                    status: false
                })
                reject()
            })
            if (!config.disableSubcribe) {
                self.subscribeStreamEvents()
            }
        })
    }
    // client 属性的设置只能在client.init
    setClientConfig(): AgoraWebRTC {
        const self = this
        const conf = this.config
        const client = this.client
        return this
    }
    async joinRoom(key, roomName, uid, callback) {
        const self = this
        const client = this.client
        const conf = this.config

        logger.info(`agorawebrtc.js joinRoom(${roomName},${uid})`)
        const result = await self.createLocalStream(uid)
        if (result.status) {
            client.join(key, roomName, uid, (nuid) => {
                self.signClient.join(roomName)
                self.globalHandle({
                    type: 'join_room',
                    status: true,
                    data: {
                        room: roomName,
                        uid: uid
                    }
                })
                client.enableDualStream(() => {
                    client.setLowStreamParameter({width: 480, height: 360, framerate: 15, bitrate: 320})
                    logger.info('enableDualStream low success!')
                }, (err) => {
                    logger.info(`enableDualStream low Failed, error: ${err.msg}`)
                })
                if (this.localStream) {
                    client.publish(this.localStream.stream, (error) => {
                        self.globalHandle({
                            type: 'publish_local_stream',
                            status: false,
                            error: error
                        })
                    })
                    store.commit('stream/addStream', {stream: this.localStream.stream, options: {
                        isLocal: true,
                        isMajor: true
                    }})
                }
                if (typeof callback === 'function') {
                    callback()
                }
            }, (err) => {
                if (typeof callback === 'function') {
                    callback(err)
                }
                self.globalHandle({
                    type: 'join_room',
                    status: false,
                    error: err.msg || {}
                })
            })
        } else if (!result.status && result.error && result.error.msg === 'CONSTRAINT_NOT_SATISFIED') {
            conf.videoProfile = '480P'
            this.joinRoom(key, roomName, uid, callback)
        }
        return this
    }

    async createLocalStream(uid: number | string): Promise<any> {
        return new Promise((resovle, reject) => {
            const self = this
            const client = this.client
            this.localStreamId = uid
            let localConfig = this.config.localStreamConfig
            let screen = false
            if (localConfig) {
                screen = !!localConfig.screen
            }
            logger.info('local stream init', uid)
            this.status = screen ? 'sharing' : 'meeting'
            this.createMediaStream(screen).then((stream) => {
                this.globalHandle({
                    type: 'init_local_stream',
                    status: true
                })
                this.localStream = self.createVideoStream(stream, {
                    isLocal: true,
                    isMajor: true
                })
                resovle({
                    status: true
                })
            }).catch(error => {
                self.globalHandle({
                    type: 'init_local_stream_fail',
                    status: false,
                    error: error
                })
                resovle({
                    status: false,
                    error: error
                })
            })
        })
    }
    /**
     * 判断当前流是否已经存在了
     */
    steamIdIsExit(stream: AgoraWebRTCD.Stream): void {
        let isExit = false
        for (let i = 0; i < this.streams.length; i++) {
            if (Number(this.streams[i].streamId) === Number(stream.getId())) {
                this.streams.splice(i, 1)
                break
            }
        }
    }
    /**
     * 创建视屏流
     * @param stream 流
     * @param option 创建流配置
     */
    createVideoStream(stream: AgoraWebRTCD.Stream, option: VideoStreamOpt = {}): VideoStream {
        const config = this.config
        let self = this
        let vs = stream
        let opt = option
        let video = new VideoStream(vs, opt)
        logger.debug(`createVideoStream panel.role`)
        return video
    }

    /**
     * 订阅流事件
     */
    subscribeStreamEvents(): void {
        const self = this
        const client = this.client
        // 新增流
        client.on('stream-added', (evt) => {
            let stream = evt.stream
            // const streams = store.getters['stream/streams'];
            // console.log(streams[stream.getId()], this.localStream, '======================')
            // console.log(streams[stream.getId()], stream, '===========================')
            // // if (streams[stream.getId()]) {
            //     if (streams[stream.getId()].stream.local) {
            //         // streams[stream.getId()].stream.close()
            //         if (`${streams[stream.getId()].streamId}` !== `${stream.getId()}`) {
            //             stream.close()
            //             return
            //         }
            //     } else {
            //         streams[stream.getId()].stream.close()
            //     }
            // }
            logger.info(`agora:event stream-add ${stream.getId()}`)
            client.subscribe(stream, (err) => {
                self.globalHandle({
                    type: 'add_stream',
                    status: false,
                    error: err,
                    data: stream.getId()
                })
            })
        })
        // 流已经发布
        client.on('stream-published', (evt) => {
            logger.info(`agora:event stream-published`)
        })
        // 通知应用程序对方用户已离开频道，即对方调用了 client.leave()
        client.on('peer-leave', (evt) => {
            let streamId = evt.uid.toString()
            logger.info(`agora:event peer-leave ${streamId}`)
            // self.removeVideoStream(streamId)
            store.commit('stream/removeStream', streamId)
            self.globalHandle({
                type: 'peer-leave',
                status: true,
                data: streamId
            })
        })
        // 已打开视屏流
        client.on('peer-mute-video', (event) => {
            let message = event.msg
            let streamId = message.uid
            logger.info(`agora:event peer-mute-video message:${message} streamId:${streamId}`)
            let stream = self.getVideoStreamById(streamId)
            if (stream) {
                self.toggleVideoFrame(streamId, message.muted)
                self.globalHandle({
                    type: 'stream_video',
                    status: true,
                    data: {
                        streamId: streamId,
                        isMuted: message.muted
                    }
                })
            } else {
                logger.info('create video ' + streamId)
            }
        })
        // 应用程序已接收远程音视频流
        client.on('stream-subscribed', (evt) => {
            const stream = evt.stream
            logger.info(`agora:event stream-subscribed: ${stream.getId()}`)
            // const video = self.createVideoStream(stream)
            // store.commit('meeting/addStream', video)
            store.commit('stream/addStream', { stream })
            self.globalHandle({
                type: 'subscribe_stream',
                status: true,
                data: stream.getId()
            })
        })
        // 应用程序已删除远程音视频流，即对方调用了 unpublish stream
        client.on('stream-removed', (evt) => {
            var stream = evt.stream
            // const streams = store.getters['stream/streams'];
            // if (streams[stream.getId()] && `${stream.getId()}` === `${this.localStream.streamId}`) {
            //     return
            // }
            logger.info(`agora:event stream-removed: ${evt.stream.getId()}`)
            store.commit('stream/removeStream', stream.getId())
            self.globalHandle({
                type: 'stream_removed',
                status: true,
                data: stream
            })
        })
        client.on('error', (err) => {
            logger.info(`agora:event error: ${err.msg}`)
            self.globalHandle({
                type: 'error',
                status: false,
                error: err.msg
            })
        })
    }
    /**
     * 窗口大小变化回调
     */
    windowResizeHandle(): AgoraWebRTC {
        const self = this
        // window.addEventListener("click", () => {
        //     logger.info(`windowResizeHandle`)
        //     self.autoSize()
        //     //self.switchLayout()
        //     //
        //     // this.streams.forEach(s => {
        //     //     s.autoFixSize();
        //     // });
        // })
        return this
    }

    removeVideoStream(stream): AgoraWebRTC {
        try {
            const self = this
            let videos = []
            let removedVideo
            let streamId
            if (typeof stream !== 'string' && typeof stream.getId === 'function') {
                streamId = stream.getId()
            } else {
                streamId = stream
            }
            videos = this.streams.filter((s) => {
                if (s.streamId === streamId) {
                    removedVideo = s
                }
                return s.streamId !== streamId
            })
            this.streams = videos
            if (removedVideo) {
                this.streamsMap[removedVideo.streamId] = null
            }
        } catch (e) {
            logger.error(`removeVideoStream fail e:${e}`)
        }

        return this
    }
    /**
     * 通过流id获取流
     * @param streamId 流id
     */
    getVideoStreamById(streamId: number): AgoraWebRTCD.Stream {
        let stream
        this.streams.forEach((s) => {
            if (s.streamId === streamId) {
                stream = s
            }
        })
        return stream
    }
    /**
     * 处理视屏流显示关闭按钮状态
     * @param streamId 流id
     * @param isMuted 是否打开
     */
    toggleVideoFrame(streamId: number, isMuted: boolean): void {
        let stream = this.getVideoStreamById(streamId)
        if (stream) {
            // stream.toggleFilter(isMuted)
        }
    }
    /**
     * 离开当前房间
     * @param onOk 成功回调
     * @param onFail 失败回调
     */
    leave(onOk?: () => void, onFail?: (err?: any) => void): void {
        const self = this
        if (this.localStream) {
            let stream = this.localStream.getStream()
            this.localStream.stop()
            this.client.unpublish(stream, (err) => {
                console.log('Unpublish failed with error: ', err)
            })
            this.localStream.close()
        }
        self.signClient.leave()
        this.client.leave(() => {
            self.globalHandle({
                type: 'leave',
                status: true
            })
            if (typeof onOk === 'function') {
                onOk()
            }
        }, (err) => {
            self.globalHandle({
                type: 'leave',
                status: false,
                error: err
            })
            if (typeof onFail === 'function') {
                onFail(err)
            }
        })
    }
    /**
     * 切换音频流转态，关闭或者开起
     * @param flag 音频流状态
     */
    toggleAudio(flag?: boolean): AgoraWebRTC {
        const self = this
        if (this.localStream) {
            store.commit('stream/setAudioStatus', {streamId: this.localStream.streamId, flag})
            const local: any = store.getters['stream/localStream']
            self.globalHandle({
                type: 'local-stream-audio',
                status: true,
                data: { muted: !local.status.audio }
            })
        }
        return this
    }
    /**
     * 切换视频流转态，关闭或者开起
     * @param flag 音频流状态
     */
    toggleVideo(flag?: boolean): AgoraWebRTC {
        const self = this
        if (this.localStream) {
            store.commit('stream/setVideoStatus', {streamId: this.localStream.streamId, flag})
            const local: any = store.getters['stream/localStream']
            self.globalHandle({
                type: 'local-stream-video',
                status: true,
                data: { muted: !local.status.video }
            })
        }
        return this
    }
    /**
     * 分享时关闭打开视屏
     */
    toggleShareVideo(flag: boolean, notChange: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            const self = this
            if (this.localStream) {
                console.log(flag, 'toggleShareVideo')
                store.commit('stream/setVideoStatus', { streamId: this.localStream.streamId, flag })
                const local: any = store.getters['stream/localStream']
                self.globalHandle({
                    type: 'local-stream-video',
                    status: true,
                    data: { muted: !local.status.video },
                    notChange
                })
                resolve({ muted: !local.status.video })
            }
        })
    }
    /**
     *
     * @param eventType added leave  global
     * @param callback
     */
    on(eventType, callback) {
        let handles = this.handles
        if (eventType === 'global') {
            this.globalHandle = callback
        } else {
            if (typeof callback === 'function') {
                handles[eventType] = callback
            }
        }
    }
    /**
     * 检查本机设备
     */
    checkInputDevices(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.devices.hasDetect) {
                AgoraRTC.getDevices((devices) => {
                    let micphone = false
                    let cemara = false
                    devices.forEach(d => {
                        switch (d.kind) {
                            case 'audioinput':
                                micphone = true
                                break
                            case 'videoinput':
                                cemara = true
                                break
                        }
                    })
                    this.devices.cemara = cemara
                    this.devices.micphone = micphone
                    resolve()
                })
                this.devices.hasDetect = true
            } else {
                resolve()
            }
        })
    }
    /**
     * 该做法只在1.13webSDK上生效，其它版本sdk需要自行研究，这个是非官方做法，后继如更SDK需保证该方式起作用
     * @param screen 是否是共享流，
     *
     */
    createMediaStream(screen): Promise<any> {
        const streamid = this.localStreamId
        return new Promise((resolve, reject) => {
            this.checkInputDevices().then(() => {
                let devices = this.devices
                let opt = {
                    streamID: streamid,
                    audio: !screen,
                    video: !screen,
                    screen: screen
                }
                let stream = AgoraRTC.createStream(opt)
                // 如需在共享时让麦收音，需在localStreamConfig.audio设置成true
                let localConfig = this.config.localStreamConfig
                let audio = localConfig ? localConfig.audio : true
                if (!devices.micphone) {
                    opt.audio = false
                    audio = false
                }
                if (!devices.cemara) {
                    opt.video = false
                }
                let profile = this.config.videoProfile

                // stream.setVideoProfile(profile)
                if (screen) {
                    stream.setScreenProfile('1080p_1')
                } else {
                    // TODO: 从服务端拉取配置
                    stream.setVideoProfile(profile)
                }
                stream.init(() => {
                    if (screen) {
                        if (audio) {
                            this.getAudioTrack().then(audio => {
                                // 处理因默认使用共享流时没有音轨的问题，需在AgoraRTC.createStream()时将audio设置成false
                                // 接着手动增音轨然后再joinRoom前把audio设置成true，最后上传publish
                                // 该做法只有1.13的SDK顺起作用，如后继更新SDK需要测试
                                stream.audio = true
                                opt.audio = true
                                stream.stream.addTrack(audio)
                                stream.enableAudio()
                                resolve(stream)
                            }).catch(() => {
                                resolve(stream)
                            })
                        } else {
                            resolve(stream)
                        }
                    } else {
                        resolve(stream)
                    }
                }, (err) => {
                    console.log(err)
                    reject(err)
                })
            })
        })
    }
    getAudioTrack(): Promise<any> {
        return new Promise((resovle, reject) => {
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            }).then((stream) => {
                resovle(stream.getAudioTracks()[0])
            }).catch(error => {
                reject(error)
            })
        })
    }
    /**
     * 切换流
     * @param status 流状态
     */
    switchMediaStream(status?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            logger.info(`~~~ current streamID: ${this.localStream.streamId}`)
            if (this.localStream) {
                this.client.unpublish(this.localStream.stream, (err) => {
                    logger.error(`Error: unpublish error for ${this.localStream.streamId} ${err}`)
                })
                // this.client.setClientRole('host')
                // this.localStream.stream.close()
                store.commit('stream/close', this.localStream.streamId)
            }
            this.createMediaStream(status === 'sharing').then(stream => {
                this.localStream.stream = stream
                this.localStream.userStatus = status
                store.commit('stream/updateStreamById', { stream, streamId: this.localStream.streamId })
                this.client.publish(stream, (err) => {
                    logger.error(`Error: publish error for ${this.localStream.streamId} ${err}`)
                    if (err === 'STREAM_ALREADY_PUBLISHED') {
                        resolve(stream)
                    }
                    reject(err)
                })
                resolve(stream)
            })
        })
    }
    /**
     * 开始分享屏幕
     */
    startShareScreen(): Promise<any> {
        let self = this
        return new Promise((resolve, reject) => {
            self.switchMediaStream('sharing').then((stream) => {
                self.status = 'sharing'
                self.globalHandle({
                    type: 'start-share-screen',
                    status: true
                })
                resolve(stream)
            }).catch((err) => {
                self.globalHandle({
                    type: 'start-share-screen',
                    status: false
                })
                reject(err)
            })
        })
    }
    /**
     * 停止分享屏幕
     */
    stopShareScreen() {
        let self = this
        return new Promise((resolve, reject) => {
            self.switchMediaStream('meeting').then(() => {
                logger.info('~~~~ switch media stream to meeting...')
                self.status = 'meeting'
                self.globalHandle({
                    type: 'stop-share-screen',
                    status: true
                })
                resolve()
            }).catch(err => {
                logger.info(`~~~~ Error: switch media stream to meeting failed ${err}`)
                self.globalHandle({
                    type: 'stop-share-screen',
                    status: false
                })
                reject(err)
            })
        })
    }
}
