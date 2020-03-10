import { Component, Vue } from 'vue-property-decorator'
import ErrorHandle from '../../../../helpers/error/errorhandle'
import {
  capture
} from '../../../../helpers/agora/chrome'

const electron = require('electron')
const remote = electron.remote
const logger = remote.require('./app/logger')
const MQ = remote.require('./app/mqmessage')

@Component
export default class Handle extends Vue {
  time: any = {
    label: '',
    count: 0,
    timer: null
  }
  /**
   * 错误提醒
   * @param message
   * @param type
   */
  ErrorHandle(message, type = 'message') {
    ErrorHandle.showErrorMessage({
      [type]: message
    })
  }

  /**
   * 分享获取屏幕
   * @param index
   */
  GetWindows(index = 0) {
    const self = this
    return new Promise((resolve, reject) => {
      capture.getWindows().then((wins) => {
        logger.info(`Step: meeting 分享屏幕 agoraClient.startShareScreen() in capture.getWindows callback`)
        let op: any = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: wins[index].id,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080
            }
          }
        }
        let success = function (stream) {
          resolve(stream)
        }
        let error = function (e) {
          logger.error(e)
        }
        navigator.getUserMedia(op, success, error)
      }, (error) => {
        reject(error)
      })
    })
  }

  /**
   * 会议计时器
   * @param duration
   */
  countTime(duration) {
    console.log('count time')
    const self: any = this
    let count = duration || 0
    clearInterval(this.time.timer)

    this.time.timer = setInterval(() => {
      count += 1
      if (count < 60) {
        let countlabel = ''
        if (count < 10) {
          countlabel = '0' + count
        } else {
          countlabel = count
        }
        self.time.label = `00:00:${countlabel}`
      } else if (count < 60 * 60) {
        let min = parseInt(`${count / 60}`)
        let minLabel = ''
        if (min < 10) {
          minLabel = '0' + min
        } else {
          minLabel = `${min}`
        }
        let sec = parseInt(`${count % 60}`)
        let secLabel = ''
        if (sec < 10) {
          secLabel = '0' + sec
        } else {
          secLabel = `${sec}`
        }
        self.time.label = `00:${minLabel}:${secLabel}`
      } else {
        let hour = parseInt(`${count / 3600}`)
        let temp = parseInt(`${count % 3600}`)
        let min = parseInt(`${temp / 60}`)


        let hourLabel = ''
        if (hour < 10) {
          hourLabel = '0' + hour
        } else {
          hourLabel = `${hour}`
        }

        let minLabel = ''
        if (min < 10) {
          minLabel = '0' + min
        } else {
          minLabel = `${min}`
        }

        let sec = parseInt(`${temp % 60}`)
        let secLabel = ''
        if (sec < 10) {
          secLabel = '0' + sec
        } else {
          secLabel = `${sec}`
        }
        self.time.label = `${hourLabel}:${minLabel}:${secLabel}`
      }

    }, 1000)
  }

  /**
   * mq消息发送
   * @param room
   * @param action
   * @param member
   */
  MQPublish(room, action, member, callback = () => {}) {
    MQ.publish(`meetingid-${room}`, JSON.stringify({
      action,
      member
    }), callback)
  }
}
