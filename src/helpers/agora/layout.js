import Panel from './panel';
import DomHelper from './domhelper';
import PhoneHelper from '../phoneHelper'
const electron = require('electron')
const remote = electron.remote
const ipc = electron.ipcRenderer
const logger = remote.require('./app/logger')

export default class Layout {
    constructor(opt) {
        this.panels = [];
        this.container = opt.container;
        this.mode = opt.mode || "slider";
        this.switchHandler = opt.switchHandler
        this.layout();
    }
    layout() {
        let self = this
        this.dom = document.createElement('div')
        DomHelper.addClass(this.dom, `layout-main layout-${this.mode}`)
        let virtScroller = document.createElement('div')
        DomHelper.addClass(virtScroller, 'virtual-scroller')
        let virtScrollerInsideDiv = document.createElement('div')
        virtScrollerInsideDiv.innerHTML = '&nbsp;'
        DomHelper.addClass(virtScrollerInsideDiv, 'virtual-scroller-inside-div')
        let mainview = document.createElement('div')
        DomHelper.addClass(mainview, 'layout-mainview')
        if (this.dom && typeof(this.dom.appendChild) === "function") {
            this.dom.appendChild(mainview)
            virtScroller.appendChild(virtScrollerInsideDiv);
            this.dom.appendChild(virtScroller)
        }

        let slider = document.createElement('div')
        DomHelper.addClass(slider, 'layout-thumbnail')

        let sliderContent = document.createElement('div')
        DomHelper.addClass(sliderContent, 'layout-thumbnail-content')
        slider.appendChild(sliderContent)

        let thumbnailCtl = document.createElement('div')
        DomHelper.addClass(thumbnailCtl, 'layout-thumbnail-ctl')
        let thumbnailInfo = document.createElement('div')
        DomHelper.addClass(thumbnailInfo, 'info')
        let thumbnailSwitch = this.thumbnailSwitch =  document.createElement('div')
        thumbnailSwitch.innerHTML = `
            <img src=""/>
        `;
        DomHelper.addClass(thumbnailSwitch, 'switch fold')
        DomHelper.addClass(sliderContent, 'show')

        thumbnailCtl.appendChild(thumbnailInfo)
        thumbnailCtl.appendChild(thumbnailSwitch)

        slider.appendChild(thumbnailCtl)

        if (this.dom && typeof(this.dom.appendChild) === "function") {
            this.dom.appendChild(slider)
        }

        if (this.container && typeof(this.container.appendChild) === "function") {
            this.container.appendChild(this.dom)
        }
        thumbnailSwitch.addEventListener(`click`, (e) => {
            self.foldOrUnfold(e);
        })
        return this;
    }
    showSwitch() {
        if (this.thumbnailSwitch) {
            DomHelper.removeClass(this.thumbnailSwitch, 'hidden')
        }
    }
    hideSwitch() {
        if (this.thumbnailSwitch) {
            DomHelper.addClass(this.thumbnailSwitch, 'hidden')
        }
    }
    foldOrUnfold(e) {
         let target = this.dom.querySelector('.switch')
         let content = this.dom.querySelector('.layout-thumbnail-content')
         if (DomHelper.hasClass(target, 'unfold')) {
             // 目前收起，需要展开
             DomHelper.removeClass(target, 'unfold');
             DomHelper.addClass(target, 'fold');

             DomHelper.removeClass(content, 'hide');
             DomHelper.addClass(content, 'show')
         } else {
             // 目前展开，需要收起
             DomHelper.removeClass(target, 'fold');
             DomHelper.addClass(target, 'unfold');

             DomHelper.removeClass(content, 'show');
             DomHelper.addClass(content, 'hide');
         }
    }
    addPanel(opt) {
        let panel = this.checkPanelExist(opt.id);
        if (!panel) {
            let pdom = this.dom.querySelector('.layout-mainview');
            if (this.mode === 'fullscreen' && (!opt || !opt.isMajor)) {
                pdom = this.dom.querySelector('.layout-thumbnail');
            }
            let option = opt || {
                parent: pdom
            };
            option.parent = pdom;
            option.layout = this
            option.id = opt.id;
            panel = new Panel(option);
            this.panels.push(panel);
            this.updateAttribute();
        }
        return panel;
    }
    checkPanelExist(streamId) {
        let panel;
        this.panels.forEach(p => {
            if (Number(p.oid) === Number(streamId)) {
                panel = p;
            }
        });
        return panel;
    }
    updateAttribute() {
        let vs = this.panels.filter(p => {
            return p.visble;
        });
        this.dom.setAttribute('data', vs.length.toString());
    }
    removePanel(panel) {
        let rid = panel.id;
        let ps = this.panels.filter(p => {
            return p.id != rid;
        });
        this.panels = ps;
        this.updateAttribute();
        return this;
    }
    getPanelByStreamId(id) {
        let rid = `panel-${id}`
        let rp;
        this.panels.forEach(p => {
            if (p.id === rid) {
                rp = p
            }
        });
        return rp
    }
    showPanelById(id) {
        let rid = `panel-${id}`
        let rp;
        this.panels.forEach(p => {
            if (p.id === rid) {
                rp = p
            }
        });
        if (rp) {
            rp.show()
        }
    }
    hidePanelById(id) {
        let rid = `panel-${id}`
        let rp;
        this.panels.forEach(p => {
            if (p.id === rid) {
                rp = p
            }
        });
        if (rp) {
            rp.hide()
        }
    }
    removePanelByOId(id) {
        let rid = `panel-${id}`;
        return this.removePanelById(rid);
    }
    removeTVByCtlId(id) {
        logger.info(`removeTVByCtlId`)
        let rp
        let ps = this.panels.filter(p => {
            if (Number(p.controllerStreamId) === Number(id)) {
                rp = p;
            }
            return Number(p.controllerStreamId) !=  Number(id);
        });
        if (rp) {
            rp.destroy();
        }
        this.panels = ps;
        return
    }
    // showTVByCtlId(id) {
    //     logger.info(`showTVByCtlId`)
    //
    //     this.panels.forEach(p => {
    //         if (Number(p.controllerStreamId) === Number(id)) {
    //             p.show()
    //         }
    //     });
    //
    //     return
    // }
    // findCtlStreamIdById(id) {
    //     let streamId = null
    //     this.panels.forEach(p => {
    //         if (p.uid == id) {
    //             streamId =  p.oid
    //         }
    //     });
    //     return streamId
    //
    // }
    findTVStreamIdByControllerId(id) {
        let streamId = null
        this.panels.forEach(p => {
            if (p.controllerId == id) {
                streamId =  p.oid
            }
        });
        return streamId

    }
    isTVController(id) {
        let result = false
        let tvControllerStreamIds = []
        this.panels.forEach((m, i) => {
            if (m.type == 'tv') {
                tvControllerStreamIds.push(Number(m.oid))
            }
        })
        if (tvControllerStreamIds.indexOf(Number(id)) >= 0) {
            result = true
        }
        return result
    }
    hideTVByCtlStreamId(id) {
        logger.info(`hideTVByCtlStreamId`)
        let streamId = this.findTVStreamIdByControllerId(id)
        if (streamId) {
            this.panels.forEach(p => {
                if (Number(p.oid) === Number(streamId)) {
                    p.hide()
                }
            });
        }
    }
    showTVByCtlStreamId(id) {
        logger.info(`showTVByCtlStreamId`)
        let streamId = this.findTVStreamIdByControllerId(id)
        if (streamId) {
            this.panels.forEach(p => {
                if (Number(p.oid) === Number(streamId)) {
                    p.show()
                }
            });
        }
    }
    removePanelById(id) {
        let rid = id;
        let rp;
        let ps = this.panels.filter(p => {
            if (p.id === rid) {
                rp = p;
            }
            return p.id != rid;
        });
        if (rp) {
            rp.destroy();
        }
        this.panels = ps;
        this.updateAttribute();
        return rp;
    }
    repaint() {
        this.container.innerHTML = '';
        this.layout().updateAttribute();
        let pdom = this.dom.querySelector('.layout-mainview');
        this.panels.forEach(p => {
            if (this.mode === 'slider' && !p.isMajor) {
                pdom = this.dom.querySelector('.layout-thumbnail');
            }
            else {
                pdom = this.dom.querySelector('.layout-mainview');
            }
            if (p.dom !== pdom) {
                console.log('panel rerender');
                p.rerender(pdom);
            }
        });
    }
    switchLayout(mode) {
        if (mode) {
            this.mode = mode;
        }
        // else {
        //     this.mode = this.mode === 'normal' ? 'fullscreen' : 'normal';
        // }
        logger.info(`switchLayout to:${mode}`)
        this.switchHandler(this.mode === 'fullscreen')
        let m = this.mode;

        let pdom = this.dom.querySelector('.layout-mainview')
        let thumb = this.dom.querySelector('.layout-thumbnail-content')

        DomHelper.removeClass(this.container, 'fullscreen normal')
        DomHelper.addClass(this.container, `${m}`)

        DomHelper.removeClass(this.dom, 'layout-normal layout-fullscreen')
        DomHelper.addClass(this.dom, `layout-${m}`)
        if (m === 'fullscreen') {
            let lastVisble = null
            let hasMajor = false
            this.panels.forEach(p => {
                let parent = pdom;
                if (p.visble) {
                    lastVisble = p
                }
                if (!p.isMajor && p.visble) {
                    parent = thumb;
                } else if (p.isMajor && p.visble){
                    parent = pdom
                    hasMajor = true
                }
                p.updateParent(parent);
            });
            if (!hasMajor) {
                lastVisble.updateParent(pdom);
            }
        }
        else {
            this.panels.forEach(p => {
                let parent = pdom;
                p.updateParent(parent);
            });
        }

        this.panels.forEach(p => {
            if (p.stream) {
                p.stream.show()
            }
        })
    }
    checkMajorByOId(oid) {
        let flag = false;
        let major = this.panels.find(p => {
            return p.oid = oid;
        });
        return !!major;
    }
    getMajor() {
        let major = this.panels.find(p => {
            return p.isMajor;
        });
        return major;
    }
    updateMajorByOId(id, isUser) {
        let rid = `panel-${id}`;
        if (isUser) {
            this.majorStreamId = id;
        }
        this.updateMajorById(rid, isUser);
    }
    updateMajorById(id, isUser) {
        let omajor;
        let nmajor;
        let list = [];
        this.panels.forEach(p => {
            if (p.isMajor) {
                omajor = p;
            }
            p.isMajor = false;
            p.isUserDo = false;
            if (id == p.id) {
                p.isMajor = true;
                p.isUserDo = !!isUser;
                nmajor = p;
            }
            else {
                list.push(p);
            }
        });

        // this.switchLayout(this.mode);
        // if (this.mode === 'fullscreen') {
        //     this.orderSlider(list);
        // }

        return this;
    }
    getUserDo() {
        let panel = this.panels.find(p => {
            return p.isUserDo;
        });
        return panel;
    }
    orderSlider(list) {
        let ps = list || [];
        ps.reverse();
        let thumb = this.dom.querySelector('.layout-thumbnail');
        ps.forEach(p => {
            if (thumb && typeof(thumb.appendChild) === "function") {
                thumb.appendChild(p.dom);
            }
        });
        return this;
    }
    sortByMeetingStore(store) {
        let members = store.sortMembers(this.majorStreamId);
        let map = {};
        let pmap = {};
        members.forEach((m, i) => {
            map[m.streamId] = i;
            pmap[m.streamId] = m;
        });
        this.panels.sort((a, b) => {
            return (map[a.oid] || 0) - (map[b.oid] || 0);
        });
        let major;
        this.panels.forEach(p => {
            let people = pmap[p.oid];
            if (!major && people && people.visble) {
                major = p;
            }
            if (people) {
                p.status = people.status;
                console.log(`get poeple ${people.uid} status: ${people.status}`);
            }
            if (people && people.visble) {
                p.show();
                // console.log('panel visble', JSON.stringify(people))
            }
            else {
                p.hide();
            }
        });
        // let ud = this.getUserDo()
        // if (!store.hasSharing() && ud) {
        //     major = ud
        // }
        //this.updateAttribute();
        //this.updateMajorById(major.id);
        return this;
    }
    updatePanelStatus(store) {
        let members = store.sortMembers()
        let map = {}
        let pmap = {}
        members.forEach((m, i) => {
            map[m.streamId] = i
            pmap[m.streamId] = m
        })
        this.panels.forEach(p => {
            let people = pmap[p.oid];
            if (people) {
                p.status = people.status;
                if (p.stream) {
                    p.stream.setUserStatus(p.status);
                }
                p.video = people.video;
                p.audio = people.audio;
            }
        });
        return this;
    }
    upateBackgroundByStore(store) {
        this.panels.forEach(p => {
            if(p.type === 'phone') {
                p.showSIPImg()
            } else {
                p.hideSIPImg()
            }

        });
    }
    upateExtraInfoByStore(store) {
        this.panels.forEach(p => {
            let s = store.getPeopleByStreamId(p.oid);
            if (s) {
                if (p.type === 'phone') {
                    PhoneHelper.getName(s.userName)
                    .then(name => {
                        p.setExtraHTML(name)
                    })
                    .catch(name => {
                        p.setExtraHTML(name)
                    })
                } else {
                    p.setExtraHTML(`${s.userName}`);
                }
                if (s.onlineStatus === 'waiting') {
                    p.showTip();
                }
                else {
                    p.hideTip();
                }
            }
        });
    }
    showPanelTip(msg, uid, store) {
        let poeple = store.getPeopleByUId(uid);
        if (poeple) {
            this.panels.forEach(p => {
                if (Number(p.oid) == Number(poeple.streamId)) {
                    p.showTip(msg);
                }
            });
        }
    }
    hidePanelTip(streamId) {
        this.panels.forEach(p => {
            if (Number(p.oid) === Number(streamId)) {
                p.hideTip();
            }
        });
    }

