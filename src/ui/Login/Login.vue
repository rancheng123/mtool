<template>
<div id="login" v-show="!isGuest" class="login text-center">

    <div class="login-wrapper">
        <div class="login-area login-view-qrcode" v-show="isQrCodeLogin && !isNetworkError">
                <div class="login-change-mask"></div>
                <div class="login-change login-change-acount" @click="loginSwitchBtnClicked">
                    <!-- <el-tooltip :popper-class="login-change-tooltip" class="item" effect="dark" content="Left Center 提示文字" placement="left">
                        <div class="login-change-content"></div>
                    </el-tooltip> -->
                </div>
            
            
            <div class="login-view-left">
                <p>打开微信</p>
                <p>扫一扫<span>登录</span></p>

                <div class="divide"></div>
                <div class="login-info font-18">
                    无法登录？
                    <a class="" @click.prevent="getQrCodeClicked">点击重新获取二维码</a>
                </div>
            </div>
            <div class="login-view-right">
                <div class="qrcode-zone" v-show="isQrCodeLogin && !isQrCodeExpired && !isNetworkError">
                    <img v-if="isPrivateCloud" class="login-img" v-show="qrCode" :src="qrCode" />
                    <div v-else class="login-img" v-show="qrCode" id="qrcode" />
                    <img class="login-img d-face" v-show="!qrCode" src="~assets/img/mine_head.png" />
                </div>
                <div class="qrcode-expired" v-show="isQrCodeLogin && isQrCodeExpired && !isNetworkError">
                    <div class="expired-content text-center">
                        <div class="expired-text">二维码失效</div>
                        <button class="btn-retry" @click.prevent="getQrCodeClicked">点击刷新</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- 输入登录 -->
        <div class="login-area login-form login-view-qrcode" @keydown.enter="login" v-show="!isQrCodeLogin && !isNetworkError">
            <div class="login-change-mask"></div>
            <div class="login-change login-change-qrcode" @click="loginSwitchBtnClicked"></div>
            <div class="login-view-pass-content">
                <div class="login-account">
                    <label for="userName">账号</label>
                    <input type="text" ref="txtUserName" v-model="userName" placeholder="">
                </div>
                <div class="login-password">
                    <label for="password">密码</label>
                    <input type="password" v-model="password" placeholder="">
                </div>
                <div class="errors error-tip">
                    <div v-show="loginFail">用户名或密码错误</div>
                    <div v-show="emptyError">用户名或密码不能为空</div>
                </div>
                <div class="text-center btn-area">
                    <button class="confirm button-gradient-1" @click.prevent="login"
                            :disabled="isSubmitBtnDisabled">{{isSubmitBtnDisabled ? '登录中...' : '登录'}}</button>
                </div>
            </div>
        </div>
        <div class="network-error" v-show="isNetworkError">
            <div class="err-msg">网络连接错误，请检查网络</div>
            <div class="btn-area"><button class="confirm" @click.prevent="checkTokenAndLogin">重试</button></div>
        </div>
        <!-- <button class="login-switcher text-center btn-color-gray-1" v-show="!isNetworkError" @click="loginSwitchBtnClicked">
            <span v-show="isQrCodeLogin" class="">切换至账号密码登录</span>
            <span v-show="!isQrCodeLogin" class="">切换至扫码登录</span>
        </button> -->
        <button class="login-switcher text-center btn-color-gray-1" @click="agoraProjector">
            <span>访客云投影</span>
        </button>
    </div>
</div>
</template>
<style lang="scss">
@import "./Login";
</style>
<script>
export {
    default
}
from './Login'
</script>
