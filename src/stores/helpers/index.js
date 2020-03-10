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
/**
 * 参会人员类型检测工具类
 */
export class MemberUtils {
    /**
     * 是否正在分享中
     * @param p 人员对象实例
     */
    static isSharing(p) {
        return p.status === 'sharing';
    }
    /**
     * 是否是创建者
     * @param p 人员对象实例
     */
    static isCreator(p) {
        return p.role === 'creator';
    }
    /**
     * 是否是电话参会者
     * @param p 人员对象实例
     */
    static isPhone(p) {
        return p.type === 'phone';
    }
    /**
     * 是否是tv参会者
     * @param p 人员对象实例
     */
    static isTv(p) {
        return p.type === 'tv';
    }
    /**
     * 是否是Microphone参会者
     * @param p 人员对象实例
     */
    static isMicrophone(p) {
        return p.type === 'microphone' || p.type === 'android_microphone';
    }
    /**
     * 检验人员对象状态发生了修改
     * @param o 旧的人员对象
     * @param n 新的人员对象
     */
    static checkChanged(o, n) {
        return o.status !== n.status || o.role !== n.role || o.video !== n.video || o.audio !== n.audio;
    }
    /**
     * 获取最后一个非mic用户
     * @param members 成员对象
     */
    static getLastMember(members) {
        let result = [];
        members.forEach((m) => {
            if (!MemberUtils.isMicrophone(m)) {
                result.unshift(m);
            }
        });
        return result[0];
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
    static getNewStream(streams, streamId, options = {}) {
        const videoStream = streams[streamId] || new VideoStream(options.stream, {});
        Object.assign(videoStream, options);
        return { ...videoStream };
    }
    /**
     * 启用视屏
     * @param stream
     */
    static enableVideo(stream) {
        stream.enableVideo();
        return stream;
    }
    /**
     * 禁用视频
     * @param stream
     */
    static disableVideo(stream) {
        stream.disableVideo();
        return stream;
    }
    /**
     * 启用音频
     * @param stream
     */
    static enableAudio(stream) {
        stream.enableAudio();
        if (stream.stream) {
            let audioTracks = stream.stream.getAudioTracks();
            audioTracks.forEach(a => {
                a.enabled = true;
            });
        }
        return stream;
    }
    /**
     * 禁用音频
     * @param stream
     */
    static disableAudio(stream) {
        stream.disableAudio();
        if (stream.stream) {
            let audioTracks = stream.stream.getAudioTracks();
            audioTracks.forEach(a => {
                a.enabled = false;
            });
        }
        return stream;
    }
}
//# sourceMappingURL=index.js.map