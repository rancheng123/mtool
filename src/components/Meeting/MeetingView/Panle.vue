<template>
    <div :id="'panel-' + streamId" :ref="'panel-' + streamId" class="layout-panel" :style="{'width': width, 'height': height}">
        <div class="layout-menu-bar">
            <div class="layout-extra">
                <span>{{userName}}</span>
            </div>
            <div class="layout-endcall" v-if="isFullscreenMode && isPhone && isCaller" @click="handleEndcall">
                挂断
            </div>
            <div class="layout-voice" :class="{'hidden': isLocal}" v-if="stream">
                <div
                    class="voice_switch"
                    @click="handleVoiceSwitch"
                    :class="{'unmuted': stream.status.audio, 'muted': !stream.status.audio}"
                    rel="voice_switch"
                >
                    <img src="">
                </div>
            </div>
            <div class="layout-voice-decibel" :style="decibelStyle"></div>
        </div>
        <div class="layout-name">{{userName}}</div>
        <div class="layout-tip" v-show="userInfo.isPoorNetwork">{{showLocalErr ? '网络不稳定' : '对方网络不稳定'}}</div>
        <div :id="'video-' + streamId" class="layout-wrap" ref="layoutWrap">
            <div v-if="isPhone" class="sip-img">
                <img class="" src="" :class="{'endcall-no': !isCaller}">
                <span class="tip" :class="{'tip-endcall-no': !isCaller}">电话接入</span>
                <div class="endcall" v-show="isCaller" @click="handleEndcall">挂断</div>
            </div>
            <div :id="streamId" class="video-stream meeting" ref="videoStream" :class="{'muted-video': userInfo.video === 'off'}">
                <stream
                    v-if="stream"
                    :key="stream.stream.getId()"
                    :stream="stream"
                    :index="index"
                    :userInfo="userInfo"
                    :userState="userState"
                    @updateDecibel="updateDecibel"
                />
            </div>
            <div class="layout-bigger" v-show="!isPhone" @click="handleFullScreen">
                <img src="">
            </div>
            <div class=""></div>
        </div>
    </div>
</template>

<script lang="ts">
import { Getter, State, Mutation } from 'vuex-class'
import { mapState } from 'vuex'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
const electron = require('electron')
const remote = electron.remote
const logger = remote.require('./app/logger')
import Stream from './Stream.vue'
import PhoneHelper from '../../../helpers/phoneHelper'
import { findStreamId, isLocal } from './helpers'
import AudioAnalyserEmitter from './AudioAnalyserEmitter'

@Component({
    components: {
        Stream
    }
})
export default class Panle extends Vue {
    @Getter('isFullscreenMode') isFullscreenMode: boolean
    @Getter('stream/streams') streams: any
    @Getter('meeting/members') members: any
    @Getter('meeting/getLocal') storeGetLocal: any
    @Mutation('meeting/updateMajorByUId') storeUpdateMajorByUId: any
    @Mutation('toFullscreenMode') storeToFullscreenMode: any
    @Mutation('toNormalMode') storeToNormalMode: any
    @Mutation('stream/setAudioStatus') storeSetAudioStatus: any
    @Getter('meeting/major') storeGetMajor: any
    @Prop({default: '175'}) width: number
    @Prop({default: '210'}) height: number
    @Prop() userInfo: any
    @Prop() index: number
    @Prop({default: false}) isCreator: boolean
    @Prop({default: false}) isSharingScreen: boolean

    userName: string = ''
    decibel: number = 0

    get userState() {
        return {
            state: this.userInfo.status
        }
    }

    get stream() {
        return this.streams ? this.streams[this.userInfo.streamId] : undefined
    }

    get streamId() {
        return `${this.userInfo.streamId}`
    }

    get isCaller() {
        return this.isPhone ? PhoneHelper.has(this.userInfo.userName) : false
    }

    get isPhone() {
        return this.userInfo.type === 'phone'
    }

    get isTv() {
        return this.userInfo.type === 'tv'
    }

    get isLocal() {
        const { userInfo, storeGetLocal } = this
        return `${userInfo.uid}` === `${storeGetLocal.uid}`
    }

    get showLocalErr() {
        const { userInfo, storeGetLocal } = this
        return this.isLocal || this.isTv && `${userInfo.controllerId}` === `${storeGetLocal.uid}`
    }

