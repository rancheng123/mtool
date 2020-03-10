<template>
    <div id="meeting" class="content-position meeting-con">
        <accessorial-title-bar type="meeting"></accessorial-title-bar>
        <div class="choose-meeting text-center" v-show="showType==''">
            <title-bar style="top: 90px;" title="选择会议类型"
                       :show-back="true" @back="toHome" :disable-back="false"></title-bar>
            <div class="choose-meeting-menu">
                <div class="main-menu-item" @click.prevent="create" v-if="!isGuest">
                    <div class="menu-wrap">
                        <img class="item-icon" src="~assets/newimg/choose_icon_1_blue.png">
                        <p class="item-title font-30">发起会议</p>
                    </div>
                </div>
                <div class="main-menu-item" @click.prevent="join">
                    <div class="menu-wrap">
                        <img class="item-icon" src="~assets/newimg/choose_icon_2_blue.png">
                        <p class="item-title font-30">加入会议</p>
                    </div>
                </div>
            </div>
        </div>
        <div v-show="showType=='projector'">
            <div>
                <input type="text" placeholder="请输入屏幕代码" maxlength="30" v-model="screen">
            </div>
            <a class="btn btn-primary" @click.prevent="project">连接屏幕</a>
        </div>
        <meeting-create v-show="showType==='create'" :timeout="meetingtimeout" :showType="showType"  @create-meeting="setMeetingInfo" @cancel="tocancel" :isVip="isVip"></meeting-create>
        <meeting-join 
            v-show="showType==='join'" 
            :showType="showType" 
            :meetingtimeout="meetingtimeout" 
            @join-meeting="setMeetingInfo" 
            @cancel="tocancel" 
            @roominfo="setRoomInfo"/>
        <!-- <meeting-view v-show="showType==='view'" :screen="screen" :room="room + ''" @show-view="showview" :tostart="tostartMeeting" :toquit="quit" :roomInfo="roomInfo" :isVip="isVip"></meeting-view> -->
        <m-view v-show="showType==='view'" :screen="screen" :room="room + ''" @show-view="showview" :tostart="tostartMeeting" :toquit="quit" :roomInfo="roomInfo" :isVip="isVip"></m-view>
    </div>
</template>

<style lang="scss">
@import "./Meeting";
</style>

<script>
export { default } from './Meeting'
</script>
