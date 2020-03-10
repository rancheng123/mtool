import DomHelper from './domhelper';
const electron = require('electron')
const remote = electron.remote
const logger = remote.require('./app/logger')
export default class Panel {
    constructor(opt) {
        this.member = opt.member || {};
        this.members = opt.members || [];
        this.streamIds = this.findStreamId() || [];
        this.isLocal = false;
        this.isMajor = false;
        this.isUserDo = false;
        this.parentChange = false;
        this.type = '';
        this.visble = true;
        this.isShowCallEnd = false;
        this.status = '';
        this.audio = 'on';
        this.video = 'on';
        this.parent = opt.parent;
        this.isLocal = !!opt.isLocal;
        this.isMajor = !!opt.isMajor;
        this.id = `panel-${opt.id}`;
        this.videoId = `video-${opt.id}`;
        this.oid = Number(opt.id);
        this.visble = !!opt.visable;
        this.controllerId = null;
        this.linkedUid = null;
        this.layout = opt.layout
        this.role = '';
        this.streams = [];
        this.type = opt.type
        this.isShowCallEnd = opt.isShowCallEnd
        this.audio = opt.audio === undefined ? 'on' : opt.audio;
        this.video = opt.video === undefined ? 'on' : opt.video;
        this.render();
        if (!this.visble) {
            this.hide();
        }
    }
    render() {
        const self = this;
        this.dom = document.createElement('div');
        this.dom.setAttribute('id', this.id);
        DomHelper.addClass(this.dom, 'layout-panel');
        if (this.parent && typeof(this.parent.appendChild) === "function") {
            this.parent.appendChild(this.dom);
        }

        this.menubar = document.createElement('div');
        DomHelper.addClass(this.menubar, 'layout-menu-bar');
        if (this.dom && typeof(this.dom.appendChild) === "function") {
            this.dom.appendChild(this.menubar);
        }

        this.layoutname = document.createElement('div');
        DomHelper.addClass(this.layoutname, 'layout-name');
        if (this.dom && typeof(this.dom.appendChild) === "function") {
            this.dom.appendChild(this.layoutname)
        }

        this.extra = document.createElement('div');
        DomHelper.addClass(this.extra, 'layout-extra');
        if (this.menubar && typeof(this.menubar.appendChild) === "function") {
            this.menubar.appendChild(this.extra);
        }
        if(this.type === 'phone' && this.isShowCallEnd) {
            this.endcall = document.createElement('div');
            this.endcall.innerHTML = `
                挂断
            `;
            DomHelper.addClass(this.endcall, 'layout-endcall');
            if (this.menubar && typeof(this.menubar.appendChild) === "function") {
                this.menubar.appendChild(this.endcall);
            }
        }

        this.voicectl = document.createElement('div');

        this.voicectl.innerHTML = `
            <div class="voice_switch unmuted" rel="voice_switch"><img src=""/></div>
        `;

        DomHelper.addClass(this.voicectl, `layout-voice ${this.isLocal ? 'hidden' : ''}`);

        if (this.menubar && typeof(this.menubar.appendChild) === "function") {
            this.menubar.appendChild(this.voicectl);
        }


        this.tip = document.createElement('div');
        DomHelper.addClass(this.tip, 'layout-tip hidden');
        this.tip.innerHTML = '对方网络不稳定';
        if (this.dom && typeof(this.dom.appendChild) === "function") {
            this.dom.appendChild(this.tip);
        }
        this.vidoeWrap = document.createElement('div');
        this.vidoeWrap.setAttribute('id', this.videoId);

        this.sip = document.createElement('div');
        DomHelper.addClass(this.sip, `${this.type === 'phone' ? 'sip-img' : 'hidden'}`);
        this.sip.innerHTML = `
            <img class="${this.isShowCallEnd ? '' : 'endcall-no'}" src=""/>
            <span class="tip ${this.isShowCallEnd ? '' : 'tip-endcall-no'}">电话接入</span>
            <div class="endcall ${this.isShowCallEnd ? '' : 'hidden'}">挂断</div>
        `;

        this.vidoeWrap.appendChild(this.sip);

        DomHelper.addClass(this.vidoeWrap, 'layout-wrap');
        if (this.dom && typeof(this.dom.appendChild) === "function") {
            this.dom.appendChild(this.vidoeWrap);
        }

        this.bigger = document.createElement('div');
        if (this.type === 'phone') {
            // <div class='layout-bigger hidden' rel="bigger"><img src=""/></div>
            // this.bigger.innerHTML = ``;
        } else {
            this.bigger.innerHTML = `
                <img src=""/>
            `;
        }

        DomHelper.addClass(this.bigger, 'layout-bigger');
        if (this.dom && typeof(this.dom.appendChild) === "function") {
            this.dom.appendChild(this.bigger);
        }

        this.vidoeCtl = document.createElement('div');

        if (this.dom && typeof(this.dom.appendChild) === "function") {
            this.dom.appendChild(this.vidoeCtl);
        }

        this.events();
    }
    events() {
        const self = this;
        const statusCtr = this.vidoeCtl;
        let processing = {
            loading: false
        };
        const voicectl = this.voicectl
        const bigger = this.bigger
        const sip = this.sip
        const endcall = this.endcall
        if (bigger) {
            bigger.addEventListener(`click`, (e) => {
                self.biggerOrsmaller()
            })
        }
        if (this.type === 'phone') {
            if (endcall && typeof(endcall.addEventListener) === 'function') {

                endcall.addEventListener(`click`, (e) => {
                    self.dispatchEndcall();
                })
            }
            if (sip) {
                let endcallNormal = this.sip.querySelector('.endcall')
                endcallNormal.addEventListener(`click`, (e) => {
                    self.dispatchEndcall();
                })
            }
        }

        if (voicectl) {
            voicectl.addEventListener(`click`, (e) => {
                self.switchVoice()
            })
        }

        if (statusCtr) {
            statusCtr.addEventListener('click', (e) => {
                let target = e.target;
                const type = target.getAttribute('rel');
                switch (type) {
                    case 'trigger':
                        self.showControlMenu();
                        break;
                    case 'switcher_voice':
                        self.switchVoice();
                        break;
                    default:
                        break;
                }
            });
        }


    }
    dispatchEndcall() {
        let self = this
        logger.info(`#################panel endcall() self.oid:${self.oid}`)

        let evt = new CustomEvent('endcall');
        evt.phoneId = self.oid
        window.dispatchEvent(evt)
    }
    biggerOrsmaller() {
        let self = this
        if (this.layout.mode == 'normal') {
            this.layout.panels.forEach(p => {
                if (self.id !== p.id ) {
                    p.isMajor = false
                } else {
                    p.isMajor = true
                }
            });
            this.layout.switchLayout('fullscreen')
        } else if (this.layout.mode == 'fullscreen') {
            if (self.isMajor) {
                this.layout.panels.forEach(p => {
                    p.isMajor = false
                });
                this.layout.switchLayout('normal')
            } else {
                this.layout.panels.forEach(p => {
                    if (self.id !== p.id ) {
                        p.isMajor = false
                    } else {
                        p.isMajor = true
                    }
                });
                this.layout.switchLayout('fullscreen')
            }
        }
        setTimeout(function() {
            logger.info(`biggerOrsmaller streams fixSize`)
            self.streams.forEach(s => {
                // 等切换完了layout在fixsize
                s.autoFixSize();
            });
        }, 150)

    }
    showControlMenu() {
        const statusCtr = this.vidoeCtl;
        if (DomHelper.hasClass(statusCtr, 'show-sub')) {
            DomHelper.removeClass(statusCtr, 'show-sub');
        } else {
            DomHelper.addClass(statusCtr, 'show-sub');
        }
    }
    setStream(stream) {
        DomHelper.removeClass(this.vidoeCtl, `hidden`);
        stream.toggleFilter(this.video === 'off');
        this.stream = stream;
    }
    /**
     * 查找link流id
     */
    findStreamId() {
        const { controllerId, linkedUid } = this.member;

        return this.members.map(m => {
            if (m.uid == controllerId || m.uid == linkedUid) {
                return Number(m.streamId)
            }
        })
    }
    /**
     * 开启或则关闭声音
     */
    switchVoice() {
        const self = this;
        const dom = this.voicectl.querySelector('.voice_switch');
        let expect = ''
        if (DomHelper.hasClass(dom, 'unmuted')) {
            expect = 'muted'
        } else {
            expect = 'unmuted'
        }
        self.updataStatusNew(expect);

        let job = function(retry_chance) {
            if (retry_chance === 0) {
                logger.error(`retry fail`)
                let oldstate = (expect === "muted")?"unmuted":"muted";
                self.updataStatusNew(oldstate);
                return
            }
            logger.info(`job try retry_chance ${retry_chance}`)
            let task = []
            let needretry = false

            self.streamIds = self.findStreamId() || []

            // 添加task
            if (self.streams && self.stream && self.streams.length > 0 && self.type === 'tv') {
                self.streams.forEach(m => {
                    if (m && self.stream && (self.streamIds.indexOf(Number(m.streamId)) > -1)) {
                        logger.info(`switchVoice micStream ${m.streamId} ${expect}`)
                        const status = m.status;
                        task.push(m.setAudioStatusNew(expect))
                    }
                })
            }

            if (self.stream) {
                logger.info(`switchVoice me stream ${self.stream.streamId} ${expect}`)
                const status = self.stream.status;
                task.push(self.stream.setAudioStatusNew(expect))
            }

            Promise.all(task).then((res) => {
                logger.info(`switchVoice res: ${res}`)
                if (res.length > 0) {
                    for (var i = 0; i < res.length; i++) {
                        if (res[i] !== expect) {
                            needretry = true
                            logger.error(`switchVoice fail res: ${res}`)
                            break;
                        }
                    }
                } else {
                    needretry = false
                }
                if (needretry) {
                    job(retry_chance - 1)
                } else {
                    logger.info(`switchVoice(${expect}) success`)
                }
            }).catch((e) => {
                needretry = true
                job(retry_chance - 1)
                logger.error(`switchVoice fail ` + e)
            })
        } // end job define
        job(3)
    }

