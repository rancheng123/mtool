import {
    Message,
    MessageBox
} from 'element-ui'
import SmartOfficeAPI from '../../../service/SmartOfficeAPI'
import MeetingService from '../../../service/meetingService'
import ErrorHandle from '../../../helpers/error/errorhandle'

import AccessorialTitleBar from 'src/components/AccessorialTitleBar/AccessorialTitleBar.vue'
import TitleBar from 'src/components/TitleBar/TitleBar.vue'

const electron = require('electron')
const remote = electron.remote
const deviceCtl = remote.require('./app/devicecontroll')
const logger = remote.require('./app/logger')
const config = remote.require('./app/configuration')
export default {
    components: {
        AccessorialTitleBar,
        TitleBar
    },

    props: ['isVip', 'showType', 'timeout'],

    data() {
        return {
            isJoined: false,
            screen: '',
            storeScreen: '',
            error: {
                screen_not_exist: false,
                empty_screen: false,
                can_not_start: false,
                screen_not_support: false,
                screen_status_wrong: false,
                screenid_error: false
            }
        }
    },

    computed: {},

    watch: {
        '$route': 'routeChange',
        'showType': 'showTypeChange',
        'timeout': 'dotimeout'
    },

    created() {},

    mounted() {
        logger.debug(`MeetingCreate mounted`)
        var self = this
    },

    destroyed() {},

    methods: {
        vipmeeting() {
            let self = this
            self.isJoined = true
            self.createMeeting(false, self.isVip)
        },
        dotimeout(n) {
            let self = this
            logger.info(`dotimeout(${n})`)
            if (n === true) {
                self.errorInstance = ErrorHandle.showErrorMessage({
                    message: '当前网络异常，请重试'
                })
                self.isJoined = false

            }
        },
        routeChange() {
            this.resetStatus()
        },
        createRoomId() {
            return this.storeScreen
        },
        join(res, screen) {
            let self = this
            self.storeScreen = self.screen = screen
            logger.info(`Step: meeting join isJoined:${self.isJoined} storeScreen:${self.storeScreen}`)
            // if (self.isJoined) {
            //     return
            // }
            // self.isJoined = true
            logger.info(`Step: meeting join MeetingService.joinMeeting(screen:${screen}) start`)
            let startTime = new Date()
            return MeetingService
                .joinMeeting(screen)
                .then(response => {
                    let endTime = new Date()
                    logger.info(`Step: meeting join MeetingService.joinMeeting(screen:${screen}) time-consume:${endTime - startTime} response:${JSON.stringify(res)}`)
                    if (res.isScreenPro && res.isOnline) {
                        return self.createMeeting()
                    } else if (!res.isScreenPro || !res.hasCamera) {
                        return self.createMeeting(true)
                    } else {
                        self.isJoined = false
                        logger.info(`MeetingService.joinMeeting return res.isOnline false`)
                        ErrorHandle.showErrorMessage({
                            message: '加入会议失败'
                        })
                    }
                    return response
                })

        },

        changeErrTip(errTip) {
            const self = this
            Object.keys(self.error).forEach(function(key) {
                self.error[key] = false
            })
            if (errTip) {
                self.error[errTip] = true
            }
        },
        showTypeChange(n, o) {
            this.resetStatus()
        },
        checkScreenExist() {
            let self = this
            let screen = self.screen
            if (self.screen && self.screen.trim() === '') {
                self.changeErrTip('empty_screen')
                return
            }

            if (!/^[0-9]+$/.test(self.screen)) {
                self.changeErrTip('screenid_error')
                return
            }

            if (self.isJoined) {
                return
            }
            self.isJoined = true
            logger.info(`Step: meeting checkScreenExist start`)
            let startTime = new Date()
            SmartOfficeAPI
                .checkScreenExist(screen)
                .then((res) => {
                    let endTime = new Date()
                    logger.info(`Step: meeting checkScreenExist time-consume:${endTime - startTime} response ${JSON.stringify(res)}`)
                    if (res.status && res.isOnline) {
                        let screenStatusstartTime = new Date()
                        self.changeErrTip()
                        logger.info(`MeetingService.screenStatus start`)
                        return MeetingService.screenStatus(res.macAddr).then((screenStatusRes) => {
                            let screenStatusendTime = new Date()
                            logger.info(`MeetingService.screenStatus time-consume:${screenStatusendTime - screenStatusstartTime}`)
                            if (screenStatusRes.status) {
                                if (screenStatusRes.data === 'used') {
                                    // 会议中
                                    return MessageBox.confirm(`屏幕(${screen})正在使用, 是否将对方踢下线?`, '提示', {
                                        showCancelButton: true,
                                        confirmButtonText: '确定',
                                        cancelButtonText: '取消',
                                        showConfirmButton: true,
                                        closeOnClickModal: false
                                    }).then(() => {
                                        logger.info(`Step: meeting 抢屏 genNewScreenId ${res.macAddr}`)
                                        let genNewScreenIdstartTime = new Date()
                                        return SmartOfficeAPI
                                            .genNewScreenId(res.macAddr)
                                            .then((result) => {
                                                let genNewScreenIdendTime = new Date()
                                                logger.info(`SmartOfficeAPI.genNewScreenId time-consume:${genNewScreenIdendTime - genNewScreenIdstartTime}`)
                                                if (result.status) {
                                                    logger.info(`Step: meeting 抢屏 join`)
                                                    return self.join(res, result.screenId)
                                                } else {
                                                    logger.error(`SmartOfficeAPI.genNewScreenId status false`)
                                                    ErrorHandle.showErrorMessage({
                                                        message: '生成屏幕代码失败'
                                                    })
                                                    self.isJoined = false
                                                }
                                            })
                                            .catch((err) => {
                                                logger.error(`SmartOfficeAPI.genNewScreenId fail ${JSON.stringify(err)}`)
                                                ErrorHandle.showErrorMessage({
                                                    message: '生成屏幕代码失败'
                                                })
                                                self.isJoined = false
                                            })
                                    }).catch(() => {
                                        logger.info(`Step: meeting 抢屏 取消抢屏}`)
                                        self.isJoined = false
                                    })
                                } else if (screenStatusRes.data === 'unused') {
                                    logger.info(`Step: meeting 非抢屏 发起会议 join`)
                                    return self.join(res, screen)
                                }
                            } else {
                                // screenStatusRes.status false
                                self.isJoined = false
                                logger.info(`MeetingService.screenStatus return false`)
                                ErrorHandle.showErrorMessage({
                                    message: '屏幕状态查询失败'
                                })
                            }
                        }).catch((err) => {
                            self.isJoined = false
                            logger.error(`MeetingService.screenStatus fail ${JSON.stringify(err)}`)
                            ErrorHandle.showErrorMessage({
                                message: '屏幕状态查询失败'
                            })
                        })
                    } else {
                        logger.info(`SmartOfficeAPI.checkScreenExist(screen) retrun status false or offline`)
                        self.isJoined = false
                        self.changeErrTip('screen_not_exist')
                    }
                })
                .catch((err) => {
                    logger.error(`SmartOfficeAPI.checkScreenExist fail ${JSON.stringify(err)}`)
                    self.isJoined = false
                    ErrorHandle.showErrorMessage({
                        code: 'server_error'
                    })
                })
        },
        resetStatus() {
            this.isJoined = false
            this.screen = ''
            this.storeScreen = ''
            this.error = {
                screen_not_exist: false,
                empty_screen: false,
                can_not_start: false,
                screen_status_wrong: false,
                screen_not_support: false,
                screenid_error: false
            }
        },
        createMeeting(isFake, isVip) {
            const self = this
            logger.info(`Step: meeting MeetingCreating createMeeting()`)
            let room = this.createRoomId()
            let msg = {
                screen: self.storeScreen,
                room: room,
                isFake: !!isFake
            }

            if (isVip) {
                let startTime = new Date()
                logger.info(`SmartOfficeAPI.vipmeeting() start`)
                return SmartOfficeAPI.vipmeeting().then((res) => {
                    let endTime = new Date()
                    logger.debug(`SmartOfficeAPI.vipmeeting() time-consume:${endTime - startTime} response: ${JSON.stringify(res)}`)

                    msg.screen = res.screenId
                    msg.room = res.screenId
                    msg.vip = true

                    let joinMeetingstartTime = new Date()
                    return MeetingService
                        .joinMeeting(msg.screen)
                        .then(response => {
                            let joinMeetingendTime = new Date()
                            logger.info(`Step: vip meeting join MeetingService.joinMeeting(screen:${msg.screen}) time-consume:${joinMeetingendTime - joinMeetingstartTime} response:${JSON.stringify(response)}`)
                            logger.info('emmit vip create-meeting event' + JSON.stringify(msg))
                            self.$emit('create-meeting', msg)

                            setTimeout(() => {
                                self.resetStatus()
                            }, 100)
                            return response
                        }).catch(err => {
                            logger.error(`MeetingService.joinMeeting err: ${err}`)
                            this.resetStatus()
                        })
                }).catch(err => {
                    logger.error(`SmartOfficeAPI.vipmeeting err: ${err}`)
                    this.resetStatus()
                })
            } else {
                logger.info('emmit create-meeting event' + JSON.stringify(msg))
                this.$emit('create-meeting', msg)

                // 如果不是vip，需要先禁用取消


                // setTimeout(() => {
                //     self.resetStatus()
                // }, 100)
            }


        },
        cancel() {
            this.$emit('cancel')

            this.resetStatus()
        }
    }
}
