<template>
    <div id="about" class="about-page">
        <div class="about-content" v-if="!isShowLicence">
            <div class="about-wrapper">
                <div class="about-content-verion text-center">
                    <img src="~assets/newimg/new-logo-about.png">
                    <p>梦想加办公助手</p>
                </div>
                <div class="version">V {{version}}</div>
                
                <div class="about-content-bottom">
                    <div v-show="!isGuest" class="about-content-btn-area text-center">

                        <button class="btn-black btn-color-gray-1" @click.prevent="checkForUpdate">检查更新</button>
                    </div>

                    <div class="about-content-footer text-center font-26">
                        <a href="javascript:void()" class="font12px" @click.prevent="protocolClicked">
                            服务协议
                        </a>
                        <p style="display: none;">北京梦想加科技有限公司 版权所有</p>
                        <p style="display: none;">Mydreamplus All rights reserved</p>
                    </div>
                    <div class="series">序列号：{{series}}</div>
                </div>
            </div>

        </div>
        <licence :is-close-btn-opacity="isCloseBtnOpacity" :close-clicked="onLicenceCloseClick" v-show="isShowLicence" />
    </div>
</template>


<style lang="scss">
@import "./About";
</style>
<script>
export { default } from './About'
</script>
