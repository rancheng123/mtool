<template>
    <div class="con-wrap">
        <div class="invitor-panel">
            <div class="tip">参会者使用浏览器打开链接即可加入会议 <span class='close' @click.prevent="closeInviteLink"><img src="~assets/newimg/new-icon-times.png" ></span></div>
            <div class="form-ctl">
                <label>{{meetinglink}}</label>

                <a class="copy" :class="{copied:copied}" @click="copy">
                    <span v-show="genStatus=='loading'">正在生成链接</span>
                    <span v-show="genStatus=='fail'">重新生成</span>
                    <span v-show="genStatus=='done'&&!copied">复制链接</span>
                    <span v-show="genStatus=='done'&&copied">已经复制</span>
                </a>
            </div>
            <div class="form-ctl email" :class="{error:error.empty||error.format}" v-show="!sended.done">
                <input type="text" placeholder="通过邮件邀请" v-model="emailAddr" @focus="resetEmailError">
                <button @click="send(emailAddr)">
                    <span v-show="sended.status===''">确认发送</span>
                    <span v-show="sended.status==='sending'">正在发送</span>

                </button>
            </div>
            <div class="form-ctl feedback" v-show="sended.done">
                <div class="ok" v-show="sended.status==='ok'">邮件发送成功!</div>
                <div class="fail" v-show="sended.status==='fail'">邀请邮件发送失败，请重新输入邮件地址!</div>
            </div>
            <div class="errors">
                <div v-show="error.empty">请输入Email</div>
                <div v-show="error.format">Email格式不正确，请确认</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Getter, State } from 'vuex-class'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import MeetingService from '../../../service/meetingService'
const electron = require('electron')
const remote = electron.remote
const config = remote.require('./app/configuration')
const {
    clipboard
} = require('electron')

@Component
export default class InviteUser extends Vue {

    @Prop({default: 27618}) room: string

    // 当前转态
    genStatus: string = 'loading'
    // 返回状态
    code: string | number
    // 会议连接
    meetinglink: string = ''
    copyLink: string = ''
    // 是否已经复制
    copied: boolean = false
    emailAddr: string = ''
    // 错误信息
    error: any = {
        empty: false,
        format: false
    }
    // 邮件发送反馈
    sended: any = {
        done: false,
        status: ''
    }
    // 定时器
    timer: any

    mounted() {
        this.getInviteLink()
    }

    distory() {
        clearTimeout(this.timer)
    }

    closeInviteLink() {
        this.$emit('closeInviteLink')
    }

    getInviteLink() {
        let room = this.room
        if (room) {
            this.genStatus = 'loading'
            return MeetingService.genInviteCode(room).then(res => {
                if (res.status) {
                    this.genStatus = 'done'
                    this.code = res.data
                    this.copyLink = `${MeetingService.getServiceUrl()}/web#${res.data}`
                    this.meetinglink = `${this.copyLink}...`
                } else {
                    this.genStatus = 'fail'
                }
            }).catch(() => {
                this.genStatus = 'fail'
            })
        }
    }

    parseMq(url) {
       return url.replace(/^tcp(:\/\/.+):\d+$/, `wss$1/ws`)
    }

    copy() {
        if (this.meetinglink && !this.copied) {
            const ms = config.readSettings('meetingServiceUrl')
            const mq = config.readSettings('meetingMqttDomain');
            clipboard.writeText(`${this.copyLink}?ms=${encodeURIComponent(ms)}&mq=${encodeURIComponent(this.parseMq(mq))}`)
            this.copied = true
            setTimeout(() => {
                this.copied = false
            }, 5000)
        } else if (this.genStatus === 'fail') {
            this.getInviteLink()
        }
    }

    send(email) {
        if (!this.checkEmailValid(email) || this.sended.status === 'sending') {
            return
        }

        this.sended.status = 'sending'
        return MeetingService.sendInvite(this.code, email).then(res => {

            this.sended.done = true
            if (res.status) {
                this.sended.status = 'ok'
            } else {
                this.sended.status = 'fail'
            }
            this.emailAddr = ''
            this.resetSendStatus()

            return res
        }).catch(() => {
            this.emailAddr = ''
            this.sended.done = true
            this.sended.status = 'fail'
            this.resetSendStatus()
        })
    }

    resetEmailError() {
        this.error.empty = false
        this.error.format = false
    }

    resetSendStatus() {
        this.timer = setTimeout(() => {
            this.sended = {
                done: false,
                status: ''
            }
        }, 5000)
    }

    checkEmailValid(email) {
        let regex = /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/ig
        let flag = false
        if (!email) {
            this.error.empty = true
            return false
        }

        flag = regex.test(email)
        this.error.format = !flag

        return flag
    }
}
</script>

<style lang="scss">
@import "./InviteModal";
</style>
