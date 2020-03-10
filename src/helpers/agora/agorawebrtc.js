import AgoraRTC from './agorartcsdk';
import VideoStream from "./videostream";
import Layout from './layout';
const electron = require('electron')
const remote = electron.remote
const logger = remote.require('./app/logger')
// import SignClient from './singClient.js'
export class AgoraWebRTC {
    constructor(config) {
        this.streams = [];
        this.streamsMap = {};
        this.canExchange = false;
        this.handles = {};
        this.signClient = null
        this.status = 'meeting';
        this.switchHandler = config.switchHandler
        this.devices = {
            micphone: false,
            cemara: false,
            hasDetect: false
        };

        this.globalHandle = function(event) {};
        this.config = config;
        this.config.chennelMode = this.config.chennelMode ? this.config.chennelMode : 'communication';
        this.dom = config.dom;
        // mode 必须这样设置否则android端无法得到视频流
        this.client = AgoraRTC.createClient({
            mode: 'live'
        });
        this.client.setClientRole("host", function() {
            console.log("setHost success");
        }, function(e) {
            console.log("setHost failed", e);
        })
        this.signClient = config.signClient
        this.appId = config.appId

        this.layoutController = new Layout({
            container: config.dom,
            mode: 'normal',
            switchHandler: this.switchHandler
        });
        return this;
    }
    static createStreamId() {
        let d = new Date();
        return Number(`${d.getHours()}${d.getMinutes()}${d.getMilliseconds()}${Math.round(Math.random() * 10)}`);
    }
    joinChannel(callback) {
        const self = this;
        const client = this.client;
        const config = this.config;
        this.windowResizeHandle();
        return new Promise((resolve, reject) => {
            client.init(config.appId, () => {
                self.globalHandle({
                    type: "client_init",
                    status: true
                });
                resolve();
            }, (err) => {
                self.globalHandle({
                    type: "client_init",
                    error: err,
                    status: false
                });
                reject();
            });
            if (!config.disableSubcribe) {
                self.subscribeStreamEvents();
            }
        });
    }
    // client 属性的设置只能在client.init
    setClientConfig() {
        const self = this;
        const conf = this.config;
        const client = this.client;
        return this;
    }
    joinRoom(key, roomName, uid, callback) {
        const self = this;
        const client = this.client;
        const conf = this.config;



        logger.info(`agorawebrtc.js joinRoom(${roomName},${uid})`)
        self.createLocalStream(uid).then((result) => {
            if (result.status) {
                client.join(key, roomName, uid, (nuid) => {
                    self.signClient.join(roomName);
                    self.globalHandle({
                        type: "join_room",
                        status: true,
                        data: {
                            room: roomName,
                            uid: uid
                        }
                    });
                    if (this.localStream) {
                        client.publish(this.localStream.stream, (error) => {
                            self.globalHandle({
                                type: "publish_local_stream",
                                status: false,
                                error: error
                            });
                        });
                    }
                    if (typeof callback === 'function') {
                        callback();
                    }
                }, (err) => {
                    if (typeof callback === 'function') {
                        callback(err);
                    }
                    self.globalHandle({
                        type: "join_room",
                        status: false,
                        error: err.msg || {}
                    });
                });
            } else if (!result.status && result.error && result.error.msg === 'CONSTRAINT_NOT_SATISFIED') {
                conf.videoProfile = '480P'
                this.joinRoom(key, roomName, uid, callback)
            }
        });
        return this;
    }

