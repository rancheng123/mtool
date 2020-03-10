/**
 * @file helper/index.ts
 * @author shijh
 * @description
 *  vuex store 工具方法
 */
import { People } from '../modules/meeting'
import { AgoraWebRTCD } from '../../interfaces/video.interface'

export class VideoStream {
    status: any = { video: true, audio: true }
    originSize: any = { width: -1, height: -1 }
    userStatus: string = 'meeting'
    fixed: boolean = false
    created: number = (new Date()).getTime();
    opt = {}
    stream: any
    streamId: number
    videoDomId: string

    constructor(stream: any, option: any) {
        this.opt = option || {}
        this.stream = stream
        this.streamId = stream.getId()
        this.videoDomId = `agv-${this.streamId}`
        this.created = (new Date()).getTime()
    }
}

/**
 * 参会人员类型检测工具类
 */
export class MemberUtils {
    /**
     * 是否正在分享中
     * @param p 人员对象实例
     */
    static isSharing(p: People): boolean {
        return p.status === 'sharing'
    }

    /**
     * 是否是创建者
     * @param p 人员对象实例
     */
    static isCreator(p: People): boolean {
        return p.role === 'creator'
    }

    /**
     * 是否是电话参会者
     * @param p 人员对象实例
     */
    static isPhone(p: People): boolean {
        return p.type === 'phone'
    }

    /**
     * 是否是tv参会者
     * @param p 人员对象实例
     */
    static isTv(p: People): boolean {
        return p.type === 'tv'
    }

    /**
     * 是否是Microphone参会者
     * @param p 人员对象实例
     */
    static isMicrophone(p: People): boolean {
        return p.type === 'microphone' || p.type === 'android_microphone'
    }

    /**
     * 检验人员对象状态发生了修改
     * @param o 旧的人员对象
     * @param n 新的人员对象
     */
    static checkChanged(o: People, n: People): boolean {
        return o.status !== n.status || o.role !== n.role || o.video !== n.video || o.audio !== n.audio
    }

    /**
     * 获取最后一个非mic用户
     * @param members 成员对象
     */
    static getLastMember(members) {
        let result = []
        members.forEach((m) => {
            if (!MemberUtils.isMicrophone(m)) {
                result.unshift(m)
            }
        })

        return result[0]
    }
}

/**
 * 流的工具类
 */
export class StreamUtils {
    /**
     * 获取一个新的流对象
     * @param stream
     */
    static getNewStream(streams, streamId, options: any = {}): AgoraWebRTCD.Stream {
        const videoStream = streams[streamId] || new VideoStream(options.stream, {})
        Object.assign(videoStream, options)
        return { ...videoStream }
    }
    /**
     * 启用视屏
     * @param stream
     */
    static enableVideo(stream: AgoraWebRTCD.Stream): AgoraWebRTCD.Stream {
        stream.enableVideo()
        return stream
    }

    /**
     * 禁用视频
     * @param stream
     */
    static disableVideo(stream: AgoraWebRTCD.Stream): AgoraWebRTCD.Stream {
        stream.disableVideo()
        return stream
    }

    /**
     * 启用音频
     * @param stream
     */
    static enableAudio(stream: AgoraWebRTCD.Stream): AgoraWebRTCD.Stream {
        stream.enableAudio()
        if (stream.stream) {
            let audioTracks = stream.stream.getAudioTracks()
            audioTracks.forEach(a => {
                a.enabled = true
            })
        }
        return stream
    }

    /**
     * 禁用音频
     * @param stream
     */
    static disableAudio(stream: AgoraWebRTCD.Stream): AgoraWebRTCD.Stream {
        stream.disableAudio()
        if (stream.stream) {
            let audioTracks = stream.stream.getAudioTracks()
            audioTracks.forEach(a => {
                a.enabled = false
            })
        }
        return stream
    }
}
