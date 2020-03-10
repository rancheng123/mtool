<template>
    <div class="meeting-join">
        <div class="video-start text-center" @keydown.enter="checkRoom" >
            <title-bar style="top: 90px;" title="加入视频会议"
                    :show-back="true" @back="cancel" :disable-back="false"></title-bar>
            <div class="join-form">
                <input id="meeting-input-join" class="screen-code-input font-30" type="text" maxlength="30" :class="{error:error.room_not_exist||error.empty_room||error.room_is_full}" v-model="room" placeholder="输入屏幕代码">

                <div class="errors">
                    <div v-show="error.room_not_exist" class="error-tip">会议不存在，请重新输入</div>
                    <div v-show="error.empty_room" class="error-tip">请输入正确屏幕代码</div>
                    <div v-show="error.room_is_full" class="error-tip">会议人数已满</div>
                    <div v-show="error.screenid_error" class="error-tip">请输入正确的屏幕代码</div>
                </div>
                
                <button class="button-gradient-1"
                    :disabled="isJoinedState"
                    @click="checkRoom">
                    <span v-show="!isJoinedState">加入会议</span>
                    <span v-show="isJoinedState">正在加入...</span>
                </button>
            </div>
            <!-- <div style="margin-top:150px;clear:both;">
                <button v-on:click="cancel" class="btn btn-transparent font-20">
                    <span>取消</span>
                    <span style="display: none;">X</span>
                </button>
            </div> -->
        </div>
    </div>
</template>

<style lang="scss">
@import './MeetingJoin';
</style>

<script>
export { default } from './MeetingJoin'
</script>
