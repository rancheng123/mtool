<template>
    <div>
    
        <div style="display:block" id="topHeader" class="topHeader">
            <div class="topHeader-left-nav">
                <div class="btn-area">
                    <div class="btn-close">
                        <span class="btn-red" @click.prevent="hideWindow">
                            <img class="close-icon" src="~assets/img/top_delete.png">
                            <img class="close-icon" src="~assets/img/top_delete_pre.png" style="display: none;">
                        </span>
                    </div>
                    <div class="btn-minmize">
                        <span class="btn-yellow" @click.prevent="minWindow">
                            <img class="minmize-icon" src="~assets/img/top_narrow.png">
                            <img class="minmize-icon" src="~assets/img/top_narrow_pre.png" style="display: none;">
                        </span>
                    </div>
                    <!-- <div class="btn-enlarge">
                                                                                <span class="btn-green"></span>
                                                                            </div> -->
                </div>
    
                <img @click.prevent="showUserInfo" class="picture" :src="userInfo.avatar||'static/img/mine_head.png'" />
    
                <!-- 鼠标滑到左边栏的头像上显示此部分 -->
    
                <nav-menu></nav-menu>
            </div>
    
            <div class="topHeader-title">
                <img v-show="isShowLogo" :src="userInfo.avatar||'~assets/img/icon_a_logo.png'">
                <span>{{title}}</span>
                <div class="btn-area" v-show="showCloseBtn">
                    <a class="link">
                        <i class="icon icon-close icon15"></i>
                    </a>
                </div>
            </div>
    
            <div class="user-popup-wrapper" v-show="isShowUserInfo" @click.prevent="hideUserInfo">
                <div class="user-popup" @click.prevent="onPopupClicked">
                    <div class="user-popup-info">
                        <div>
                            <p class="text-ellipsis">
                                <span>{{userInfo.fullName}}</span>
    
                                <!-- 需要动态显示性别 -->
                                <img v-show="userInfo.sex === 'female'" class="female" src="~assets/img/icon_woman.png"/>
                                <img v-show="userInfo.sex === 'male'" class="male" src="~assets/img/icon_man.png"/>
                            </p>
                            <p class="text-ellipsis">{{userInfo.phoneNumber}}</p>
                        </div>
                        <img :src="userInfo.avatar||'static/img/mine_head.bb0a314.png'">
                    </div>
                    <button class="btn btn-primary btn-logout" @click.prevent="logout">
                        <i class="icon icon-logout icon18"></i>
                        <span>登出</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
@import "./TopHeader";
</style>
<script>
import TopHeader from './TopHeader.js'
export default TopHeader
</script>