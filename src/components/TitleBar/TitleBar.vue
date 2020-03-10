<template>
    <div class="TitleBar">
        <div class="TitleBar-actionArea TitleBar-left">
            <button
                class="actionButton backButton"
                :disabled="disableBack"
                v-if="showBack"
                @click="onBackClick($event)"
            ></button>
            <slot name="left"></slot>
            <div class="Net-info">{{netinfo}}</div>
        </div>

        <div class="TitleBar-title">{{title}}</div>
        <div class="TitleBar-actionArea TitleBar-right">
            <slot name="right"></slot>
            <button
                class="actionButton closeButton"
                :disabled="disableClose"
                v-if="showClose"
                @click="onCloseClick($event)"
            ></button>
        </div>
    </div>
</template>
<script>
export default {
    name: 'title-bar',
    props: {
        title: {
            type: String,
            default: ''
        },
        netinfo: {
            type: String,
            default: ''
        },
        showBack: {
            type: Boolean,
            default: false
        },
        showClose: {
            type: Boolean,
            default: false
        },
        disableBack: {
            type: Boolean,
            default: false
        },
        disableClose: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {}
    },
    computed: {},
    methods: {
        onBackClick(evt) {
            evt.stopPropagation()
            this.$emit('back')
        },
        onCloseClick(evt) {
            evt.stopPropagation()
            this.$emit('close')
        }
    }
}
</script>
<style lang='scss'>
.TitleBar {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    height: 50px;
    width: 100%;
    background-color: #44434b;
    position: absolute;
    top: 30px;

    .Net-info {
        font-size: 16px;
        color: #eee;
    }

    .TitleBar-title {
        font-size: 14px;
        color: #ffffff;
    }

    .TitleBar-actionArea {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        flex: 1;
    }

    .TitleBar-left {
        justify-content: flex-start;
    }
    .TitleBar-right {
        justify-content: flex-end;
    }

    .actionButton {
        width: 40px;
        height: 40px;
        background-repeat: no-repeat;
        background-position: center;
        background-color: transparent;
        border: none;
        &:disabled {
            opacity: 0.5;
        }
        &:hover {
            cursor: pointer;
            filter: drop-shadow(0 0px 2px #eee);
        }
        &:active {
            background-color: rgba(0, 0, 0, 0.2);
            filter: none !important;
        }
    }

    .backButton {
        background-image: url(~src/assets/newimg/titlebar-back.png);
        background-size: 15px 15px;
        margin-left: 10px;
    }

    .closeButton {
        background-image: url(~src/assets/newimg/quit.png);
        background-size: 44px 18px;
        margin-right: 10px;
        width: 44px;
        padding-left: 3px;
        padding-right: 3px;
    }
}
</style>