    syncPanelsByStore(store) {
        logger.debug(`syncPanelsByStore start ...`)
        let members = store.sortMembers(this.majorStreamId);
        let map = {};
        let pmap = {};
        let keeps = {};
        this.panels.forEach(p => {
            pmap[p.oid] = p;
            keeps[p.oid] = false;
        });
        let micStreamIds = {}
        let tvStreamIds = {}
        // 找到所有的mic 的mac地址
        members.forEach((m, i) => {
            if (m.isMicrophone()) {
                micStreamIds[m.uid] = m.streamId
            }
        })
        members.forEach((m, i) => {
            if (m.isTv()) {
                tvStreamIds[m.uid + ''] = m.streamId
            }
        })
        members.forEach((m, i) => {
            logger.debug(`m.role ${m.role}`)
            keeps[m.streamId] = true;
            const isShowCallEnd = m.type === 'phone' ?
                PhoneHelper.has(m.userName) :
                false

            let panel = pmap[m.streamId];
            if (!panel) {
                panel = this.addPanel({
                    member: m,
                    members: members,
                    id: m.streamId,
                    visable: true,
                    type: m.type,
                    isLocal: m.isLocal,
                    isShowCallEnd
                });
                panel.status = m.status;
            }
            else {
                if (panel.stream)
                    panel.stream.toggleFilter(m.video === 'off');
            }
            panel.type = m.type
            panel.video = m.video;
            panel.audio = m.video;
            // 将panel添加role，在panel.js中点击静音，同时静音tv和外接麦克风
            if (m.isMicrophone()) {
                panel.type = 'microphone'
            }
            if (m.isTv()) {
                panel.type = 'tv'
                panel.controllerId = m.controllerId
                panel.linkedUid = m.linkedUid
                // linkedUid 是 mac 地址，要找到对应的streamId
                panel.linkedStreamId = micStreamIds[m.linkedUid]
                panel.controllerStreamId = tvStreamIds[m.controllerId + '']
            }
            if (m.isCreator()){
                panel.role = 'creator';
            }
        });
        this.panels.forEach(p => {
            if (!keeps[p.oid]) {
                this.removePanelByOId(p.oid);
            }
        });
        this.panels.forEach(p => {
            // JSON 会报错
            logger.info(`panel role:${p.role} oid:${p.oid}`)
        });
        this.updateAttribute();
    }
}
