<template>
    <div v-show="userInfo.hasCamera" 
      :id="'agv-' + stream.streamId" 
      class="video-wrap"
      style="overflow: hidden; height: 100%;"></div>
</template>

<script lang="ts">
import { Getter, State } from 'vuex-class'
import { mapState } from 'vuex'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { setTimeout } from 'timers'
import AudioAnalyserEmitter from './AudioAnalyserEmitter'
const electron = require('electron')
const logger = electron.remote.require('./app/logger')

@Component
export default class Stream extends Vue {
  @Prop() stream: any
  @Prop() index: number
  @Prop() userInfo: any
  @Prop() userState: any
  @Getter('meeting/getLocalStatus') storeGetLocalStatus: any
  @Getter('isFullscreenMode') isFullscreenMode: boolean
  @Getter('meeting/major') storeMajor: any

  decibel: number = 0
  levelChecker: any = null
  liveSource: any = null
  audioCtx: any = null

  autoFixSize() {
    const { stream, streamId } = this.stream
    const agv = document.querySelector(`#agv-${streamId}`)
    const video = agv.querySelector('video')
    const { videoSize } = stream
    this.$emit('autoFixSize', { width: videoSize[0], height: videoSize[1] })
  }

  // @Watch('storeGetLocalStatus')
  // watchStoreGetLocalStatus(n, o) {
  //     this.$nextTick(() => {
  //         this.autoFixSize()
  //     })
  // }

  // @Watch('userInfo.audio')
  @Watch('userState')
  watchUserState(n, o) {
    this.$nextTick(() => {
      console.log('AutoSize', 'userState');
      setTimeout(() => this.autoSize(), 1000)
      // setTimeout(() => this.audioAnalyser(this.stream.stream.stream, true), 1000)
    })
  }

  @Watch('stream.stream')
  watchStream(n, o) {
    console.log('AutoSize', 'stream');
    this.$nextTick(() => {
      const { stream, streamId } = this.stream
      const agv = document.querySelector(`#agv-${streamId}`)
      if (agv && stream && !stream.isPlaying()) {
        agv.innerHTML = ''
        stream.play(`agv-${streamId}`)
        this.autoSize()
        // console.log('audioAnalyser stream 收到流更新');
        // setTimeout(() => this.audioAnalyser(stream.stream), 1000)
      }
    })
  }

  /**
   * 视频音频分贝获取
   * chrome内核规定同时最多6个ACtx 所以人数超过6个之后会失效
   * @param {Stream} streamObj [description]
   */
  audioAnalyser (stream, audioUpdate: boolean = false) {
    if (!stream || !window.hasOwnProperty('AudioContext')) {
      return false
    }

    if (this.levelChecker && this.levelChecker.onaudioprocess) {
      if (audioUpdate) {
        this.levelChecker.disconnect()
        this.liveSource.disconnect()
        this.audioCtx.close()
        console.log('audioAnalyser ' + this.stream.streamId + ' destroyed')
      } else {
        return false
      }
    }

    let linkedStreamId = null

    if (/microphone/.test(this.userInfo.type) && this.userInfo.linkedUid) {
      let people = this.$store.state.meeting.members.get(this.userInfo.linkedUid)
      if (!!people && !!people.streamId) {
        linkedStreamId = people.streamId
        logger.info('audioAnalyser ' + this.stream.streamId + '音轨附加到' + linkedStreamId)
      }
    } else if (/tv/.test(this.userInfo.type) && this.userInfo.audio !== 'on' && this.userInfo.controllerId) {
      let people = this.$store.state.meeting.members.get(this.userInfo.controllerId)
      if (!!people && !!people.streamId) {
        let linkedStream = this.$store.state.stream.streams[people.streamId]
        if (linkedStream && linkedStream.stream) {
          stream = linkedStream.stream.stream
          logger.info('audioAnalyser ' + this.stream.streamId + '音频流替换为' + people.streamId)
        } else {
          logger.info('audioAnalyser ' + this.stream.streamId + '未获取到controller')
        }
      }
    } else if (!this.userInfo.visble) {
      logger.info('audioAnalyser ' + this.stream.streamId + '流不可见')
      return false
    }

    try {
      this.audioCtx = new window['AudioContext']()
      let auidoTracks = stream.getAudioTracks()
      if (auidoTracks && auidoTracks.length > 0) {
        this.liveSource = this.audioCtx.createMediaStreamSource(stream)
        this.levelChecker = this.audioCtx.createScriptProcessor(512, 1, 1)
        this.liveSource.connect(this.levelChecker)
        this.levelChecker.connect(this.audioCtx.destination)
      } else {
        logger.info('audioAnalyser ' + this.stream.streamId + '初始化音频分析失败::无音轨')
        return false
      }
    } catch (e) {
      logger.info('audioAnalyser ' + this.stream.streamId + '初始化音频分析失败::' + e.message)
      return false
    }

    if (this.levelChecker) {
      logger.info('audioAnalyser ' + this.stream.streamId + '初始化音频分析成功')
      this.levelChecker.onaudioprocess = (e) => {
        var buffer = e.inputBuffer.getChannelData(0)

        var maxVal = 0
        for (var i = 0; i < buffer.length; i++) {
          if (maxVal < buffer[i]) {
            maxVal = buffer[i]
          }
        }
        let decibel = Math.round(maxVal * 100)
        if (linkedStreamId) {
          AudioAnalyserEmitter.$emit('updateDecibel_' + linkedStreamId, decibel * 1.8)
        } else {
          this.$emit('updateDecibel', decibel)
        }
      }
    }
  }

