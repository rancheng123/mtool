<template>
    <div class="tv-share">
        <div class="tv-share-content">
            <video autoplay="autoplay" class="tv-share-video" id="tv-share-video" v-show="isSharingScreen" muted></video>
            <h2  v-show="isSharingScreen">屏幕分享中</h2>
            <p class="control-screen-num allow-user-select font-50" v-show="isCreator && !isSharingScreen">{{room}}</p>
            <p class="control-screen-title font-26" v-show="isCreator && !isSharingScreen">参会者输入上方屏幕代码即可加入本次会议</p>
        </div>
        <div class="tv-share-panle">
            <div class="tv-share-panle-wrap">
                <panle
                    v-for="(item, index) in members"
                    :key="item.uid"
                    :userInfo="item"
                    v-show="item && item.visble && !isLocal(item)"
                    :index="index"
                    width="87.5px"
                    height="122px"
                    :isCreator="isCreator"
                    :isSharingScreen="isSharingScreen"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Getter, State } from 'vuex-class'
import { mapState } from 'vuex'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import VirtualScroller from '../VirtualScroller/index.vue'
import {
    capture
} from '../../../helpers/agora/chrome'
import Panle from './Panle.vue'
const electron = require('electron')
const remote = electron.remote
const logger = remote.require('./app/logger')

@Component({
    components: {
        Panle
    }
})
export default class Test extends Vue {
    @Prop() room: string | number
    @Prop() isSharingScreen: boolean
    @Prop() isCreator: boolean
    @Prop() agoraClient: any
    @Getter('meeting/getLocal') storeLocal: any
    @Getter('meeting/members') members: any

    isLocal(item) {
        const { storeLocal } = this
        return `${storeLocal.uid}` === `${item.uid}`
    }

    @Watch('isSharingScreen')
    watchIsSharingScreen(n, o) {
        if (n) {
            this.selectWindowToShare()
        }
    }

    mounted() {
        if (this.isSharingScreen) {
            this.selectWindowToShare()
        }
    }

    selectWindowToShare() {
        // return capture.getWindows().then((wins) => {
        //     logger.info(`Step: meeting 分享屏幕 agoraClient.startShareScreen() in capture.getWindows callback`)
        //     let op: any = {
        //         audio: false,
        //         video: {
        //             mandatory: {
        //                 chromeMediaSource: 'desktop',
        //                 chromeMediaSourceId: wins[0].id,
        //                 minWidth: 1280,
        //                 maxWidth: 1920,
        //                 minHeight: 720,
        //                 maxHeight: 1080
        //             }
        //         }
        //     }

        //     let success = function(stream) {
        //         const ele: any = document.querySelector('#tv-share-video')
        //         const g: any = global
        //         ele.src = g.URL.createObjectURL(stream)
        //     }
        //     let error = function(e) {
        //         logger.error(e)
        //     }

        //     navigator.getUserMedia(op, success, error)
        // }, (error) => {
        //     logger.error(`capture get windows error: ${error}`)
        // })

        const self: any = this
        logger.info(`Step: meeting 分享屏幕 sharingProcessing`)

        this.agoraClient.startShareScreen().then((stream) => {
            const ele: any = document.querySelector('#tv-share-video')
            const g: any = global
            ele.src = g.URL.createObjectURL(stream.stream)
        }).catch((err) => {
            logger.error(`start share screen error: ${err}`)
        })
    }
}
</script>

<style lang="scss">
.tv-share {
    position: absolute;
    top: 70px;
    color: #fff;
    bottom: 80px;
    left: 0;
    right: 0;

    &-content {
        text-align: center;
        margin-top: 5vh;
        h2 {
            font-size: 14px;
            color: #fff;
        }
    }

    &-video {
        width: 240px;
        height: 150px;
    }

    &-panle {
        position: absolute;
        bottom: 0px;
        width: 100%;
        

        &-wrap {
            display: flex;
            justify-content: center;
        }
    }

    .control-screen-num {
        margin: 18vh auto 0;
        width: 120px;
        height: 50px;
        line-height: 50px;
        background: #656570;
    }

    .control-screen-title {
        margin: 30px auto 4vh;
        max-width: 60%;
    }

    .video-stream.muted-video {
        .video-wrap {
            opacity: 0;
        }
    }

    .layout-panel {
        overflow: hidden;
        border-radius: 2px;
        position: relative;
        float: left;
        margin: 0 5px;


        &:hover .layout-menu-bar {
            display: block;
        }

        .layout-name {
            display: none;
        }

        .layout-wrap {
            background-color: #343443;
            width: 87.5px;
            height: 87.5px;
            position: relative;
            background-image: url('~assets/newimg/new-icon-logo-in-panel.png');
            background-repeat: no-repeat;
            background-position: center;
            background-size: 50.2px 65.1px;
            overflow: hidden;
            top: 0;
            left: 0;

            .sip-img {
                width: 100%;
                height: 100%;
                background: #343443;
                img {
                    position: absolute;
                    top: 23px;
                    left: 33px;
                    width: 20px;
                    height: 20px;
                    content: url("~assets/newimg/new-icon-sip-big.png");
                    &.endcall-no {
                        top: 37px;
                    }
                }
                .tip {
                    display: none;
                }
                .endcall {
                    font-family: PingFangTC-Medium;
                    font-size: 12px;
                    position: absolute;
                    height: 25px;
                    width: 100%;
                    top: initial;
                    left: initial;
                    bottom: 0;
                    background: #3B3B42;
                    border-radius: 0;
                    color: #FFFFFF;
                    text-align: center;
                    line-height: 25px;
                    letter-spacing: 0.3px;
                    text-shadow: 0 1px 1px #000000;

                    &:hover {
                        background-image: linear-gradient(-180deg, #F5515F 0%, #9F041B 100%);
                        cursor: pointer;
                    }
                }
            }
        }

        .layout-menu-bar {
            display: none;
            background: transparent;
            text-align: center;
            width: 87.5px;
            color: #FFFFFF;
            position: absolute;
            bottom: 0;
            height: 35px;
            line-height: 35px;

            .layout-extra {
                font-size: 12px;
            }
        }
    }
}
</style>