    createLocalStream(uid) {
        return new Promise((resovle, reject) => {
            const self = this;
            const client = this.client;
            this.localStreamId = uid;
            let localConfig = this.config.localStreamConfig;
            let screen = false;
            if (localConfig) {
                screen = !!localConfig.screen;
            }
            logger.info('local stream init', uid);
            this.status = screen ? 'sharing' : 'meeting';
            this.createMediaStream(screen).then((stream) => {
                this.globalHandle({
                    type: "init_local_stream",
                    status: true
                });
                this.localStream = self.createVideoStream(stream, {
                    isLocal: true,
                    isMajor: true
                });
                resovle({
                    status: true
                });
            }).catch(error => {
                self.globalHandle({
                    type: "init_local_stream_fail",
                    status: false,
                    error: error
                });
                resovle({
                    status: false,
                    error: error
                });
            });
        });
    }
    /**
     * 判断当前流是否已经存在了
     */
    steamIdIsExit(stream) {
        let isExit = false
        for (let i = 0; i < this.streams.length; i++) {
            if (Number(this.streams[i].streamId) === Number(stream.getId())) {
                this.streams.splice(i, 1)
                break
            }
        }
    }
    createVideoStream(stream, option) {
        const config = this.config;
        let self = this
        let vs = stream;
        let opt = option ? option : {};
        opt.dbclick = this.exchangeVideo();
        let panel = this.layoutController.addPanel({
            isLocal: !!opt.isLocal,
            isMajor: !!opt.isMajor,
            id: vs.getId(),
            visable: opt.isLocal ? true : false
        });
        let video = new VideoStream(vs, panel.vidoeWrap, opt);
        panel.setStream(video);
        logger.debug(`createVideoStream panel.role ${panel.role}`)


        this.streams.push(video);
        const panels = this.layoutController.panels;
        panels.forEach(p => {
            p.streams = self.streams
        })

        this.streamsMap[video.streamId] = video;
        //视频发布前需播放

        video.show();
        let streamLen = this.streams.length;
        return video;
    }
    subscribeStreamEvents() {
        const self = this;
        const client = this.client;
        client.on('stream-added', (evt) => {
            let stream = evt.stream;
            logger.info(`agora:event stream-add ${stream.getId()}`)
            client.subscribe(stream, (err) => {
                self.globalHandle({
                    type: "add_stream",
                    status: false,
                    error: err,
                    data: stream.getId()
                });
            });
        });

        client.on('stream-published', (evt) => {
            logger.info(`agora:event stream-published`)

        });
        client.on('peer-leave', (evt) => {
            let streamId = evt.uid.toString();
            logger.info(`agora:event peer-leave ${streamId}`)
            self.removeVideoStream(streamId);
            self.globalHandle({
                type: "peer-leave",
                status: true,
                data: streamId
            });
            //updateRoomInfo();
        });
        client.on("peer-mute-video", (event) => {
            let message = event.msg;
            let streamId = message.uid;
            logger.info(`agora:event peer-mute-video message:${message} streamId:${streamId}`);
            let stream = self.getVideoStreamById(streamId);
            if (stream) {
                self.toggleVideoFrame(streamId, message.muted);
                self.globalHandle({
                    type: "stream_video",
                    status: true,
                    data: {
                        streamId: streamId,
                        isMuted: message.muted
                    }
                });
            } else {
                logger.info("create video " + streamId);
            }
        });
        client.on('stream-subscribed', (evt) => {
            var stream = evt.stream;
            logger.info("agora:event stream-subscribed: " + stream.getId());
            // logger.info(evt);
            // updateRoomInfo();
            self.createVideoStream(stream);
            self.globalHandle({
                type: "subscribe_stream",
                status: true,
                data: stream.getId()
            });
        });
        client.on("stream-removed", (evt) => {
            var stream = evt.stream;
            logger.info("agora:event stream-removed: " + evt.stream.getId());
            // self.removeVideoStream(stream);
            self.globalHandle({
                type: "stream_removed",
                status: true,
                data: stream
            });
        });
        client.on('error', (err) => {
            logger.info(`agora:event error: ${err.msg}`);
            self.globalHandle({
                type: "error",
                status: false,
                error: err.msg
            });
        });
    }
    windowResizeHandle() {

        const self = this;
        // window.addEventListener("click", () => {
        //     logger.info(`windowResizeHandle`)
        //     self.autoSize()
        //     //self.switchLayout()
        //     //
        //     // this.streams.forEach(s => {
        //     //     s.autoFixSize();
        //     // });
        // })
        return this;
    }

