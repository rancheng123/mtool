<template>
    <div id="print-record" class="printRecord">
        <title-bar title="历史打印记录" style="top:0;"
                           :show-back="true" @back="goBack" :disable-back="false"></title-bar>
        <div class="print-record-left">
            <img class="printer-img" src="~assets/newimg/new-icon-printer-nofiles.png"/>
            <p class="tip font-20">历史文件会在云端保存24小时，超时自动被删除</p>
        </div>
        <div class="print-record-right">
            <div class="content-list scroll">
                <!-- <p class="title font-30">历史记录</p> -->
                <div class="item" v-for="(file, idx) in localPrintFiles" :key="idx">

                    <div class="left">
                        <div style="display: none;">
                            <input type="checkbox" :id="idx">
                            <label :for="idx"></label>
                        </div>
                        <div class="desc">
                            <p class="text-ellipsis font12px bold">{{file.name}}</p>
                            <p class="text-ellipsis font12px">{{file.dateStr}} 共{{file.pageNum}}页</p>
                        </div>
                    </div>


                    <div class="right">
                        <!-- <span class="font-20">{{file.dateStr}}</span> -->
                        <!-- <span class="font-22">{{file.pageNum}}</span> -->
                        <button :id="'btnPrintAgain' + idx" class="btn btn-primary print" @click.prevent="printAgain(file.uuidName, idx)">
                            再次打印
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "./PrintRecord";
</style>
<script>
    export {default} from './PrintRecord'
</script>