    updataStatusNew(expect) {
        const dom = this.voicectl.querySelector('.voice_switch');
        if (expect === 'muted') {
            DomHelper.removeClass(dom, 'unmuted');
            DomHelper.addClass(dom, 'muted');

        } else {
            DomHelper.removeClass(dom, 'muted');
            DomHelper.addClass(dom, 'unmuted');

        }

    }
    updateParent(parent) {
        this.parentChange = false;
        let ps = DomHelper.hasClass(parent, 'layout-thumbnail');
        let op = DomHelper.hasClass(this.parent, 'layout-thumbnail');
        // if (op !== ps) {
        this.parentChange = true;
        this.parent = parent;
        if (this.parent && typeof(this.parent.appendChild) === "function") {
            if(!this.isLocal) {
                this.parent.appendChild(this.dom);
            } else {
                this.parent.prepend(this.dom);
            }

        }
        if (this.stream) {
            this.stream.prarantNode = this.vidoeWrap;
            this.stream.fixed = false;
            this.stream.resetSize();
        }
            // this.updateExtraSize();
        // }
        return this;
    }
    html(html) {
        this.dom.innerHTML = html;
        return this;
    }
    destroy() {
        if (this.dom) {
            this.parent.removeChild(this.dom);
        }
    }
    show() {
        this.visble = true;
        DomHelper.removeClass(this.dom, 'hidden');
        return this;
    }
    hide() {
        this.visble = false;
        DomHelper.addClass(this.dom, 'hidden');
        return this;
    }
    rerender(parent) {
        this.parent = parent;
        this.render();
        // this.updateExtraSize();
        return this;
    }
    showSIPImg() {
        DomHelper.removeClass(this.sip, 'hidden')
        DomHelper.addClass(this.sip, 'sip-img')

        DomHelper.addClass(this.bigger, 'hidden')
    }
    hideSIPImg() {
        DomHelper.removeClass(this.sip, 'sip-img')
        DomHelper.addClass(this.sip, 'hidden')
    }
    setExtraHTML(html) {

        this.extra.innerHTML = html;

        this.layoutname.innerHTML = html
        return this;
    }
    // updateExtraSize() {
    //     const self = this;
    //     // setTimeout(function() {
    //     //     let w = self.extra.clientWidth;
    //     //     self.extra.style.left = `-${w}px`;
    //     // }, 100);
    //     return this;
    // }
    showTip(msg, type) {
        if (msg) {
            this.tip.innerHTML = msg;
        }
        DomHelper.removeClass(this.tip, 'error warn hidden');
        DomHelper.addClass(this.tip, type || 'error');
    }
    hideTip() {
        DomHelper.addClass(this.tip, 'hidden');
    }
}