  getPercent(elememt, denominator) {
    const count = Math.ceil(elememt / denominator * 100)
    return `${count}%`
  }

  autoSize() {
    // 192 108
    const { stream, streamId } = this.stream
    this.$nextTick(() => {
      const agv = document.querySelector(`#agv-${streamId}`)
      if (!agv) return false
      const video = agv.querySelector('video')
      const pw = agv.clientWidth
      const ph = agv.clientHeight
      if (
        this.storeMajor &&
        this.isFullscreenMode &&
        `${this.storeMajor.uid}` === `${this.userInfo.uid}`
      ) {
        if (this.userInfo.status === 'sharing') {
          video.style.height = '100%'
          video.style.width = '100%'
          video.style.margin = '0 0 0 0'
          video.style.objectFit = 'contain'
        } else {
          video.style.objectFit = 'cover'
          video.style.height = 'initial'
          video.style.width = 'initial'
          video.addEventListener(
            'play',
            e => {
              const vw = video.clientWidth
              const vh = video.clientHeight
              // const vw = 192
              // const vh = 108
              const prate = ph / pw
              const vrate = vh / vw
              const hrate = ph / vh
              const wrate = pw / vw
              if (prate > vrate) {
                video.style.height = `100%`
                const width = vw * hrate
                video.style.margin = `0 0 0 -${this.getPercent((width - pw) / 2, width)}`
              } else {
                video.style.width = `100%`
                const height = vh * wrate
                video.style.margin = `-${this.getPercent((height - ph) / 2, height)} 0 0 0`
              }
            },
            false
          )
        }
      } else if (video) {
        if (this.userInfo.status === 'sharing') {
          video.style.height = '100%'
          video.style.width = '100%'
          video.style.margin = '0'
          video.style.objectFit = 'contain'
        } else {
          video.style.height = `${ph}px`
          video.style.width = 'initial'
          // 需要在播放事件触发的的时候获取宽度，不然获取的值为350
          video.addEventListener(
            'play',
            () => {
              video.style.position = 'initial'
              console.log()
              video.style.margin = `0 0 0 -${this.getPercent((video.clientWidth - pw) / 2, video.clientWidth)}`
            },
            false
          )
        }
      }
    })
  }

  mounted() {
    const { stream, streamId } = this.stream
    stream.play(`agv-${streamId}`)
    this.autoSize()
    // setTimeout(() => this.audioAnalyser(stream.stream), 1000)
  }

  destroyed() {
    const { stream, streamId } = this.stream
    if (stream.isPlaying()) {
      stream.stop()
      console.log('will unmout')
    }

    /**
    * 清除视频流链接
    */
    console.log('audioAnalyser', this.stream.streamId, 'destroyed')
    if (this.levelChecker) {
      this.levelChecker.disconnect()
    }
    if (this.liveSource) {
      this.liveSource.disconnect()
    }
    if (this.audioCtx) {
      this.audioCtx.close()
    }
  }
}
</script>

<style>
.plause-play {
  margin-left: 70px;
  position: relative;
  z-index: 9999;
  height: 40px;
  background: #fff;
}
</style>


