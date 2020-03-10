<template>
    <div id="home" class="main-page">
        <div class="main-menu">
            <div class="main-menu-item" >
                <div class="menu-wrap">
                    <img class="item-icon" src="~assets/newimg/new-icon-tv.png">
                    <p class="item-title font-30" @click.prevent="videoMeetingSelected">视频会议</p>
                    <p class="item-title font-30" @click.prevent="startZoom">发起zoom视频会议</p>
                    <p class="item-title font-30" @click.prevent="joinZoom">
                        加入zoom视频会议
                    </p>
                    <input id="joinRoomNum" placeholder="会议号码"/>
                    <input id="joinusername" placeholder="姓名"/>

                </div>

            </div>
            <div class="main-menu-item" @click.prevent="agoraProjector">
                <div class="menu-wrap">
                    <img class="item-icon" src="~assets/newimg/new-icon-projector.png">
                    <p class="item-title font-30">云投影</p>
                </div>
            </div>


        </div>
    </div>
</template>
<style lang="scss">
@import "./Home";
</style>
<script>
export { default } from './Home'
</script>
