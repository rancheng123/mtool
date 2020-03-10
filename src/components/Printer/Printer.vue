<template>
    <div id="printer" class="printer">
        <div
            id="info"
            class="printer-info"
            v-show="infomsg"
            :class="{'done':infomsg === '打印机设置完成', 'error':infomsg === '打印机驱动安装失败，请尝试再次安装'}"
        >
            <span class="font14px">{{infomsg}}</span>
        </div>
        <p v-show="isStillHavePrintingFiles" class="content-top-tip">
            <span class="has-file-text" @click.prevent="openPrintingFileList">
                当前有打印任务仍在进行，点此前往查看
                <button class="check">查看</button>
            </span>
        </p>
        <div class="printer-left">
            <p class="font18 printer-title">打印说明</p>
            <div class="font12px printer-tip">
                正常打印文件，选择【{{printInfo}}】
                <img src="~assets/newimg/printer-preview.png">
            </div>
            <div class="font12px printer-tip">前往场地对应打印机，扫码或刷卡打印文件</div>
            <!-- <div class="printer-instr-link" @click.prevent="openPrintingInstro">
                <span class="font12px">打印说明</span>
            </div>-->
        </div>
        <div class="printer-right">
            <div class="printer-center">
                <img
                    v-show="isStillHavePrintingFiles"
                    class="printer-img"
                    src="~assets/newimg/new-icon-printer.png"
                >
                <img
                    v-show="!isStillHavePrintingFiles"
                    class="printer-img"
                    src="~assets/newimg/new-icon-printer-nofiles.png"
                >
                <div class="quota">
                    <p>
                        <i-count-up
                            class="quota-number"
                            :start-val="quotaCountUpStartVal"
                            :end-val="quotaCountUpEndVal"
                            :decimals="0"
                            :duration="3"
                            :options="quotaCountUpOptions"
                            @ready="onQuotaCountUpReady()"
                        ></i-count-up>
                    </p>
                    <p>
                        <span class="font12px bold">剩余配额</span>
                    </p>
                </div>
            </div>
            <div class="font12px printer-nofound">
                <button class="button-gradient-1" @click="openLocalPrintHistory">查看记录</button>
                <div>
                    找不到打印机？
                    <a
                        class="link"
                        href="javascript:void(0);"
                        @click="installPrinter"
                    >点击此处尝试再次安装</a>
                </div>
            </div>
        </div>

        <!-- <div class="flexRow btn-area flexJustCenter">
            <button class="btn btn-primary buy" disabled="disabled">
                <span class="font-26">购买配额</span>
            </button>

        </div>
        <button class="btn btn-transparent font-20" @click.prevent="backToHome">
            <span>取消</span>
            <span style="display: none;">X</span>
        </button>-->

        <!-- <div class="font-30 printer-bottom" v-show="needInstallPrinter">
            您还没有安装梦想加打印机
            <a class="link" href="javascript:void(0);" @click="installPrinter">
                点击此处尝试安装
            </a>
        </div>-->

        <!-- </div> -->
    </div>
</template>
<style lang="scss">
@import "./Printer";
</style>
<script>
export { default } from "./Printer";
</script>
