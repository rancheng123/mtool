<template>
    <div id="printSuccess" class="printSuccess">
        <title-bar
            title="当前准备打印的文件"
            style="top:0;"
            :show-back="true"
            @back="backToPrinter"
            :disable-back="false"
        ></title-bar>

        <div class="status-msg" v-show="status.msg">{{status.msg}}</div>

        <div v-if="!printJobFiles.length" class="no-print-files">
            <img class="printer-img" src="~assets/newimg/new-icon-printer-nofiles.png">
            <div class="nofiles-info">
                您没有准备好打印的文件，或者准备好的文件已经打印完毕，
                <a @click.prevent="backToPrinter">点击返回</a>
            </div>
        </div>

        <div v-if="printJobFiles.length" class="print-record-left">
            <img class="printer-img" src="~assets/newimg/new-icon-printer.png">
            <p class="font12px">文件已经准备好打印，请前往任意打印机，</p>
            <p class="tip font12px">微信扫描设备屏幕上的二维码，即可开始打印。</p>
        </div>
        <div v-if="printJobFiles.length" class="print-record-right">
            <div class="content-list scroll">
                <!-- <p v-show="printJobFiles.length" class="title font-30">当前打印任务</p> -->
                <div
                    class="item"
                    v-for="file in printJobFiles"
                    :key="file.id"
                    @click.prevent="selectFile(file)"
                >
                    <div class="left">
                        <div>
                            <input type="checkbox" v-model="file.checked">
                            <label></label>
                        </div>

                        <div class="desc">
                            <p class="text-ellipsis font12px bold">
                                {{file.realFileName}}
                                [{{file.info}}]
                            </p>

                            <!--<div :bind="file.quotaConsume = undefined"></div>-->

                            <p class="text-ellipsis font12px"
                               style="
    font-size: 14px !important;
"
                               v-show="file.quotaConsume>0"
                            >{{file.ownerType=='1'?'企业':'个人'}}点数   {{file.quotaConsume?-file.quotaConsume:file.quotaConsume}}</p>


                            <p class="text-ellipsis font12px">{{file.createdDate}}</p>
                            <!-- <p class="text-ellipsis">百子湾爱工厂</p> -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="bt-actions">
                <div :class="{disabled: printJobFiles.length===0}">
                    <div class="left" @click.prevent="selectAllFile">
                        <input type="checkbox" v-model="isSelectAll">
                        <label class="all font14px bold">全选</label>
                    </div>
                    <div class="right">
                        <button
                            class="delete-file"
                            :disabled="checkeds === 0"
                            @click.prevent="cancelCheckFile()"
                        >撤销</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
@import "./PrintSuccess";
</style>
<script>
export { default } from "./PrintSuccess";
</script>
