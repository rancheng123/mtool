<template>
    <div id="PrinterIntro" class="printerIntro">
        <title-bar title="打印说明" style="top:0;"
                           :show-back="true" @back="backToPrinter" :disable-back="false"></title-bar>
        <div class='intro'>
            <div class="intro-left">
                <div class="desc">{{currentitem.desc1}}</div>
                <div class="step">
                    <span class='number' v-for="(item, index) in macItems" @click="toPage(index, $event)">{{index+1}}</span>
                </div>
            </div>
            <div class="intro-right">
                <img :src="currentitem.imgUrl"> </img>
            </div>
        </div>
    </div>
</template>


<script>
import TitleBar from '../TitleBar/TitleBar.vue'
const electron = require('electron')
const remote = electron.remote
const logger = remote.require('./app/logger')
import DomHelper from '../../helpers/agora/domhelper'
export default {

    components: {
        TitleBar
    },
    data() {
        return {
            showMacPrint: true,
            showSetting: false,
            nextButtonDisabled: false,
            preButtonDisabled: true,
            counter: 0,
            currentitem: {
                imgUrl: null,
                desc1: null
            },
            macItems: [{
                desc1: '1. 按照您日常打印文件的方式进行打印，比如在Word, Excel中点击文件 -> 打印。',
                imgUrl: require('assets/img/mac1.png'),
                show: true
            },
            {
                desc1: '2. 打印菜单打开以后，请选择 “梦想加打印机”，打印机进行打印。',
                desc2: '',
                imgUrl: require('assets/img/mac2.png'),
                show: false
            },
            {
                desc1: '3. 如果您的打印配额足够，梦想加办公助手会开始准备打印文件，您可以看到文件打印准备的提示。',
                imgUrl: require('assets/img/mac3.png'),
                show: false
            },
            {
                desc1: '4. 打印文件准备好您会看见如下界面，请到距离您最近的梦想加打印机扫描二维码开始打印。',
                imgUrl: require('assets/img/mac4.png'),
                show: false
            }],
            winItems: [{
                desc1: '1. 按照您日常打印文件的方式进行打印，比如在Word, Excel中点击文件 -> 打印。',
                imgUrl: require('assets/img/window11.jpg'),
                show: true
            },
            {
                desc1: '2. 打印菜单打开以后，请选择 “梦想加打印机”,打印机进行打印。',
                desc2: '',
                imgUrl: require('assets/img/window12.png'),
                show: false
            },
            {
                desc1: '3. 如果您的打印配额足够，梦想加办公助手会开始准备打印文件，您可以看到文件打印准备的提示。',
                imgUrl: require('assets/img/mac3.png'),
                show: false
            },
            {
                desc1: '4. 打印文件准备好您会看见如下界面，请到距离您最近的梦想加打印机扫描二维码开始打印。',
                imgUrl: require('assets/img/mac4.png'),
                show: false
            }],
            winSetItems: [{
                desc1: '1. 通过 “开始” “控制面板”。',
                imgUrl: require('assets/img/window1.png'),
                show: true
            },
            {
                desc1: '2. 在 “调整计算机的设置” 中找到 “设备和打印机”',
                imgUrl: require('assets/img/window2.png'),
                show: false
            },
            {
                desc1: '3. 双击 “设备和打印机” 打开，点击 “添加打印机”',
                imgUrl: require('assets/img/window3.png'),
                show: false
            },
            {
                desc1: '4. 选择 “按名称选择共享打印机” 其中填入 http://localhost:6311，并点击 “下一步”',
                imgUrl: require('assets/img/window4.png'),
                show: false
            },
            {
                desc1: '5. 在 “添加打印机向导” 中选择 “厂商” 为 “Generic”，选择 “打印机” 为 “MS Publisher Color Printer”',
                imgUrl: require('assets/img/window5.png'),
                show: false
            },
            {
                desc1: '6. 选择以后显示添加打印机成功页面',
                imgUrl: require('assets/img/window6.png'),
                show: false
            },
            {
                desc1: '7. 添加打印机成功以后，点击 “完成”，将会在打印机页面中看到打印机已添加成功',
                imgUrl: require('assets/img/window7.png'),
                show: false
            }]
        }
    },
    mounted() {
        var self = this
        console.log('Printer intro mounted~~~!', process.platform)
        if (process.platform === 'win32') {
            self.showMacPrint = false
            self.currentitem = self.winItems[0]
        } else if (process.platform === 'darwin') {
            self.showMacPrint = true
            self.currentitem = self.macItems[0]
        }
        global.jQuery('.number').first().addClass('active')

    },
    methods: {
        toPage(index, event) {
            let self = this
            logger.info(`to: ` + index)
            global.jQuery('.number').removeClass('active')
            global.jQuery(event.target).addClass('active')
            if (self.showMacPrint) {
                self.currentitem = self.macItems[Number(index)]
            } else {
                self.currentitem = self.winItems[Number(index)]
            }
        },
        jumpToConfigPrinter() {
            let container = document.getElementById('printer')
            let isMac = process.platform === 'darwin'
            // let dom = isMac ? '' : document.getElementById('printerSetWindows')
            let dom = document.getElementById('printerSetWindows')
            container.scrollTop = dom.getBoundingClientRect().top + container.scrollTop - 60
            this.showSetting = true
        },
        // navNextPage(data) {
        //     if (this.counter === data.length - 1) {
        //     } else {
        //         data[this.counter].show = false
        //         data[this.counter + 1].show = true
        //     }
        //     this.counter += 1
        //     if (this.counter !== 0) {
        //         this.preButtonDisabled = false
        //     }
        //     if (this.counter === data.length - 1) {
        //         this.nextButtonDisabled = true
        //     }
        // },
        // navPrePage(data) {
        //     if (this.counter === 0) {
        //     } else {
        //         data[this.counter].show = false
        //         data[this.counter - 1].show = true
        //     }
        //     this.counter -= 1
        //     if (this.counter === 0) {
        //         this.preButtonDisabled = true
        //     }
        //     if (this.counter !== data.length - 1) {
        //         this.nextButtonDisabled = false
        //     }
        // },
        openSetPrinter() {
            this.showSetting = true
            this.counter = 0
            this.preButtonDisabled = true
            this.nextButtonDisabled = false
            // 初始化winSetItems
            for (var i = 0; i < this.winSetItems.length - 1; i++) {
                if (i === 0) {
                    this.winSetItems[i].show = true
                } else {
                    this.winSetItems[i].show = false
                }
            }

            this.winItems.forEach(w => {
                w.show = false
            })
        },
        closeSetPrinter() {
            this.showSetting = false
            this.counter = 0
            this.preButtonDisabled = true
            this.nextButtonDisabled = false
            // 初始化winSetItems
            for (var i = 0; i < this.winItems.length - 1; i++) {
                if (i === 0) {
                    this.winItems[i].show = true
                } else {
                    this.winItems[i].show = false
                }
            }
            this.winSetItems.forEach(w => {
                w.show = false
            })
        },
        backToPrinter() {
            this.$router.replace({ path: '/app/printer' })
        }
    }
}
</script>

