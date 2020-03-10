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
import * as tslib_1 from "tslib";
import StoreDecorator, { Mutation, Getter } from '../store-decorator';
const electron = require('electron');
const remote = electron.remote;
const logger = remote.require('./app/logger');
import { StreamUtils } from '../../helpers';
export class VideoStream {
    constructor(stream, option) {
        this.status = { video: true, audio: true };
        this.originSize = { width: -1, height: -1 };
        this.userStatus = 'meeting';
        this.fixed = false;
        this.created = (new Date()).getTime();
        this.opt = {};
        this.opt = option || {};
        this.stream = stream;
        this.streamId = stream.getId();
        this.videoDomId = `agv-${this.streamId}`;
        this.created = (new Date()).getTime();
    }
}
let Store = class Store {
    /** state */
    state() {
        return {
            streams: {},
            localId: 0,
        };
    }
    /** Getter */
    streams(state) {
        return state.streams;
    }
    localStream(state) {
        const { streams } = state;
        let local = null;
        for (let i in streams) {
            if (streams[i].stream.getId() === state.localId) {
                local = streams[i];
                break;
            }
        }
        return local;
    }
    /** Mutation */
    /**
     * 新增流
     * @param state
     */
    addStream(state, { stream, options }) {
        const id = stream.getId();
        // const { streams } = state
        // if (streams[id]) {
        //     return
        // }
        const videoStream = new VideoStream(stream, options);
        // const id = videoStream.streamId
        if (options && options.isLocal) {
            state.localId = stream.getId();
        }
        state.streams = {
            ...state.streams,
            [id]: videoStream
        };
        logger.info(`vuex-meeting:store add stream ${id} current stream keys ${Object.keys(state.streams)}`);
    }
    /**
     * 删除流
     * @param state
     */
    removeStream(state, id) {
        delete state.streams[id];
        state.streams = { ...state.streams };
        logger.info(`vuex-meeting:store remove stream ${id} current stream keys ${Object.keys(state.streams)}`);
    }
    /**
     * 清空流数据
     * @param state
     */
    clear(state) {
        state.streams = {};
    }
    /**
     * 通过流id获取
     * @param state
     * @param streamId
     */
    getStreamById(state, streamId) {
        return state.streams[streamId].stream;
    }
    /**
     * 通过流id更新流
     * @param state
     * @param streamId
     * @param stream
     */
    updateStreamById(state, { stream, streamId }) {
        const { streams } = state;
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, { stream });
        return streams;
    }
    /**
     * 启用视频
     * @param state
     * @param streamId
     */
    async enableVideo(state, streamId) {
        const { streams } = state;
        const n = await StreamUtils.enableVideo(streams[streamId].stream);
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, { stream: n });
        return streams;
    }
    /**
     * 禁用视频
     * @param state
     * @param streamId
     */
    async disableVideo(state, streamId) {
        const { streams } = state;
        const n = await StreamUtils.disableVideo(streams[streamId].stream);
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, { stream: n });
        return streams;
    }
    /**
     * 启用音频
     * @param state
     * @param streamId
     */
    async enableAudio(state, streamId) {
        const { streams } = state;
        const n = await StreamUtils.enableAudio(streams[streamId].stream);
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, { stream: n });
        return streams;
    }
    /**
     * 禁用音频
     * @param state
     * @param streamId
     */
    async disableAudio(state, streamId) {
        const { streams } = state;
        const n = await StreamUtils.disableAudio(streams[streamId].stream);
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, { stream: n });
        return streams;
    }
    /**
     * 停止流
     * @param state
     * @param streamId
     */
    stop(state, streamId) {
        const { streams } = state;
        streams[streamId].stream.stop();
        return streams;
    }
    /**
     * 关闭流通过流id
     * @param state
     * @param streamId
     */
    close(state, streamId) {
        const { streams } = state;
        const stream = streams[streamId].stream;
        stream.close();
        if (stream && stream.stream) {
            let s = stream.stream;
            s.getAudioTracks().forEach(t => {
                t.enabled = false;
                t.stop();
                s.removeTrack(t);
            });
            s.getVideoTracks().forEach(t => {
                t.enabled = false;
                t.stop();
                s.removeTrack(t);
            });
            stream.close();
        }
        streams[streamId] = StreamUtils.getNewStream(streams, streamId, { stream });
        return streams;
    }
    /**
     * 设置视频状态
     * @param state
     * @param streamId
     * @param flag
     */
    async setVideoStatus(state, { streamId, flag }) {
        const streams = state.streams;
        const { stream, status } = streams[streamId];
        const newStatus = { ...status };
        let enable = flag;
        if (flag === undefined) {
            enable = !status.video;
        }
        if (enable) {
            StreamUtils.enableVideo(stream);
            console.log('enableVideo');
            streams[streamId].status.video = enable;
        }
        else {
            StreamUtils.disableVideo(stream);
            console.log('disableVideo');
            streams[streamId].status.video = enable;
        }
        state.streams = streams;
    }
    /**
     * 设置音频状态
     * @param state
     * @param streamId
     * @param flag
     */
    async setAudioStatus(state, { streamId, flag }) {
        const streams = state.streams;
        const { stream, status } = streams[streamId];
        let enable = flag;
        const newStatus = { ...status };
        if (flag === undefined) {
            enable = !status.audio;
        }
        if (enable) {
            StreamUtils.enableAudio(stream);
            console.log('enableAudio');
            streams[streamId].status.audio = enable;
        }
        else {
            StreamUtils.disableAudio(stream);
            console.log('disableAudio');
            streams[streamId].status.audio = enable;
        }
        state.streams = streams;
    }
};
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "streams", null);
tslib_1.__decorate([
    Getter,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "localStream", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "addStream", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "removeStream", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "clear", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", Object)
], Store.prototype, "getStreamById", null);
tslib_1.__decorate([
    Mutation('streams'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", VideoStream)
], Store.prototype, "updateStreamById", null);
tslib_1.__decorate([
    Mutation('streams'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", Promise)
], Store.prototype, "enableVideo", null);
tslib_1.__decorate([
    Mutation('streams'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", Promise)
], Store.prototype, "disableVideo", null);
tslib_1.__decorate([
    Mutation('streams'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", Promise)
], Store.prototype, "enableAudio", null);
tslib_1.__decorate([
    Mutation('streams'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", Promise)
], Store.prototype, "disableAudio", null);
tslib_1.__decorate([
    Mutation('streams'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "stop", null);
tslib_1.__decorate([
    Mutation('streams'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], Store.prototype, "close", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], Store.prototype, "setVideoStatus", null);
tslib_1.__decorate([
    Mutation(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], Store.prototype, "setAudioStatus", null);
Store = tslib_1.__decorate([
    StoreDecorator
], Store);
export default new Store();
//# sourceMappingURL=index.js.map