    removeVideoStream(stream) {
        try {
            const self = this;
            let videos = [];
            let removedVideo;
            let streamId;
            if (typeof stream !== 'string' && typeof stream.getId === 'function') {

                streamId = stream.getId();
            } else {
                streamId = stream;
            }
            videos = this.streams.filter((s) => {
                console.log(s.streamId, streamId);
                if (s.streamId == streamId) {
                    removedVideo = s;
                }
                return s.streamId != streamId;
            });
            this.streams = videos;
            let rp = this.layoutController.removePanelByOId(streamId);
            if (rp && rp.isMajor) {
                self.relayout();
            }
            if (removedVideo) {
                this.streamsMap[removedVideo.streamId] = null;
            }
            this.layoutController.removePanelByOId(streamId);
        } catch (e) {
            logger.error(`removeVideoStream fail e:${e}`)
        }

        return this;
    }
    getVideoStreamById(streamId) {
        let stream;
        this.streams.forEach((s) => {
            if (s.streamId === streamId) {
                stream = s;
            }
        });
        return stream;
    }
    toggleVideoFrame(streamId, isMuted) {
        let stream = this.getVideoStreamById(streamId);
        if (stream)
            stream.toggleFilter(isMuted);
    }
    leave(onOk, onFail) {
        const self = this;
        if (this.localStream) {
            let stream = this.localStream.getStream();
            this.localStream.stop();
            this.client.unpublish(stream, (err) => {
                console.log("Unpublish failed with error: ", err);
            });
            this.localStream.close();
        }
        self.signClient.leave()
        this.client.leave(() => {
            self.globalHandle({
                type: 'leave',
                status: true
            });
            if (typeof onOk === 'function') {
                onOk();
            }
        }, (err) => {
            self.globalHandle({
                type: 'leave',
                status: false,
                error: err
            });
            if (typeof onFail === 'function') {
                onFail(err);
            }
        });
    }
    toggleAudio(flag) {
        const self = this;
        if (this.localStream) {
            this.localStream.setAudioStatus(flag, (e) => {
                self.globalHandle({
                    type: 'local-stream-audio',
                    status: true,
                    data: e
                });
            });
        }
        return this;
    }
    toggleVideo(flag) {
        const self = this;
        if (this.localStream) {
            this.localStream.setVideoStatus(flag, (e) => {
                self.globalHandle({
                    type: 'local-stream-video',
                    status: true,
                    data: e
                });
            });
        }
        return this;
    }
    /**
     * 分享是关闭打开视屏
     */
    toggleShareVideo(flag, notChange = false) {
        return new Promise((resolve, reject) => {
            const self = this;
            if (this.localStream) {
                this.localStream.setVideoStatus(flag, (e) => {
                    self.globalHandle({
                        type: 'local-stream-video',
                        status: true,
                        data: e,
                        notChange,
                    });
                    resolve(e)
                });
            }
        })
    }
    /**
     *
     * @param eventType added leave  global
     * @param callback
     */
    on(eventType, callback) {
        let handles = this.handles;
        if (eventType === 'global') {
            this.globalHandle = callback;
        } else {
            if (typeof callback === "function") {
                handles[eventType] = callback;
            }
        }
    }
    relayout() {
        // this.stopAll()
        const panels = this.layoutController.panels;
        let nmajor;
        let omajor;
        panels.forEach(p => {
            if (!nmajor && !p.isLocal && !p.isMajor) {
                nmajor = p;
            }
            if (p.isMajor) {
                omajor = p;
            }
        });
        if (panels.length === 1) {
            nmajor = panels[0];
        }
        if (omajor && omajor.isUserDo || !nmajor) {
            return;
        }
        if (!omajor && nmajor) {
            this.layoutController.updateMajorById(nmajor.id);
            this.mapVideosToLayout();
        } else if (omajor && nmajor) {
            if (!omajor.isUserDo) {
                this.layoutController.updateMajorById(nmajor.id);
                this.mapVideosToLayout();
            }
        }
        return this;
    }
    exchangeVideo() {
        const self = this;
        return function(e, video) {
            console.log('dblclick');
            self.updateMajor(video, true);
        };
    }
    updateMajor(video, isUser) {
        // this.stopAll()
        this.layoutController.updateMajorByOId(video.streamId, isUser);
        this.mapVideosToLayout();
    }