    decibelStyleBaseStr: string = 'opacity: 1; -webkit-mask: linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,1) {percent}%, rgba(0,0,0,0) {percent}%) 0 0 no-repeat'

    get decibelStyle() {
        let decimal = Math.sin(this.decibel * Math.PI / 388)
        let percent = parseInt((decimal * 100).toString())

        let valObj = {
            percent
        }

        return this.decibelStyleBaseStr.replace(/{(\w+)}/g, (a, b) => {
            return valObj[b]
        })
    }

    updateDecibel(decibel) {
        this.decibel = decibel
    }

    handleFullScreen() {
        if (!this.storeGetMajor ||
            this.storeGetMajor.streamId !== this.userInfo.streamId
        ) {
            const { uid } = this.userInfo
            this.storeUpdateMajorByUId(uid)
            this.storeToFullscreenMode()
        } else {
            const { uid } = this.userInfo
            this.storeToNormalMode()
            this.storeUpdateMajorByUId(null)
        }
    }

    handleEndcall() {
        let self = this
        logger.info(`#################panel endcall() self.oid:${this.userInfo.userName}`)
        // eslint-disable-next-line
        let evt: any = new CustomEvent('endcall')
        evt.phoneId = this.userInfo.userName
        window.dispatchEvent(evt)
    }

    handleVoiceSwitch(e) {
        const streamIds = findStreamId(this.members, this.userInfo)
        let expect = false
        if (e.currentTarget.classList.contains('unmuted')) {
            expect = false
        } else {
            expect = true
        }
        const keys = Object.keys(this.streams)
        if (this.streams && this.stream && keys.length > 0 && this.isTv) {
            keys.forEach(i => {
                const m = this.streams[i]
                if (m && this.stream && (streamIds.indexOf(Number(m.streamId)) > -1)) {
                    logger.info(`switchVoice micStream ${m.streamId} ${expect}`)
                    const status = m.status
                    this.storeSetAudioStatus({ streamId: m.streamId, flag: expect })
                }
            })
        }
        if (this.stream) {
            logger.info(`switchVoice me stream ${this.stream.streamId} ${expect}`)
            const status = this.stream.status
            this.storeSetAudioStatus({ streamId: this.stream.streamId, flag: expect })
        }
    }

    mounted() {
        const { userName } = this.userInfo
        if (this.isPhone) {
            PhoneHelper.getName(userName).then((name) => {
                this.userName = name
            })
        } else {
            this.userName = userName
        }

        /**
         * 麦克风音频流人肉关联
         */
        AudioAnalyserEmitter.$on('updateDecibel_' + this.streamId, this.updateDecibel)
    }

    destroyed() {
        AudioAnalyserEmitter.$off('updateDecibel_' + this.streamId, this.updateDecibel)
    }
}
</script>

<style lang="scss">
.video-view, .tv-share {
    .layout-tip {
        position: absolute;
        z-index: 3;
        bottom: 34px;
        background-color: rgba(160, 14, 14, .5);
        width: 100%;
        text-align: center;
        line-height: 25px;
        font-size: 12px;
        color: #fff;
    }

    &.isFullscreenMode .layout-mainview .layout-tip {
        top: 0;
        bottom: initial;
        line-height: 30px;
    }

    &.isFullscreenMode .layout-thumbnail .layout-tip {
        bottom: 25px;
    }

    .major {
        .layout-wrap {
            background-color: #5D5D68 !important;
            background-image: url('~assets/newimg/new-icon-logo.png') !important;
        }
    }
}

.panle-wrap {
    float: left;
    width: 175px;
    height: 175px;
    overflow: hidden;
    background: red;
}
.video-stream.meeting {
    width: 100%;
    height: 100%;
}
.panle {
    width: 312px;
    height: 175px;
    margin: 0px 0px 0px -68.5px;
}

.layout-voice-decibel{
    background-image: linear-gradient(90deg, #5AFFB4 0%, #f78005 100%);
    bottom: 0;
    height: 1px;
    position: absolute;
    z-index: 9999;
    width: 100%;
    transition: all .1s linear;
}
.layout-fullscreen .layout-voice-decibel{
    display: none;
}
.tv-share .layout-voice-decibel{
    display: none;
}
</style>


