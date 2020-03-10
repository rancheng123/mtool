<template>
    <div id="projector" class="projector" @keydown.enter="startBtnClicked">
        <!-- <div v-show="!isSharing" id="startPage" class="startPage">
                                            <div class="startPage-content">
                                                <h1 class="text-center">连接云屏幕</h1>
                                                <div>
                                                    <input type="text" placeholder="请在此处输入会议室屏幕代码" v-model="roomId" class="actived">
                                                </div>
                                                <div class="privacy">
                                                    <input type="checkbox" id="privacy" v-model="isPrivateMode">
                                                    <label for="privacy">隐私模式 ( 只分享指定的某个窗口 )</label>
                                                </div>
                                                <button @click.prevent="startBtnClicked" :disabled="isNetWorkOffline || startBtnDisabled || !roomId"
                                                        class="btn btn-primary btn-small start">
                                                    <span>{{startButtonText}}</span>
                                                </button>

                                                <img  class="cloud left" src="~assets/img/icon_cloud_a.png">
                                                <img class="cloud right" src="~assets/img/icon_cloud_a.png">
                                                <img class="cloud bottom" src="~assets/img/icon_cloud_a.png">

                                            </div>
                                        </div> -->

        <!-- <div class="startPage text-center" v-show="!isSharing" id="startPage">
                                    <p class="font-30 startPage-title">开启本地投影</p>
                                    <p class="font-20 startPage-info">输入会议室屏幕中的标识码</p>

                            <div class="errors" style="display: none;">
                                <div class="alert alert-danger font-20">屏幕代码不存在</div>
                                <div class="alert alert-danger font-20">请输入屏幕代码</div>
                            </div>
                            <input class="font-30" type="text" maxlength="30" v-model="roomId" placeholder="输入代码">
                            <button class="btn btn-primary font-26" @click.prevent="startBtnClicked" :disabled="isNetWorkOffline || startBtnDisabled || !roomId">{{startButtonText}}</button>

                            <div class="privacy">
                                <input type="checkbox" id="privacy" v-model="isPrivateMode">
                                <label for="privacy" class="font-20">隐私模式 ( 只分享指定的某个窗口 )</label>
                            </div>

                            <div class="divide"></div>

                            <button class="btn btn-transparent font-20" @click.prevent="cancel">
                                <span>取消</span>
                                <span style="display: none;">X</span>
                            </button>
                        </div>-->

        <div id="stopPage" class="stopPage">
            <h5 class="stopPage-title font-30"> 屏幕代码：{{roomId}}</h5>
            <div class="stopPage-video">
                <h2>屏幕共享中...</h2>
                <video id="screenvideo" width="100%" height="100%" autoplay muted="muted" style="display:none;" />
                <!--<img src="~assets/img/picture.jpg">-->
            </div>
            <button @click.prevent="stopBtnClicked" class="btn btn-transparent font-20">
                <span>停止</span>
                <span style="display: none;">X</span>
            </button>
        </div>
    </div>
</template>
<style lang="scss">
@import "./Projector";
</style>
<script>
export { default } from './Projector'
</script>
