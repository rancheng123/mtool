<template>
    <div class="AccessorialTitleBar">
        <div class="AccessorialTitleBar-slot AccessorialTitleBar-slotLeft">
            <slot name="left"></slot>
        </div>
        <div class="AccessorialTitleBar-icon" :style="iconBgImgStyle"></div>
        <div class="AccessorialTitleBar-slot AccessorialTitleBar-slotRight">
            <slot name="right"></slot>
        </div>
    </div>
</template>
<script>
import IconProjector from 'src/assets/newimg/projector-xiao.png'
import IconPrinter from 'src/assets/newimg/printer-xiao.png'
import IconTv from 'src/assets/newimg/meetingtv-xiao.png'

export default {
    name: 'accessorial-title-bar',
    props: {
        type: {
            type: String, // projector, printer, meeting
            required: true
        }
    },
    data() {
        return {
        }
    },
    computed: {
        iconBgImgStyle() {
            let img = ''
            if (this.type === 'projector') {
                img = IconProjector
            } else if (this.type === 'printer') {
                img = IconPrinter
            } else if (this.type === 'meeting') {
                img = IconTv
            }
            return {
                backgroundImage: `url(${img})`
            }
        }
    }
}
</script>
<style lang="scss">
    .AccessorialTitleBar {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        height: 60px;
        width: 100%;
        background-color: #2D2C34;
        /*margin-top: 30px;*/
        position: absolute;
        z-index: 1;
        top: 30px;

        .AccessorialTitleBar-slot {
            flex: 1;
            display: flex;
            flex-flow: row nowrap;
            align-items: center;
        }

        .AccessorialTitleBar-slotLeft {
            justify-content: flex-start;
            margin: 0 20px;
        }

        .AccessorialTitleBar-slotRight {
            justify-content: flex-end;
            margin: 0 20px;
        }

        .AccessorialTitleBar-icon {
            flex-shrink: 0;
            width: 50px;
            height: 30px;
            display: block;
            border: none;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }
    }
</style>