    mapVideosToLayout() {
        const map = this.streamsMap;
        this.layoutController.panels.forEach(p => {
            let stream = map[Number(p.oid)];
            if (stream) {
                p.setStream(stream);
                stream.userStatus = p.status;
                if (p.parentChange) {
                    stream.rerender();
                    p.parentChange = false;
                } else {
                    stream.fixSize();
                }

                // 在web 版的时候如果switchLayout，修改了stream的parement dom会造成静音
                if (p.stream) {
                    p.stream.show()
                }
            }
        });
    }
    stopAll() {
        this.streams.forEach(s => {
            s.stop();
        });
    }
    autoSize() {
        this.streams.forEach(s => {
            s.autoFixSize();
        });
    }
    unpublishLocacl() {
        let stream;
        let videoStream = this.localStream;
        if (videoStream && this.client) {
            stream = videoStream.getStream();
            // local stream exist already
            if (stream) {
                this.client.unpublish(stream, (err) => {});
                stream.close();
            }
        }
    }
    switchLayout() {
        console.log('switch layout');
        const self = this;
        this.layoutController.switchLayout();
    }
    updateMajorByStreamId(id) {
        this.layoutController.updateMajorByOId(id);
        this.mapVideosToLayout();
    }
    relayoutByStore(store) {
        this.layoutController.sortByMeetingStore(store);
        this.mapVideosToLayout();
    }
    autoSizeStreams() {
        if (this.layoutController.mode === 'fullscreen') {
            this.streams.forEach(s => {
                s.autoFixSize();
            });
        }
    }
    showInfoByStore(store) {
        this.layoutController.upateExtraInfoByStore(store);
        this.layoutController.upateBackgroundByStore(store);
    }
    showPanelTip(msg, uid, store) {
        this.layoutController.showPanelTip(msg, uid, store);
    }
    hidePanelTipByStreamId(streamId) {
        this.layoutController.hidePanelTip(streamId);
    }
    updatePanelStatus(store) {
        this.layoutController.updatePanelStatus(store);
    }
    addPanelByMqtt(member) {
        this.layoutController.addPanel({
            id: member.streamId,
            visable: true
        });
    }
    syncByStore(store, statusChanged) {
        logger.debug(`syncByStore start ...`)
        let result = this.layoutController.syncPanelsByStore(store);
        this.layoutController.upateExtraInfoByStore(store);
        if (statusChanged) {
            this.relayoutByStore(store);
        }
    }
    toggleVideoByMemeber(member, isMuted) {
        this.toggleVideoFrame(member.streamId, isMuted);
    }
    checkInputDevices() {
        return new Promise((resolve, reject) => {
            if (!this.devices.hasDetect) {
                AgoraRTC.getDevices((devices) => {
                    let micphone = false;
                    let cemara = false;
                    devices.forEach(d => {
                        switch (d.kind) {
                            case 'audioinput':
                                micphone = true;
                                break;
                            case 'videoinput':
                                cemara = true;
                                break;
                        }
                    });
                    this.devices.cemara = cemara;
                    this.devices.micphone = micphone;
                    resolve();
                });
                this.devices.hasDetect = true;
            } else {
                resolve();
            }
        });
    }
    /**
     * 该做法只在1.13webSDK上生效，其它版本sdk需要自行研究，这个是非官方做法，后继如更SDK需保证该方式起作用
     * @param screen 是否是共享流，
     *
     */
    createMediaStream(screen) {
        const streamid = this.localStreamId;
        return new Promise((resolve, reject) => {
            this.checkInputDevices().then(() => {
                let devices = this.devices;
                let opt = {
                    streamID: streamid,
                    audio: !screen,
                    video: true,
                    screen: screen
                };
                let stream = AgoraRTC.createStream(opt);
                // 如需在共享时让麦收音，需在localStreamConfig.audio设置成true
                let localConfig = this.config.localStreamConfig;
                let audio = localConfig ? localConfig.audio : true;
                if (!devices.micphone) {
                    opt.audio = false;
                    audio = false;
                }
                if (!devices.cemara) {
                    opt.video = false;
                }
                let profile = this.config.videoProfile
                // if (screen)
                //     stream.setScreenProfile('720p_2');
                // else
                    stream.setVideoProfile(profile);

                stream.init(() => {
                    if (screen) {
                        if (audio) {
                            this.getAudioTrack().then(audio => {
                                // 处理因默认使用共享流时没有音轨的问题，需在AgoraRTC.createStream()时将audio设置成false
                                // 接着手动增音轨然后再joinRoom前把audio设置成true，最后上传publish
                                // 该做法只有1.13的SDK顺起作用，如后继更新SDK需要测试
                                stream.audio = true;
                                opt.audio = true;
                                stream.stream.addTrack(audio);
                                stream.enableAudio();
                                resolve(stream);
                            }).catch(error => {
                                resolve(stream);
                            });
                        } else {
                            resolve(stream);
                        }
                    } else {
                        resolve(stream);
                    }
                }, (err) => {
                    console.log(err)
                    reject(err);
                });
            });
        });
    }
    getAudioTrack() {
        return new Promise((resovle, reject) => {
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            }).then((stream) => {
                resovle(stream.getAudioTracks()[0]);
            }).catch(error => {
                reject(error);
            });
        });
    }
    switchMediaStream(status) {
        return new Promise((resolve, reject) => {
            if (this.localStream) {
                this.client.unpublish(this.localStream.stream);
                this.localStream.stop().close();
            }
            this.createMediaStream(status === 'sharing').then(stream => {
                this.localStream.setStream(stream).show();
                this.client.publish(stream, (err) => {
                    reject();
                });
                resolve();
            });
        });
    }
    startShareScreen() {
        let self = this
        self.switchMediaStream('sharing').then(() => {
            self.status = 'sharing';
            self.globalHandle({
                type: 'start-share-screen',
                status: true
            })
            self.layoutController.switchLayout('normal')
            self.autoSize()
        }).catch(err => {
            self.globalHandle({
                type: 'start-share-screen',
                status: false
            })
        })
    }
    stopShareScreen() {
        let self = this
        return new Promise((resolve, reject) => {
            self.switchMediaStream('meeting').then(() => {
                self.status = 'meeting';
                self.globalHandle({
                    type: 'stop-share-screen',
                    status: true
                })
                resolve()
            }).catch(err => {
                self.globalHandle({
                    type: 'stop-share-screen',
                    status: false
                })
                reject(err)
            });
        })
    }
}
