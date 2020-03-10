<template>
<div class="meeting-create">
    <title-bar style="top: 90px;" title="发起视频会议"
               :show-back="true" @back="cancel" :disable-back="isJoined"></title-bar>
    <div class="video-start text-center">
        <div @keydown.enter="checkScreenExist" class="create-meeting-normal">
            <input id="meeting-input-create" class="font-30" type="text" :disabled="isJoined" maxlength="30" :class="{error:error.screen_not_exist||error.empty_screen||error.screen_not_support||error.can_not_start}" v-model="screen" placeholder="输入屏幕代码">

            <div class="errors">
                <div v-show="error.screen_not_exist" class="error-tip">屏幕代码不存在，请重新输入</div>
                <div v-show="error.empty_screen" class="error-tip">请输入屏幕代码</div>
                <div v-show="error.screen_not_support" class="error-tip">该屏幕不支持视频会议</div>
                <div v-show="error.can_not_start" class="error-tip">当前屏幕占用中，请稍后发起会议</div>
                <div v-show="error.screen_status_wrong" class="error-tip">屏幕状态不正确</div>
                <div v-show="error.screenid_error" class="error-tip">请输入正确的屏幕代码</div>
            </div>

            <button class="button-gradient-1" v-on:click="checkScreenExist" :disabled="isJoined">
                <span v-show="!isJoined">开始发起</span>
                <span v-show="isJoined">正在发起...</span>
            </button>
        </div>

        <div v-if="isVip" id="vipmeetingDiv" class="create-meeting-vip">
            <div class="errors">
            </div>
            <button class="button-gradient-1" v-on:click="vipmeeting" :disabled="isJoined">
                <span v-show="!isJoined">直接发起</span>
                <span v-show="isJoined">正在发起...</span>
            </button>
        </div>
        <!-- <div style="margin-top:200px;clear:both;">
            <button v-on:click="cancel" class="btn font-20" v-bind:class="{ 'btn-transparent': !isJoined, 'btn-transparent-disabled': isJoined }" :disabled="isJoined">
                    <span>取消</span>
                    <span style="display: none;">X</span>
                </button>
        </div> -->
    </div>
</div>
</template>

<style lang="scss">
@import './MeetingCreate';
@import "../../../assets/scss/messagebox";
</style>

<script>
export {
    default
}
from './MeetingCreate'
</script>
