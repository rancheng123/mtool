<template>
    <div class="sip-wrap call-phone" v-show="show" @click.prevent="handleWrap">
        <div class="sip-panel">
          <div class="sip-panel-wrap">
            <span class='close' @click.prevent="closeSip"><img src="~assets/newimg/new-close-icon.png" ></span>
            <div class="tip">输入姓名或电话号码邀请参会者</div>
            <div class="form-ctl phone">
                <input
                  type="text"
                  ref="callPhone"
                  id="callPhone"
                  placeholder=""
                  v-show="!showDispaly"
                  v-model="callingPhone"
                >
                <input
                  type="text"
                  ref="callPhoneDisplay"
                  id="showPhone"
                  placeholder=""
                  v-show="showDispaly"
                  v-model="current"
                  @focus.prevent="handleShowFocus"
                >
                <button @click="sipCall()">
                    <span>拨打</span>
                </button>
                <div class="sip-wrap-phone" v-if="showSelect">
                  <div class="sip-wrap-text">{{usrList.length ? '最佳匹配' : '暂无匹配'}}</div>
                  <ul class="sip-wrap-phone-list scroll">
                    <li class="sip-wrap-phone-item" v-for="(item, index) in usrList" :key="index" @click.prevent="handleItem(item)">
                      <span class="sip-wrap-phone-name" v-html='tagPhone(item.displayName)'/></span>
                      <span class="sip-wrap-phone-number" v-html='tagPhone(item.displayNumber)'/>
                    </li>
                  </ul>
                </div>
            </div>
            
            <div class="sip-old-phone">
              <div class="sip-old-text">最近联系{{cacheList.length ? '' : '：无'}}</div>
              <ul class="sip-old-wrap">
                <li class="sip-old-item" v-for="(item, index) in cacheList" :key="index" @click.prevent="handleCache(item)">
                  <span class="text-ellipsis sip-old-displayName">{{item.displayName}}</span><br/><span>{{item.displayNumber}}</span>
                </li>
              </ul>
            </div>
            <!-- <div class="errors">
                <div v-show="error.empty">请输入要拨打的电话</div>
                <div v-show="error.format">格式不正确，请确认</div>
            </div> -->
          </div>
        </div>
    </div>
</template>

<script lang="ts">
/**
 * @file Callphone.js
 * @author shijh
 *
 * 视频会议拨打电话
 *  1. 支持输入电话号码直接拨打
 *  2. 支持搜索拨打
 *  3. 支持拨打历史
 */
import * as Helpers from './helper'
import CnbService from '../../../service/cnbService'
import PhoneHelper from '../../../helpers/phoneHelper'
import { Getter, State } from 'vuex-class'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Callphone extends Vue {
    @Prop() signClient: any
    @Prop({default: false}) show: boolean

    callingPhone: string = ''
    usrList: Array<any> = []
    cacheList: Array<any> = []
    current: string = ''
    showSelect: boolean = false
    item: any = null
    server: any = {
        cancel: function() {}
    }
    showDispaly: boolean = false

    @Watch('show')
    watchShowChange(val) {
        // 显示的时候获取焦点
        if (val) {
            this.cacheList = Helpers.getCache()
            // 每次显示初始化数据
            this.init()

            Vue.nextTick(() => {
                let input: any = this.$refs.callPhone
                if (input) {
                    input.focus()
                }
            })
        }
    }

    @Watch('callingPhone')
    watchPhoneChange(val) {
        this.fetchData(val)
    }

    init() {
        this.showSelect = false
        this.callingPhone = ''
        this.current = ''
        this.item = null
        this.showDispaly = false
    }

    /**
     * 关闭弹出框
     */
    closeSip() {
        this.$emit('closeSip')
    }

    /**
     * 拨打sip电话
     */
    sipCall() {
        let i = null
        if (this.showDispaly) {
            i = this.item
        } else {
            // 为空或则包含中文就不让提交
            if (!this.callingPhone || /[\u4e00-\u9fa5]+/g.test(this.callingPhone)) return
            i = {
                firstName: '未知',
                phoneNumber: this.callingPhone,
                displayName: '未知',
                displayNumber: this.callingPhone
            }
        }

        this.showSelect = false
        this.cacheList = Helpers.addCache(i)
        PhoneHelper.add(i.phoneNumber)
        this.$emit('sipCall', i.phoneNumber)
    }

    /**
     * 点击列表
     * @param {*} item
     */
    handleItem(item) {
        this.current = `${item.displayName} ${item.displayNumber}`
        this.item = item
        this.showDispaly = true
        this.showSelect = false

        this.sipCall()
    }

    /**
     * 标注电话号码
     * @param {*} phone
     */
    tagPhone(phone) {
        return `${phone}`.replace(new RegExp(`${this.callingPhone}`, 'gim'), (item) => {
            return `<span class="subscript">${item}</span>`
        })
    }

    handleWrap() {
        this.showSelect = false
    }

    /**
     * 展示input获取焦点
     */
    handleShowFocus() {
        this.showDispaly = false
        this.callingPhone = this.item.displayName
        this.fetchData(this.callingPhone)
        Vue.nextTick(() => {
            let input: any = this.$refs.callPhone
            if (input) {
                input.focus()
            }
        })
    }

    /**
     * 编辑input获取焦点
     */
    handleCallFocus() {
        Vue.nextTick(() => {
            this.fetchData(this.callingPhone)
        })
    }

    /**
     * 点击缓存号码
     * @param {*} item
     */
    handleCache(item) {
        const { phoneNumber, displayNumber, displayName, firstName } = item
        if (firstName !== '未知') {
            this.callingPhone = displayName
            this.showDispaly = true
            this.current = `${displayName} ${displayNumber}`
            this.item = item

            this.sipCall()
            return
        }
        this.showDispaly = false
        this.callingPhone = phoneNumber

        this.sipCall()
    }

    /**
     * 获取下拉数据
     * @param {*} val
     */
    fetchData(val) {
        val = val.replace(/^\s+|\s+$/gm, '')
        this.callingPhone = val
        // 上次请求还没回来就取消请求
        this.server.cancel()

        if (!val) {
            this.usrList = []
            this.showSelect = false
            return
        }

        this.server = CnbService.users(val)
        this.server.then(res => {
            this.usrList = Helpers.parseList(res.data, this.callingPhone)
            if (!val) return
            this.showSelect = true
        })
    }
}
</script>

<style lang="scss">
  @import './CallPhone';
</style>
