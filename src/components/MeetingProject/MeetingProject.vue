<template>
    <div class="projet-wrap">
        <accessorial-title-bar type="projector">
            <!-- 现目前这个需求还未实现，调研中 -->
            <div v-if="false" slot="right" class="speakerTargetDiv">
                <div>扬声器：</div>
                <div>
                    <input id="MPATBR_rtv" type="radio" value="tv" v-model="speakerTarget">
                    <label for="MPATBR_rtv">电视机</label>
                </div>
                <div style="margin-left: 8px;">
                    <input id="MPATBR_rmac" type="radio" value="mac" v-model="speakerTarget">
                    <label for="MPATBR_rmac">电脑</label>
                </div>
            </div>
        </accessorial-title-bar>
        <div
            id="agora-projector"
            class="projector agora-projector"
            @keydown.enter="startBtnClicked"
            v-show="!janusProjecting"
        >
            <div class="startPage text-center" v-show="!isSharing ">
                <title-bar
                    style="top: 90px;"
                    :title="prefix+'云投影'"
                    :show-back="true"
                    @back="cancel"
                    :disable-back="cancelDisabled"
                ></title-bar>
                <!--<p class="font-30 startPage-title">-->
                <!--    <span class="back" @click.prevent="cancel" :disabled="cancelDisabled"></span>-->
                <!--    云投影-->
                <!--</p>-->
                <div class="screen-code-form">
                    <div>
                        <div>
                            <input
                                id="meeting-input-project"
                                class="screen-code-input font-30"
                                type="text"
                                maxlength="30"
                                :disabled="startBtnDisabled"
                                :class="{error:error.screen_not_exist||error.empty_screen}"
                                v-model="screenId"
                                placeholder="输入屏幕代码"
                                v-on:focus="clearError"
                            >
                        </div>
                        <!-- 错误信息 -->
                        <div class="errors">
                            <div class="error-item" v-show="error.screen_not_exist">屏幕代码不存在，请重新输入</div>
                            <div class="error-item" v-show="error.empty_screen">请输入屏幕代码</div>
                            <div class="error-item" v-show="error.screenid_error">请输入正确的屏幕代码</div>
                        </div>
                        <div>
                            <button
                                class="button-gradient-1"
                                @click.prevent="startBtnClicked"
                                :disabled="startBtnDisabled"
                            >
                                <span v-show="!startBtnDisabled">发起投影</span>
                                <span v-show="startBtnDisabled">发起投影中...</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-show="isSharing" class="stopPage">
                <title-bar
                    style="position: static;"
                    title="云投影"
                    :show-close="true"
                    @close="stopSharingScreen"
                    :disable-close="cancelDisabled"
                ></title-bar>
                <!-- <h5 class="stopPage-title font-30">屏幕代码：{{screenId}}</h5> -->
                <div class="stopPage-video">
                    <video autoplay id="video-thumbnail" src></video>
                    <div id="m-projectors-con" class="video-con"></div>
                    <div class="font14px" style="text-align: center; margin-top: 30px;">正在投影中…</div>
                </div>

                <div class="btns">
                    <button
                        class="button-gradient-2 cancel-btn change-page"
                        @click.prevent="changeSharingScreen"
                    >切换窗口</button>
                </div>

                <!--<button @click.prevent="stopSharingScreen" class="btn font-20" v-bind:class="{ 'btn-transparent': !cancelDisabled, 'btn-transparent-disabled': cancelDisabled }" :disabled="cancelDisabled">-->
                <!--<span>停止</span>-->
                <!--<span style="display: none;">X</span>-->
                <!--</button>-->
                <div class="share-help">
                    <span class="font-20">投影出现不流畅了？</span>
                    <span
                        class="font-20"
                        @click.prevent="switchshowHelp(true)"
                        style="fon#2B64F0"
                    >点击这里获取帮助</span>
                </div>
            </div>

            <div class="showHelpPage" v-show="showHelpPage">
                <div class="title">
                    建议按照以下方法检查投影不流畅的问题
                    <span
                        class="title-close"
                        @click.prevent="switchshowHelp(false)"
                    >
                        <img class="item-icon" src="~assets/img/close-black.png">
                    </span>
                </div>
                <div class="help-tips">
                    <div
                        class="help-tip"
                    >1、电脑CPU占用率过高，会导致投影不流畅，建议检查电脑CPU占用率，如果出现占用率超过85%以上，建议关闭部分软件降低占用率再进行投影；</div>
                    <div class="help-tip">
                        2、Windows 7或者Windows Vista系统电脑建议关闭Aero桌面特效，可以提升一定的流畅度：（备注：关闭Aero桌面特效并不影响电脑正常使用，
                        <span
                            class="help-blue"
                            @click.prevent="closeAero"
                        >点我关闭Aero桌面特效</span>）
                    </div>
                    <div class="help-tip">3、网络连接不稳定会导致投影不流畅情况发生，建议联系场地运营人员协助处理。</div>
                </div>
            </div>

            <div class="popup" v-show="showWindowSeletor">
                <div class="popup-wrap">
                    <div class="selectWindowTitle">
                        <span class="font14px bold">选择你要共享的窗口</span>
                    </div>
                    <div class="window-list scroll">
                        <div
                            class="win-item"
                            v-for="w in windows"
                            :key="w.id"
                            @click="selectWindow(w)"
                            :class="{selected:w.id==selectedWindow.id}"
                        >
                            <div class="name">{{w.title}}</div>
                            <div class="thumbnail">
                                <img :src="w.img">
                            </div>
                        </div>
                    </div>
                    <div class="btns">
                        <button
                            class="button-gradient-2 cancel-btn"
                            @click.prevent="cancelWindow"
                            :disabled="isconfirmWindow && cancelDisabled"
                        >取消</button>
                        <button
                            class="button-gradient-1 confirm-btn"
                            @click.prevent="confirmWindow"
                            :disabled="isconfirmWindow && cancelDisabled"
                        >
                            <span v-show="isconfirmWindow">投影中</span>
                            <span v-show="!isconfirmWindow">确认</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <janusprojector
            :isAgora="!janusProjecting"
            :selectWindowId="selectWinId"
            :roomId="screenId"
            :startProject="janusProjecting"
            @cancel="stopSharingScreen"
            v-show="janusProjecting"
        ></janusprojector>
        <div
            class="mt-notifiction animated"
            v-show="notifiction.message"
            :class="{'fadeInLeft':notifiction.type==='info', 'fadeInLeft error':notifiction.type==='error', 'fadeOutLeft':!notifiction.type}"
        >{{notifiction.message}}</div>
    </div>
</template>
<style lang="scss">
@import './MeetingProject';
@import '../../assets/scss/messagebox';
</style>
<script>
export { default } from './MeetingProject'
</script>
