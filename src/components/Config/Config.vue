<template>
    <div id="config" class="setting-page" @keydown.enter="submitConfig">
        <div class="config-wrapper">

            <div class="setting-form">
                <label>服务器地址</label>
                <input disabled type="text" v-model="smartOfficeServerUrl">
                <!-- <label>投影服务器地址</label>
                <input type="text" v-model="janusServerUrl"> -->
                <div class="setting-form-item">
                    <label>授权配置<span class="error" v-if="showActiveCodeError">（授权码错误）</span></label>
                    <input type="text" v-model="activeCode">
                    <a href="javascript:" class="link" @click="fetchActiveCode">获取授权码</a>
                </div>
                <!--<p>会议服务地址</p>
                <input type="text" v-model="meetingServerUrl">-->
                <div class="auto-start" v-show="!isGuest">
                    <input type="checkbox" id="start" v-model="isAutoStart">
                    <label for="start">开机自动启动</label>
                </div>

                <div class="auto-start">
                    <input type="checkbox" id="debug" v-model="isDebug">
                    <label for="debug">dev</label>
                </div>
                <div class="btn-area">
                    <button @click="cancleConfig" class="cancel btn-color-gray-1">取消</button>
                    <button :disabled="showActiveCodeError" @click="submitConfig" class="confirm btn-color-gradient-1">确定</button>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
@import "./Config";
</style>
<script>
export { default } from './Config'
</script>
