<template>
<div id="main" class="main"
    v-on:mouseenter="overHeader"
    v-on:mouseleave="leaveHeader">
    <div class="header"
        :class="{'fullscreenmode': isFullscreenMode}"
        v-show="isShowHeader">
        <div class="header-close-area">
            <div class="btn-wrapper">
                <div class=" close-btn btn-red" @click.prevent="hideWindow">
                    <img class="close-icon" src="~assets/img/top_delete.png">
                    <img class="close-icon" src="~assets/img/top_delete_pre.png" style="display: none;">
                    <img class="close-icon" src="~assets/img/top_delete_click.png" style="display: none;">
                </div>
                <div class="btn-icon btn-yellow" @click.prevent="minWindow" :class="{'min-full':isFullscreen}">
                    <img class="close-icon" src="~assets/img/top_narrow.png">
                    <img class="close-icon" src="~assets/img/top_narrow_pre.png" style="display: none;">
                    <img class="close-icon" src="~assets/img/top_narrow_click.png" style="display: none;">
                </div>
                <div class="btn-icon btn-green" @click.prevent="maxWindow" :class="{'fullscreen':isFullscreen}">
                    <img class="close-icon" src="~assets/img/top_amplify.png">
                    <img class="close-icon" src="~assets/img/top_amplify_pre.png" style="display: none;">
                    <img class="close-icon" src="~assets/img/top_amplify_click.png" style="display: none;">
                    <img class="close-icon" src="~assets/img/top_restore.png" style="display: none;">
                    <img class="close-icon" src="~assets/img/top_restore_click.png" style="display: none;">
                </div>
            </div>
            <div class="drag-area flewNum1"></div>
            <div class="replacer-right"></div>

        </div>
        <div class="header-replacer" v-show="isShowNav">
            <div class="drag-area flewNum1"></div>
            <div class="replacer-right"></div>
        </div>
        <div class="navbar">
            <ul class="nav-icons" v-show="isShowNav">
                <li class="nav-icon" v-show="!isGuest" :class="{ active: this.$route.path.indexOf('print') > 0, noLogin: !this.$store.state.isLogin}">
                    <el-tooltip class="item" effect="dark" popper-class="el-tooltip__popper___marginTop18px"
                                content="此功能需登录才可使用" placement="bottom-end" :disabled="isAlreadyLogin">
                        <a @click.prevent="toPrinter" v-if="hasPrinter">
                            <div class="nav-icon-img"><img src="~assets/newimg/new-icon-print.png" /><img src="~assets/newimg/new-icon-print-selected.png" /></div>
                            <div class="nav-icon-text">打印</div>
                        </a>
                    </el-tooltip>
                </li>
                <li class="nav-icon" :class="{ active: this.$route.path ==='/app/home' || this.$route.path.indexOf('meeting') > 0, noLogin: !this.$store.state.isLogin}">
                    <el-tooltip class="item" effect="dark" popper-class="el-tooltip__popper___marginTop18px"
                                content="此功能需登录才可使用" placement="bottom-end" :disabled="isAlreadyLogin">
                        <a @click.prevent="toHome">
                            <div class="nav-icon-img"><img src="~assets/newimg/new-icon-meeting.png" /><img src="~assets/newimg/new-icon-meeting.png" /></div>
                            <div class="nav-icon-text">会议</div>
                        </a>
                    </el-tooltip>
                </li>
                <li class="nav-icon" :class="{ active: this.$route.path ==='/app/about' }">
                    <router-link to="/app/about">
                        <div class="nav-icon-img"><img src="~assets/newimg/new-icon-about.png" /><img src="~assets/newimg/new-icon-about-selected.png" /></div>
                        <div class="nav-icon-text">关于</div>
                    </router-link>
                </li>
                <li v-show="!isGuest" class="nav-icon" :class="{ active: this.$route.path ==='/app/config' }">
                    <router-link to="/app/config">
                        <div class="nav-icon-img"><img src="~assets/newimg/new-icon-config.png" /><img src="~assets/newimg/new-icon-config-selected.png" /></div>
                        <div class="nav-icon-text">设置</div>
                    </router-link>
                </li>
                <li v-show="!isGuest" class="nav-icon" :class="{ active: this.$route.path ==='/app/account' || this.$route.path ==='/' }">
                    <router-link to="/app/account">
                        <div class="nav-icon-img"><img src="~assets/newimg/new-icon-account.png" /><img src="~assets/newimg/new-icon-account-selected.png" /></div>
                        <div class="nav-icon-text">账户</div>
                    </router-link>
                </li>
            </ul>
        </div>
    </div>

    <router-view></router-view>
</div>
</template>

<style lang="scss">
@import "./assets/scss/global";
@import "./assets/scss/vars";
@import "./assets/scss/main";
@import "./assets/scss/components";
</style>

<script>
export {
    default
}
from './mainvue'
</script>
