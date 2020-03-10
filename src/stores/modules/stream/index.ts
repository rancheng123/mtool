/**
 * @file index.ts
 * @author shijh
 *
 * meeting流store
 */
//
// import { storeDecorator } from '@mydreamplus/aglarond'
// const { Action, Mutation, Getter,
//     default: StoreDecorator
// } = storeDecorator

import StoreDecorator, { Action, Mutation, Getter}  from '../store-decorator'


const electron = require('electron')


const remote = electron.remote
const logger = remote.require('./app/logger')

import { AgoraWebRTCD } from '../../../interfaces/video.interface'
import { StreamUtils } from '../../helpers'

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

export class VideoStream {
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
}

@StoreDecorator
class Store {
    /** state */
    state() {
        return {
            streams: {},
            localId: 0,
        }
    }

    /** Getter */
    @Getter
    streams(state) {
        return state.streams
    }

    @Getter
    localStream(state) {
        const { streams } = state
        let local = null
        for (let i in streams) {
            if (streams[i].stream.getId() === state.localId) {
                local = streams[i]
                break;
            }
        }
        return local
    }

    /** Mutation */
    /**
     * 新增流
     * @param state
     */
    @Mutation()
    addStream(state, { stream, options }) {
        const id = stream.getId()
        // const { streams } = state
        // if (streams[id]) {
        //     return
        // }
        const videoStream = new VideoStream(stream, options)
        // const id = videoStream.streamId
        if (options && options.isLocal) {
            state.localId = stream.getId()
        }
        state.streams = {
            ...state.streams,
            [id]: videoStream
        }
        logger.info(`vuex-meeting:store add stream ${id} current stream keys ${Object.keys(state.streams)}`)
    }

    /**
     * 删除流
     * @param state
     */
    @Mutation()
    removeStream(state, id) {
        delete state.streams[id]
        state.streams = {...state.streams}
        logger.info(`vuex-meeting:store remove stream ${id} current stream keys ${Object.keys(state.streams)}`)
    }

    /**
     * 清空流数据
     * @param state
     */
    @Mutation()
    clear(state) {
        state.streams = {}
    }

    /**
     * 通过流id获取
     * @param state
     * @param streamId
     */
    @Mutation()
    getStreamById(state, streamId: string): AgoraWebRTCD.Stream {
        return state.streams[streamId].stream
    }

    /**
     * 通过流id更新流
     * @param state
     * @param streamId
     * @param stream
     */
    @Mutation('streams')
    updateStreamById(state, { stream, streamId }): VideoStream {
        const { streams } = state
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, {stream})
        return streams
    }

    /**
     * 启用视频
     * @param state
     * @param streamId
     */
    @Mutation('streams')
    async enableVideo(state, streamId: string) {
        const { streams } = state
        const n = await StreamUtils.enableVideo(streams[streamId].stream)
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, {stream: n})
        return streams
    }

    /**
     * 禁用视频
     * @param state
     * @param streamId
     */
    @Mutation('streams')
    async disableVideo(state, streamId: string) {
        const { streams } = state
        const n = await StreamUtils.disableVideo(streams[streamId].stream)
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, {stream: n})
        return streams
    }

    /**
     * 启用音频
     * @param state
     * @param streamId
     */
    @Mutation('streams')
    async enableAudio(state, streamId: string) {
        const { streams } = state
        const n = await StreamUtils.enableAudio(streams[streamId].stream)
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, {stream: n})
        return streams
    }

    /**
     * 禁用音频
     * @param state
     * @param streamId
     */
    @Mutation('streams')
    async disableAudio(state, streamId: string) {
        const { streams } = state
        const n = await StreamUtils.disableAudio(streams[streamId].stream)
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, {stream: n})
        return streams
    }

    /**
     * 停止流
     * @param state
     * @param streamId
     */
    @Mutation('streams')
    stop(state, streamId: string) {
        const { streams } = state
        streams[streamId].stream.stop()
        return streams
    }

    /**
     * 关闭流通过流id
     * @param state
     * @param streamId
     */
    @Mutation('streams')
    close(state, streamId: string) {
        const { streams } = state
        const stream = streams[streamId].stream
        stream.close()
        if (stream && stream.stream) {
            let s = stream.stream
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
            stream.close()
        }
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, {stream})
        return streams
    }

    /**
     * 设置视频状态
     * @param state
     * @param streamId
     * @param flag
     */
    @Mutation()
    async setVideoStatus(state, { streamId, flag }) {
        const streams = state.streams
        const { stream, status } = streams[streamId]
        const newStatus = { ...status }
        let enable = flag
        if (flag === undefined) {
            enable = !status.video
        }
        if (enable) {
            StreamUtils.enableVideo(stream)
            console.log('enableVideo')
            streams[streamId].status.video = enable
        } else {
            StreamUtils.disableVideo(stream)
            console.log('disableVideo')
            streams[streamId].status.video = enable
        }
        state.streams = streams
    }

    /**
     * 设置音频状态
     * @param state
     * @param streamId
     * @param flag
     */
    @Mutation()
    async setAudioStatus(state, { streamId, flag }) {
        const streams = state.streams
        const { stream, status } = streams[streamId]
        let enable = flag
        const newStatus = { ...status }
        if (flag === undefined) {
            enable = !status.audio
        }
        if (enable) {
            StreamUtils.enableAudio(stream)
            console.log('enableAudio')
            streams[streamId].status.audio = enable
        } else {
            StreamUtils.disableAudio(stream)
            console.log('disableAudio')
            streams[streamId].status.audio = enable
        }
        state.streams = streams
    }
}

export default new Store()
