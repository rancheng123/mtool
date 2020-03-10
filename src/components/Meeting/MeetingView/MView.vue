<template>
    <div id="meeting-view-con" class="view-con" v-bind:class="{'creator': isCreator, 'joiner': !isCreator,'sharing': isSharingScreen,'showjoin':showJoinRoonTip,'fullscreen': isFullscreenMode, 'normal': !isFullscreenMode}" v-on:mouseenter="showHeader" v-on:mouseleave="hideHeader">
        <el-popover popper-class="mt-popup" ref="addscreen" placement="top" width="320" trigger="click" @hide="onPoperHide" @show="onPoperShow">
            <div class="errors">
                <div v-show="error.screen_not_exist" class="error-tip">屏幕代码不存在，请重新输入</div>
                <div v-show="error.empty_screen" class="error-tip">请输入屏幕代码</div>
                <div v-show="error.screen_not_support" class="error-tip">该屏幕不支持视频会议</div>
                <div v-show="error.room_is_full" class="error-tip">会议人数已满，无法操作</div>
                <div v-show="error.room_not_exist" class="error-tip">会议已关闭</div>
                <div v-show="error.can_not_start" class="error-tip">屏幕占用中，请稍后重试</div>
                <div v-show="error.screenid_error" class="error-tip">请输入正确的屏幕代码</div>
            </div>
            <div class="invite-screen" @keydown.enter="checkRoomIsFull">
                <input
                    id="screenInviteInput"
                    class="font-26"
                    type="text"
                    maxlength="30"
                    v-on:focus="resetError"
                    :disabled="linkingTV"
                    :class="{error:error.screen_not_exist||error.room_is_full||error.empty_screen||error.screen_not_support||error.room_not_exist||error.can_not_start}"
                    v-model="inviteScreen"
                    placeholder="输入会议室屏幕代码"
                >
                <button class="confirm font-26" v-on:click="checkRoomIsFull" :disabled="linkingTV"><span v-show="!linkingTV">连接</span><span v-show="linkingTV">连接中...</span></button>
            </div>
        </el-popover>
        <div class="control-button" :class="{'poper-show':invitePopoverShow}" v-show="isShowHeader">
            <div class="action-btn" v-bind:class="{disabled:isMutedAudio, holdOn: isInitialing}" @click="toggleAudio">
    
                <span class="filtebg"></span>
                <img src="~assets/newimg/new-icon-voice-highlight.png" class="normal_icon">
                <img src="~assets/newimg/new-icon-voice.png" class="disabled_icon">
    
                <div class="btn-tip">
                    <div>
                        <span v-show="!isMutedAudio">禁用麦克风</span>
                        <span v-show="isMutedAudio">开启麦克风</span>
                    </div>
                    <div class="device-switch" v-if="isCreator">
                        <div class="switch-wrap">
                            <div class="arrow"></div>
                            <div class="switchers">
                                <div class="switch-row">
                                    <div class="device-label">开关: </div>
                                    <div class="device">
                                        <div class="toggle-btn" :class="{active: !isMutedAudio}" @click="toggleAudio">
                                            <span class="toggle-btn-handler" :class="{active: !isMutedAudio}"></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="switch-row">
                                    <div class="device-label">麦克风: </div>
                                    <div class="device" v-on:click="switchDevice('mic', true)" :class="{active: screenStatus.mic, muted: isMutedAudio, active_muted: screenStatus.mic && isMutedAudio}">
                                        <span class="radio-btn" :style="isMutedAudio ? {} : {cursor: 'pointer'}"></span>
                                        电视机
                                    </div>
                                    <div class="device" v-on:click="switchDevice('mic', false)" :class="{active: !screenStatus.mic, muted: isMutedAudio, active_muted: !screenStatus.mic && isMutedAudio}">
                                        <span class="radio-btn" :style="isMutedAudio ? {} : {cursor: 'pointer'}"></span>
                                        电脑
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="action-btn camera-icon" v-bind:class="{disabled:isMutedVideo, holdOn: isInitialing}" v-on:click="toggleVideo">
                <div class="filtebg"></div>
                <img src="~assets/newimg/new-icon-camera-highlight.png" class="normal_icon">
                <img src="~assets/newimg/new-icon-camera.png" class="disabled_icon">
                <div class="btn-tip">
                    <!-- <span v-show="isSharingScreen && !isShareMutedVide">关闭摄像头</span>
                    <span v-show="isSharingScreen && isShareMutedVideo">开启摄像头</span> -->
                    <span v-show="!isMutedVideo">关闭摄像头</span>
                    <span v-show="isMutedVideo">开启摄像头</span>
                </div>
            </div>
            <div class="action-btn invite-icon" v-bind:class="{disabled:isCreator, holdOn: isInitialing}" v-on:click="changeShowMode">
                <div class="filtebg"></div>
                <img src="~assets/newimg/new-icon-tvmode-highlight.png" class="disabled_icon">
                <img src="~assets/newimg/new-icon-tvmode.png" class="normal_icon">
    
                <button v-popover:addscreen></button>
                <div class="btn-tip">
                    <span v-show="!isCreator">连接电视</span>
                    <span v-show="isCreator">回到电脑</span>
                </div>
            </div>
            <div class="action-btn share-icon" v-bind:class="{disabled:isSharingScreen, holdOn: isInitialing}" v-on:click="shareScreen">
                <div class="filtebg"></div>
                <img src="~assets/newimg/new-icon-sharescreen-highlight.png" class="disabled_icon">
                <img src="~assets/newimg/new-icon-sharescreen.png" class="normal_icon">
    
                <div class="btn-tip">
                    <span v-show="!isSharingScreen">分享屏幕</span>
                    <span v-show="isSharingScreen">停止分享</span>
                </div>
            </div>
            <div class="action-btn leave-btn" v-on:click="leave">
                <div class="filtebg"></div>
                <img src="~assets/newimg/new-icon-leave-highlight.png">
                <div class="btn-tip">
                    <span>退出会议</span>
                </div>
            </div>
        </div>
        <!-- <div class="control-screen text-center"> -->
            <!-- <p class="control-screen-num font-50" v-show="isCreator && !isSharingScreen">{{room}}</p>
            <p class="control-screen-title font-26" v-show="isCreator && !isSharingScreen">参会者输入上方屏幕代码即可加入本次会议</p>
     -->
    
            <!-- <div v-show="isSharingScreen" class="sharing-tip">
                <div class="sharing-content">
                    <video autoplay id='video-thumbnail' src=""> </video>
                    <h2>屏幕分享中</h2>
                </div>
            </div> -->
            <!-- <div class="control-screen-right" style="display:none">
                <div class="laptop-wrapper">
                    <p class="font-15">{{room}}</p>
                    <img class="laptop" src="~assets/img/icn_laptop.png">
                </div>
                <div class="addfriend" style="display:none">
                    <img src="~assets/img/add_friend_icon.png">
                </div>
                <div class="addfriend" style="display:none">
                    <img src="~assets/img/add_friend_icon.png">
                </div>
            </div> -->
        <!-- </div> -->
        <view-component v-if="!isCreator && !isSharingScreen" :class="{sharing: isSharingScreen, isFullscreenMode: isFullscreenMode}"/>

        <tv-share v-if="isCreator || isSharingScreen" :agoraClient="agoraClient" :isCreator="isCreator" :isSharingScreen="isSharingScreen" :room="room" />
        <!-- <div id="video-call-con" class="video-view sharing-mode " :class="{sharing: isSharingScreen, isFullscreenMode: isFullscreenMode}">
    
        </div> -->
    
        <div class="screen_room_info" v-show="isFullscreenMode">
            <div>屏幕代码<br>{{room}}</div>
        </div>
        <div class="screen_status_info" v-show="!isFullscreenMode">
            <div class="room allow-user-select" v-show="!isCreator">参会者输入屏幕代码即可加入本次会议 <span class="allow-user-select">{{room}}</span></div>
            <div class="room allow-user-select" v-show="isCreator">正在控制屏幕：<span class="allow-user-select">{{inviteScreen || screen}}</span></div>
        </div>
        <div class="room-status" v-show="!isFullscreenMode">
            <div class="room"><img src="~assets/newimg/new-icon-meeting-logo.png"/>{{storeGetMemberCount}}人参会</div>
            <!-- <div class="room" v-show="!isCreator">屏幕代码：{{room}}</div>
            <div class="room" v-show="isCreator">正在控制屏幕：{{inviteScreen||screen}}</div> -->
        </div>
        <div class="time" :class="{isFullscreenMode: isFullscreenMode}">{{time.label}}</div>
        <div class="user-invitor" :class="{isFullscreenMode: isFullscreenMode}">
            <div class="trigger"  @click="toggleTrigger"><img src="~assets/newimg/new-icon-add.png"/>添加参会者</div>
            <div class="triggers" v-show="isShowInviteMenu">
                <div class="trigger-arrow"></div>
                <div class="trigger-menu"  @click="showInviteLinkPanel"><img src="~assets/newimg/new-icon-link.png"/>分享链接</div>
                <div class="trigger-menu"  @click="showSIPPanel" v-show="isSIPUser"><img src="~assets/newimg/new-icon-sip.png"/>拨打电话</div>
            </div>
            <!-- 拨打电话新手引导 -->
            <div class="novice-guidance" v-if="!hasReadGuide">
                <div class="novice-guidance-wrap">
                    <div class="novice-guidance-btn" @click="handleReadGuide"></div>
                </div>
                
            </div>
        </div>
        <div
            class="mt-notifiction animated"
            v-show="notifiction.message"
            :class="{'fadeInLeft':notifiction.type==='info', 'fadeInLeft error':notifiction.type==='error', 'fadeOutLeft':!notifiction.type}">
            {{notifiction.message}}
        </div>

        <!-- 通过电话邀请参与人 -->
        <call-phone
            :show="showSIP"
            @closeSip="closeSip"
            @sipCall="sipCall"
        />
    
        <!-- 通过邮箱或者连接邀请参会者 -->
        <invite-modal
            v-if="showInviteLink"
            @closeInviteLink="closeInviteLink"
            :room="room"
        />
    </div>
</template>

<style lang="scss">
@import "./MeetingView";
</style>

<script lang="ts" src="./MView.ts"></script>
