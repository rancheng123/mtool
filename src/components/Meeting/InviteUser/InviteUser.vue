<template>
    <div class="user-invitor">
        <div class="trigger" :class="{'panel-show':showContent}" @click="togglePanel"><img src="~assets/newimg/new-icon-add.png"/>添加参会者</div>
        <div class="con-wrap" v-show="showContent">
            <div class="arrow"></div>
            <div class="invitor-panel">
                <div class="tip">参会者通过会议链接直接浏览器打开即可加⼊会议</div>
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
                    <input type="text" placeholder="通过邮件邀请" v-model="emailAddr" @focus="resetError">
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
    </div>
</template>
<style lang="scss">
@import "./InviteUser";
</style>

<script lang="ts">
import { Getter, State } from 'vuex-class'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import MeetingService from '../../../service/meetingService'
const {
    clipboard
} = require('electron')

@Component
export default class InviteUser extends Vue {
    @Prop() room: any

    showContent: boolean = false
    meetinglink: string = ''
    emailAddr: string = ''
    copied: boolean = false
    genStatus: string = ''
    sended: any = {
        done: false,
        status: ''
    }
    code: string = ''
    error: any = {
        empty: false,
        format: false
    }

    @Watch('room')
    reset() {
        this.meetinglink = ''
        this.resetError()
        this.showContent = false
    }

    togglePanel() {
        this.showContent = !this.showContent
        if (!this.meetinglink) {
            this.genInviteLink()
        }
    }

    genInviteLink() {
        const self = this
        let room = this.room || 27618
        if (room) {
            this.genStatus = 'loading'
            MeetingService.genInviteCode(room).then(res => {
                if (res.status) {
                    self.genStatus = 'done'
                    self.code = res.data
                    self.meetinglink = MeetingService.getServiceUrl() + `/web#${res.data}`
                } else {
                    self.genStatus = 'fail'
                }
            }).catch(() => {
                self.genStatus = 'fail'
            })
        }
    }

    copy() {
        if (this.meetinglink && !this.copied) {
            clipboard.writeText(this.meetinglink)
            this.copied = true
            setTimeout(() => {
                this.copied = false
            }, 5000)
        } else if (this.genStatus === 'fail') {
            this.genInviteLink()
        }
    }

    resetError() {
        this.error = {
            empty: false,
            format: false
        }
    }

    checkEmailValid(email) {
        let regex = /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/ig
        let flag = true
        if (!email) {
            this.error.empty = true
            flag = false
        }
        if (!flag) {
            flag = regex.test(email)
            this.error.empty = flag
            console.log(flag)
        }

        return flag
    }

    send(email) {
        const self = this
        if (!this.checkEmailValid(email) || self.sended.status === 'sending') {
            return
        }

        self.sended.status = 'sending'
        MeetingService.sendInvite(this.code, email).then(res => {

            self.sended.done = true
            if (res.status) {
                self.sended.status = 'ok'
            } else {
                self.sended.status = 'fail'
            }
            this.emailAddr = ''
            self.resetSendStatus()

            return res
        }).catch(() => {
            this.emailAddr = ''
            self.sended.done = true
            self.sended.status = 'fail'
            self.resetSendStatus()
        })
    }

    resetSendStatus() {
        const self = this
        setTimeout(function() {
            self.sended = {
                done: false,
                status: ''
            }
        }, 5000)
    }
}
</script>
