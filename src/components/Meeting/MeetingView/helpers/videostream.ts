/**
 * @file videostream.js
 * @author shijh
 *
 * 流处理类
 */
import { AgoraWebRTCD } from '../../../../interfaces/video.interface'

export interface statusInterface {
    video: boolean,
    audio: boolean
}

export interface originSizeInterface {
    width: Number,
    height: Number
}

export interface VideoStreamOpt {
    uid?: string,
    isLocal?: boolean,
    isMajor?: boolean,
    // eslint-disable-next-line
    dbclick?: (e: MouseEvent, video: VideoStream) => void
}

export type Expect = 'unmuted' | 'muted' | undefined

export default class VideoStream {
    status: statusInterface = { video: true, audio: true }
    originSize: originSizeInterface = { width: -1, height: -1 }
    userStatus: string = 'meeting'
    fixed: boolean = false
    created: number = (new Date()).getTime();
    opt = {}
    stream: AgoraWebRTCD.Stream
    streamId: number
    videoDomId: string

    constructor(stream: AgoraWebRTCD.Stream, option: VideoStreamOpt) {
        this.opt = option || {}
        this.stream = stream
        this.streamId = stream.getId()
        this.videoDomId = `agv-${this.streamId}`
        this.created = (new Date()).getTime()
    }
    /**
     * 获取流
     */
    getStream(): AgoraWebRTCD.Stream {
        return this.stream
    }
    /**
     * 设置流
     * @param {Object} stream 流对象
     */
    setStream(stream: AgoraWebRTCD.Stream): VideoStream {
        this.stream = stream
        return this
    }
    /**
     * 处理回调
     * @param {Function} cb
     * @param {Object} data
     */
    fireCallback(cb: (data: any) => void, data?: any): void {
        if (typeof cb === 'function') {
            cb.call(null, data)
        }
    }
    /**
     * 启用视频
     * @param {Function} cb
     */
    enableVideo(cb?: () => void): void {
        this.stream.enableVideo()
        this.fireCallback(cb)
    }
    /**
     * 禁用视频
     * @param {Function} cb
     */
    disableVideo(cb?: () => void): void {
        this.stream.disableVideo()
        this.fireCallback(cb)
    }
    /**
     * 启用音频
     * @param {Function} cb
     */
    enableAudio(cb?: (data?: any) => void): void {
        this.stream.enableAudio()
        if (this.stream.stream) {
            let audioTracks = this.stream.stream.getAudioTracks()
            audioTracks.forEach(a => {
                a.enabled = true
            })
        }
        this.fireCallback(cb)
    }
    /**
     * 禁用音频
     * @param {Function} cb
     */
    disableAudio(cb?: (data?: any) => void): void {
        this.stream.disableAudio()
        if (this.stream.stream) {
            let audioTracks = this.stream.stream.getAudioTracks()
            audioTracks.forEach(a => {
                a.enabled = false
            })
        }
        this.fireCallback(cb)
    }
    /**
     * 停止流
     */
    stop(): VideoStream {
        this.stream.stop()
        return this
    }
    /**
     * 关闭流
     */
    close(): VideoStream {
        if (this.stream) {
            let s = this.stream.stream
            s.getAudioTracks().forEach(t => {
                t.enabled = false
                t.stop()
                s.removeTrack(t)
            })
            s.getVideoTracks().forEach(t => {
                t.enabled = false
                t.stop()
                s.removeTrack(t)
            })
            this.stream.close()
        }
        return this
    }
    /**
     * 设置视频流转态
     * @param {boolean} flag
     * @param {Function} cb
     */
    setVideoStatus(flag: boolean, cb?: (data?: any) => void): VideoStream {
        let status = this.status
        let enable = flag
        if (flag === undefined) {
            enable = !status.video
        }
        if (enable) {
            this.enableVideo(() => {
                console.log('enableVideo')
                status.video = enable
                if (typeof cb === 'function') {
                    cb.call(null, { muted: false })
                }
            })
        } else {
            this.disableVideo(() => {
                console.log('disableVideo')
                status.video = enable
                if (typeof cb === 'function') {
                    cb.call(null, { muted: true })
                }
            })
        }
        return this
    }
    /**
     * 设置音频状态
     * @param {boolean} flag
     * @param {Function} cb
     */
    setAudioStatus(flag: boolean, cb?: (data?: any) => void): VideoStream {
        let status = this.status
        let enable = flag
        if (flag === undefined) {
            enable = !status.audio
        }
        if (enable) {
            this.enableAudio(() => {
                status.audio = enable
                if (typeof cb === 'function') {
                    cb.call(null, { muted: false })
                }
            })
        } else {
            this.disableAudio(() => {
                status.audio = enable
                if (typeof cb === 'function') {
                    cb.call(null, { muted: true })
                }
            })
        }
        return this
    }
    // /**
    //  * 设置音频状态（新）
    //  * @param {*} expect
    //  */
    // setAudioStatusNew(expect: Expect) {
    //     // expect:t unmuted, muted
    //     let status = this.status
    //     let self = this
    //     return new Promise((resovle, reject) => {
    //         if (expect === undefined) {
    //             reject()
    //         }

    //         if (expect === 'unmuted') {
    //             self.enableAudio(() => {
    //                 status.audio = true
    //                 resovle('unmuted')
    //             });
    //         }
    //         else if (expect === 'muted') {
    //             self.disableAudio(() => {
    //                 status.audio = false
    //                 resovle('muted')
    //             })
    //         }
    //     })
    // }
}
