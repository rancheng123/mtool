<template>
    <div class="app">
        <printer v-show="isShowPrinter" />
        <config v-show="isShowConfig" />
        <about v-show="isShowAbout" />
        <print-success v-show="isShowPrintSuccess" />
        <print-record v-show="isShowPrintRecord" />
        <printer-intro v-show="isShowPrintInstro" />
        <meeting v-show="isShowMeeting" />
        <home v-show="isShowHome" />
        <meeting-projector v-show="isShowMeetingProject" />
        <account v-show="isShowAccount" />
        <!--<div class="back-btn" v-show="!isShowHome" @click.prevent="goback">返回</div>-->
    </div>
</template>

<style lang="scss">
@import "./App";
</style>
<script>
export { default } from './App'
</script>
