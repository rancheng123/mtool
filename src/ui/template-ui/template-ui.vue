<template>
    <div id="templateUI" class="templateUI">
    
        <!-- 顶部操作按钮栏 -->
        <div class="header-close-area">
            <div class="btn-wrapper">
                <img class="close-icon" src="~assets/img/top_delete.png">
                <img class="close-icon" src="~assets/img/top_delete_pre.png" style="display: none;">
            </div>
            <div class="drag-area flexNum1"></div>
        </div>
    
        <!-- 中间登录部分 -->
        <div class="login-new text-center" style="display: none;">
            <div class="page-wrapper">
                <img class="login-logo" src="~assets/img/logo_round.png">
    
                <!-- 扫描登录 -->
                <div v-show="!isNetworkError" class="login-qr">
                    <img class="login-img" :src="qrCode">
                    <h5 class="login-tip font-18">打开微信 | 扫一扫登录</h5>
                    <div class="login-info font-18">
                        无法登录？
                        <a class="get-qrcode">
                            点击重新获取二维码
                        </a>
                    </div>
                </div>
    
                <!-- 无网络的情况 -->
                <div v-show="isNetworkError" class="network-error">
                    <div class="err-msg font-14">网络连接错误，请检查网络</div>
                    <button class="btn btn-primary btn-big btn-retry" @click.prevent="checkTokenAndLogin">重试</button>
                </div>
    
                <!-- 设置按钮 -->
                <div class="setting-area">
                    <a class="link">
                        <i class="icon icon-setting icon30"></i>
                    </a>
                </div>
            </div>
        </div>
    
        <!-- 主菜单 -->
        <div class="main-page" style="display: none;">
            <div class="user-row">
                <div class="user-row-logout">
                    <p class="font-20">比尔盖茨
                        <br>13880971547</p>
                    <button class="btn btn-gray font-20">退出</button>
                </div>
                <img class="picture" src="~assets/img/mine_head.png" />
            </div>
    
            <div class="main-menu">
                <div class="main-menu-item">
                    <img class="item-icon" src="~assets/img/print_icon.png">
                    <img class="item-icon" src="~assets/img/print_icon_pre.png" style="display: none;">
                    <p class="item-title font-30">云打印</p>
                    <p class="item-info font-20">帮您快速上传和打印文件</p>
                </div>
    
                <div class="main-menu-item">
                    <img class="item-icon" src="~assets/img/video_icon.png">
                    <img class="item-icon" src="~assets/img/video_icon_pre.png" style="display: none;">
                    <p class="item-title font-30">本地投影</p>
                    <p class="item-info font-20">帮您快速将电脑投影到会议室电视屏幕上</p>
                </div>
    
                <div class="main-menu-item">
                    <img class="item-icon" src="~assets/img/project_icon.png">
                    <img class="item-icon" src="~assets/img/project_icon_pre.png" style="display: none;">
                    <p class="item-title font-30">程视频会议</p>
                    <p class="item-info font-20">帮您快速与远程伙伴视频会议</p>
                </div>
            </div>
        </div>
    
        <div class="setting-page" style="display: none;">
            <div class="page-wrapper">
                <p class="font-20">服务器地址</p>
                <input class="font-20" type="text" v-model="smartOfficeServerUrl" placeholder="mxj360.com">
                <p class="font-20">投影服务器地址</p>
                <input class="font-20" type="text" v-model="janusServerUrl" placeholder="s.mxj360.com">
                <div class="auto-start">
                    <input class="font-20" type="checkbox" id="start">
                    <label class="font-20" for="start">开机自动启动</label>
                </div>
    
                <div class="btn-area">
                    <button class="btn btn-primary btn-big confirm font-22">确定</button>
                    <button class="btn btn-primary btn-big confirm font-22">取消</button>
                </div>
    
                <div class="close-btn">
                    <img src="~assets/img/close.png">
                </div>
            </div>
        </div>
    
        <!-- 选择会议页面 -->
        <div class="choose-meeting text-center">
            <div class="choose-meeting-button">
                <img src="~assets/img/choose_icon_1.png">
                <p class="font-30">发起会议</p>
            </div>
            <div class="choose-meeting-button">
                <img src="~assets/img/choose_icon_2.png">
                <p class="font-30">加入会议</p>
            </div>
    
            <button class="btn btn-transparent font-20">取消</button>
        </div>
    
        <!-- 输入代码 -->
        <div class="video-start text-center" style="display: none;">
            <p class="font-30 video-start-title">发起视频会议</p>
            <p class="font-20 video-start-info">输入会议室代码并发起视频会议</p>
            <input class="font-30" type="text" placeholder="输入代码">
            <button class="btn btn-primary font-26">开始发起</button>
            <div class="divide"></div>
            <button class="btn btn-transparent font-20">
                <span>取消</span>
                <span style="display: none;">X</span>
            </button>
        </div>
    
        <!-- 控制屏幕 -->
        <div class="control-screen text-center" style="display: none;">
            <p class="control-screen-title font-30">正在控制屏幕</p>
            <p class="control-screen-num font-50">MXJ-3452</p>
            <div class="control-screen-button">
                <div>
                    <img src="~assets/img/voice_icon.png">
                </div>
                <div>
                    <img src="~assets/img/meeting_icon.png">
                </div>
                <div>
                    <img src="~assets/img/phone_icon.png">
                </div>
            </div>
    
            <div class="control-screen-right">
                <div class="laptop-wrapper">
                    <p class="font-15">MXJ-3452</p>
                    <img class="laptop" src="~assets/img/icn_laptop.png">
                </div>
                <div class="addfriend">
                    <img src="~assets/img/add_friend_icon.png">
                </div>
                <div class="addfriend">
                    <img src="~assets/img/add_friend_icon.png">
                </div>
            </div>
        </div>
    
        <!-- 邀请码投屏 -->
        <div class="invite-code" style="display: none;">
            <div class="invite-code-center">
                <p class="font-30 title">参会者输入下方会议室代码即可加入本次会议</p>
                <p class="font-50 num">2231</p>
            </div>
            <div class="invite-code-bottom">
                <p class="font-20">MXJ-3452</p>
                <p class="font-20">10：31</p>
                <p class="font-20">会议室代码：2231</p>
            </div>
            <div class="video-wrapper">
                <video id="player" loop="loop" width="100%" height="auto" autoplay="autoplay" src="mxj.mp4" muted></video>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
@import "./template-ui";
</style>

<script>
export default {
    data() {
        return {
            isNetworkError: false,
            qrCode: 'static/img/mine_head.bb0a314.png'
        }
    }
}
</script>