<style lang="scss">
@import '~assets/scss/vars';
.printerIntro {
    width: 100%;
    height: 100%;
    color: #fff;
    overflow-y: scroll;
    overflow-x: hidden;
    .printerIntro-nav {
        margin-top: 8.3vh;
        text-align: center;
    }
}
.intro {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    height: 460px;
    top: 50px;
    position: absolute;
    .intro-left {
        width: 50%;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        .desc {
            font-family: PingFangTC-Medium;
            font-size: 15px;
            color: #FFFFFF;
            letter-spacing: -0.23px;
            width: 400px;
        }
        .step {
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            margin-top: 36.5px;
            width: 220px;
            .number {
                background: rgba(255,255,255,0.10);
                border-radius: 7.5px;
                font-family: PingFangTC-Medium;
                font-size: 10px;
                color: #A2A2A2;
                letter-spacing: -0.15px;
                width: 15px;
                height: 15px;
                margin-right: 20px;
                margin-left: 20px;
                &:hover {
                    cursor: pointer;
                    filter:grayscale(20%);
                    filter:brightness(90%);
                }
                &.active {
                    color: #FFFFFF;
                    background-image: linear-gradient(7deg, #9985FF 0%, #2C9CF9 100%);
                }

            }

        }

    }
    .intro-right {
        width: 50%;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        img {
            max-height: 299px;
            max-width: 334px;
            border: 1px solid #FFFFFF;
        }
    }
}
.des {
    width: 100%;
    .title {
        @include flexAlignCenter();
        color: $font-dark;
        .title-text {
            padding: 30px 28px;
            margin-bottom: 0;
        }
        .title-line {
            height: 1px;
            background: $border-gray;
        }
    }
}


.tabs {
    text-align: center;
    margin: 13vh auto 0 auto;
    width: 80%;
    max-width: 75vw;
    text-align: center;
    .tab-links {
        li {
            display: inline-block;
            width: 49%;
            list-style: none;
            text-align: center;
            a {
                padding: 7px 15px;
                @include border-radius(3px);
                font-size: $font15;
                color: $font-gray;
                transition: all linear 0.15s;
                &:hover {
                    color: $font-dark;
                    text-decoration: none;
                    .icon {
                        opacity: 1;
                    }
                }
                .icon {
                    opacity: .6;
                }
            }
            &.active {
                a {
                    border: 1px solid $primary-color;
                    color: $font-dark;
                    .icon {
                        opacity: 1;
                    }
                }
            }
        }
    }
    .tab-content {
        position: relative;
        box-sizing: border-box;
        padding: 0 10vw;
        .macTabCls,
        .winTabCls {
            height: 60vh;
        }
        .tab {
            &.active {
                display: block;
            }
            img {
                max-width: 450px;
                margin: 30px 0;
                object-fit: contain;
                .first {
                    margin-top: 10px;
                }
            }

            .method {
                margin-bottom: 20px;
            }

            .webUrl {
                color: $second-color;
            }
            ul li img {
                margin-top: 30px;
            }
        }
        ul.itemList {
            li.item {
                img {
                    margin-top: 30px;
                    max-height: 50vh;
                    object-fit: contain;
                }
            }
        }
        ul.method {
            counter-reset: test;
            li.item {
                counter-increment: test; // margin: 5px;
                // cursor: pointer;
                padding-left: 40px;
                border-left: 1px solid $border-gray;
                position: relative;
                &:before {
                    position: absolute;
                    content: counter(test);
                    display: inline-block;
                    width: 15px;
                    height: 15px;
                    @include border-radius(50%);
                    text-align: center;
                    line-height: 15px;
                    background: $btn-blue;
                    color: #fff;
                    transition: all .28s ease;
                    left: -7.5px;
                    top: 0;
                    font-size: 10px;
                }
                &:last-child {
                    &:after {
                        content: '';
                        background-image: url('~assets/img/icon_success.png');
                        background-color: $btn-blue;
                        position: absolute;
                        bottom: 0;
                        display: inline-block;
                        width: 15px;
                        height: 15px;
                        background-position: 10px;
                        border-radius: 50%;
                        left: -7.5px;
                        background-repeat: no-repeat;
                        background-position: center center;
                        background-size: 10px;
                    }
                }
                &.no-image-end:before {
                    display: none;
                }
                &.marginTopBottom {
                    margin: 10px 0;
                }
                &.marginTop {
                    margin-top: 10px;
                }
            }
        }

        .link {
            color: $primary-color;
            text-decoration: underline;
            cursor: pointer;
            display: inline-block;
            &:hover,
            &:focus,
            &:active {
                opacity: 0.8;
            }
        }

        .expand-area {
            width: 30px;
            height: 20px;
            text-align: center;
            margin-left: -15px;
            &:hover,
            &:focus {
                opacity: .5;
            }
        }
        .inline-block {
            display: inline-block;
        }

        .expand {
            width: 15px;
            height: 15px;
            display: inline-block;
            position: relative;
            top: -5px;
            vertical-align: middle;
            border: 2px solid $btn-blue;
            width: 10px;
            height: 10px;
            border-top-color: transparent;
            border-left-color: transparent;
            -webkit-transform: translateX(0) rotate(45deg);
            -moz-transform: translateX(0) rotate(45deg);
            transform: translateX(0) rotate(45deg); // -webkit-animation: jumper linear .7s infinite;
            //    -moz-animation: jumper linear .7s infinite;
            //         animation: jumper linear .7s infinite;
        }

        .close {
            width: 15px;
            height: 15px;
            display: inline-block;
            position: relative;
            top: -1px;
            vertical-align: middle;
            border: 2px solid $primary-color;
            width: 10px;
            height: 10px;
            border-top-color: transparent;
            border-left-color: transparent;
            -webkit-transform: translateX(0) rotate(-45deg);
            -moz-transform: translateX(0) rotate(-45deg);
            transform: translateX(0) rotate(-45deg);
        }

        #printerSetMac,
        #printerSetWindow {
            margin-top: 40px;
        }
        .marginTopBottom {
            margin: 10px 0 20px 0;
        }
    }
    .btn {
        position: absolute;
        top: 50%;
        font-size: 18px;
        font-weight: bolder;
        border: none;
        border-radius: 50px;
        padding: 0;
        background-image: linear-gradient(7deg, #9985FF 0%, #2C9CF9 100%);
        line-height: 50px;
        width: 50px;
        height: 50px;
        transition: all ease 0.3s;
        color: #fff;
        &:not(:disabled):hover {
            background: $primary-color;
        }
        &.pre {
            left: 0;
        }
        &.next {
            right: 0;
        }
        &:disabled {
            background: rgba(255, 255, 255, 0.10);
            border: none;
            border-radius: 50px;
            color: rgba(255, 255, 255, 0.2);
            cursor: not-allowed;
        }
    }
    .detail-info {
        position: absolute;
        font-size: 12px;
        bottom: -11vh;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
    }
}
</style>
