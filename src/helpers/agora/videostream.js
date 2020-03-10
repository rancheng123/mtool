import DomHelper from "./domhelper";
import { AgoraWebRTC } from './agorawebrtc';

export default class VideoStream {
    constructor(stream, parent, option) {
        this.status = {
            video: true,
            audio: true
        };
        this.originSize = {
            width: -1, height: -1
        };
        this.showFilter = false;
        this.userStatus = 'meeting';
        this.fixed = false;
        this.opt = option || {};
        this.stream = stream;
        this.streamId = stream.getId();
        this.videoDomId = `agv-${this.streamId}`;
        this.render();
        this.events();
        this.created = (new Date()).getTime();
        this.prarantNode = parent;
    }
    render() {
        const stream = this.stream;
        this.dom = document.createElement("div");
        this.dom.setAttribute("id", this.streamId.toString());
        this.dom.className = `video-stream ${this.userStatus}`;
        this.dom.innerHTML = `
        `;
        this.videoDom = document.createElement("div");
        this.videoDom.setAttribute("id", this.videoDomId);
        this.videoDom.style.overflow = 'hidden';
        this.videoDom.className = "video-wrap";
        if (this.dom && typeof(this.dom.appendChild) === "function") {
            this.dom.appendChild(this.videoDom);
        }

        this.toggleFilter(this.showFilter);
    }
    events() {
    }
    getStream() {
        return this.stream;
    }
    setStream(stream) {
        this.stream = stream;
        return this;
    }
    setSize(width, height) {
        let canvas = this.dom.querySelector('canvas');
        if (canvas) {
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        }
        this.width = width;
        this.height = height;
        return this;
    }
    getSize() {
        return {
            width: this.width, height: this.height
        };
    }
    resetSize() {
        this.dom.style.margin = `0`;
        this.dom.style.width = '';
        this.dom.style.height = '';
    }
    autoFixSize() {
        let self = this;
        this.fixed = false;
        let video = this.dom.querySelector('video');
        if (!video) {
            return;
        }
        let ow = video.videoWidth;
        let oh = video.videoHeight;
        let pw = this.prarantNode.clientWidth;
        let ph = this.prarantNode.clientHeight;
        let rate = ow / oh;
        if (isNaN(rate)) {
            return;
        }
        console.log(`rate is ${rate} use ${ow}/${oh}, parent size: width ${pw}, height:${ph} `);
        let prate = pw / ph;
        let nw = pw;
        let nh = ph;
        if (prate > rate) {
            nw = pw;
            nh = Math.ceil(nw / rate);
        }
        else {
            nw = Math.ceil(ph * rate);
            nh = ph;
        }
        if (nw == 0) {
            this.dom.style.width = `100%`;
        }
        else {
            this.dom.style.width = `${nw}px`;
        }
        if (nh == 0) {
            this.dom.style.height = `100%`;
        }
        else {
            this.dom.style.height = `${nh}px`;
        }
        this.dom.style.margin = `${(ph - nh) / 2}px 0 0 ${(pw - nw) / 2}px`;
        if (this.userStatus === 'sharing') {
            this.dom.style.margin = `0 0 0 0`;
            this.dom.style.width = '100%';
            this.dom.style.height = '100%';
            if (prate < rate) {
                nw = pw;
                nh = Math.ceil(nw / rate);
            }
            else {
                nw = Math.ceil(ph * rate);
                nh = ph;
            }
        }
        if (video) {
            video.style.width = `${nw}px`;
            video.style.height = `${nh}px`;
            if (this.userStatus === 'sharing') {
                video.style.width = `${nw}px`;
                video.style.height = `${nh}px`;
                video.style.top = `${(ph - nh) / 2}px`;
            }
            else {
                video.style.top = '0';
            }
            video.style.left = 'auto';
            if (video.paused) {
                video.play();
            }
            // video.volume = 1
        }
        if (!video) {
            console.log('not video');
        }
        this.fixed = true;
        // }
        return this;
    }
    show() {
        const self = this;
        const opt = this.opt;
        this.originSize = {
            width: -1, height: -1
        };
        if (this.dom) {
            let dom = this.prarantNode.querySelector('.video-stream');
            if (dom) {
                this.prarantNode.removeChild(dom);
            }
            if (this.prarantNode && typeof(this.prarantNode.appendChild) === "function") {
                this.prarantNode.appendChild(this.dom);
            }

            this.stream.play(this.videoDomId, window.location.host);
            this.fixSize();
            // if (opt.dbclick) {
            //     this.dom.addEventListener('dblclick', (e) => {
            //         e.stopPropagation();
            //         e.preventDefault();
            //         e.stopImmediatePropagation();
            //         if (typeof opt.dbclick === 'function') {
            //             opt.dbclick(e, self);
            //         }
            //     });
            // }
        }
        return this;
    }
    fireCallback(cb, data) {
        if (typeof cb === "function") {
            cb.call(null, data);
        }
    }
    enableVideo(cb) {
        this.stream.enableVideo();
        this.toggleFilter(false);
        this.fireCallback(cb);
    }
    disableVideo(cb) {
        this.stream.disableVideo();
        this.toggleFilter(true);
        this.fireCallback(cb);
    }
    enableAudio(cb) {
        this.stream.enableAudio();
        if (this.stream.stream) {
            let audioTracks = this.stream.stream.getAudioTracks();
            audioTracks.forEach(a => {
                a.enabled = true;
            });
        }
        this.fireCallback(cb);
    }
    disableAudio(cb) {
        this.stream.disableAudio();
        if (this.stream.stream) {
            let audioTracks = this.stream.stream.getAudioTracks();
            audioTracks.forEach(a => {
                a.enabled = false;
            });
        }

        this.fireCallback(cb);
    }
    toggleFilter(isMuted) {
        let clasName = this.dom.className;
        let mutedClass = "muted-video";
        if (isMuted !== undefined) {
            if (isMuted) {
                DomHelper.addClass(this.dom, mutedClass);
            }
            else {
                DomHelper.removeClass(this.dom, mutedClass);
            }
        }
        else {
            if (!DomHelper.hasClass(this.dom, mutedClass)) {
                DomHelper.addClass(this.dom, mutedClass);
                isMuted = true;
            }
            else {
                DomHelper.removeClass(this.dom, mutedClass);
                isMuted = false;
            }
        }
        this.showFilter = isMuted;
        return this;
    }
    remove() {
        this.prarantNode.removeChild(this.dom);
        return this;
    }
    stop() {
        this.stream.stop();
        return this;
    }
    close() {
        if (this.stream) {
            let s = this.stream.stream;
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
            this.stream.close();
        }
        return this;
    }
    setVideoStatus(flag, cb) {
        let status = this.status;
        let enable = flag;
        if (flag === undefined) {
            enable = !status.video;
        }
        if (enable) {
            this.enableVideo(() => {
                console.log("enableVideo");
                status.video = enable;
                if (typeof cb === 'function') {
                    cb.call(null, { muted: false });
                }
            });
        }
        else {
            this.disableVideo(() => {
                console.log("disableVideo");
                status.video = enable;
                if (typeof cb === 'function') {
                    cb.call(null, { muted: true });
                }
            });
        }
        return this;
    }
    setAudioStatus(flag, cb) {
        let status = this.status;
        let enable = flag;
        if (flag === undefined) {
            enable = !status.audio;
        }
        if (enable) {
            this.enableAudio(() => {
                status.audio = enable;
                if (typeof cb === 'function') {
                    cb.call(null, { muted: false });
                }
            });
        }
        else {
            this.disableAudio(() => {
                status.audio = enable;
                if (typeof cb === 'function') {
                    cb.call(null, { muted: true });
                }
            });
        }
        return this;
    }
    setAudioStatusNew(expect) {
        // expect:t unmuted, muted
        let status = this.status
        let self = this
        return new Promise((resovle, reject) => {
            if (expect === undefined) {
                reject()
            }

            if (expect === 'unmuted') {
                self.enableAudio(() => {
                    status.audio = true;
                    resovle('unmuted')
                });
            }
            else if (expect === 'muted') {
                self.disableAudio(() => {
                    status.audio = false;
                    resovle('muted')
                });
            }
        })
    }
    calOriginRate() {
        const self = this;
        let canvas = this.dom.querySelector("canvas");
        let cw = canvas.clientWidth;
        let ch = canvas.clientHeight;
        if (!this.rate && cw && ch) {
            this.rate = canvas.clientWidth / canvas.clientHeight;
        }
    }
    rerender() {
        console.log('rerender ');
        // if (this.isParentBigger()) {
        // this.stop()
        // this.originSize = {
        //     width: -1, height: -1
        // }
        // this.render()
        // this.show()
        // } else {
        //     this.autoFixSize()
        // }
        // this.waitToAutoSize()
        this.fixSize();
    }
    fixSize() {
        this.autoFixSize();
        let timer = setInterval(() => {
            if (this.fixed) {
                clearInterval(timer);
            }
            this.autoFixSize();
        }, 100);
    }
    updateParent(parent) {
        if (this.prarantNode !== parent) {
            this.prarantNode = parent;
            this.rerender();
        }
        else {
            this.fixSize();
        }
        return this;
    }
    setUserStatus(status) {
        this.userStatus = status;
        DomHelper.removeClass(this.dom, 'meeting sharing');
        DomHelper.addClass(this.dom, status);
        return this;
    }
    // unpublish(client, stream) { }
    // publish(client, stream) { }
}
