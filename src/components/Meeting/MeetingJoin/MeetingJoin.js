import MeetingService from '../../../service/meetingService'
import ErrorHandle from '../../../helpers/error/errorhandle'

import AccessorialTitleBar from 'src/components/AccessorialTitleBar/AccessorialTitleBar.vue'
import TitleBar from 'src/components/TitleBar/TitleBar.vue'

const electron = require('electron')
const remote = electron.remote
const MQ = remote.require('./app/mqmessage')
const config = remote.require('./app/configuration')
const MtoolUUID = config.readSettings('mtoolUUID')
const logger = remote.require('./app/logger')
export default {
    components: {
        AccessorialTitleBar,
        TitleBar
    },

    props: ['showType', 'meetingtimeout'],

    data() {
        return {
            isJoined: false,
            room: '',
            userInfo: {},
            error: {
                room_not_exist: false,
                empty_room: false,
                room_is_full: false,
                screenid_error: false
            }
        }
    },

    computed: {
        isJoinedState() {
            let joinState = this.meetingtimeout ? false : this.isJoined
            // 简直了
            this.isJoined = joinState
            return joinState
        }
    },

    watch: {
        'showType': 'showTypeChange'
    },

    created() {},

    mounted() {
        var self = this
        self.userInfo = config.readSettings('userInfo')
    },

    destroyed() {

    },


    methods: {
        showTypeChange(n, o) {
            this.clearStatus()
        },
        checkRoomId() {
            let room = this.room

            return !!room
        },
        clearStatus() {
            this.isJoined = false
            this.room = ''
            this.error = {
                room_not_exist: false,
                empty_room: false,
                room_is_full: false,
                screenid_error: false
            }
        },
        changeErrTip(errTip) {
            const self = this
            Object.keys(self.error).forEach(function(key) {
                self.error[key] = false
            })
            self.error[errTip] = true
        },
        checkRoom() {
            if (this.isJoined) {
                return
            }

            if (!/^[0-9]+$/.test(this.room)) {
                this.changeErrTip('screenid_error')
                return
            }

            const self = this
            logger.info(`Step: joinmeeting checkRoom start`)
            if (this.checkRoomId()) {
                this.isJoined = true
                logger.info(`Step: joinmeeting checkScreenExist start`)
                let startTime = new Date()
                return MeetingService.joinMeeting(this.room).then(res => {
                    let endTime = new Date()
                    if (res.status) {
                        let streamId = MQ.generateNumberID()
                        let member = {
                            id: self.userInfo.id,
                            uid: self.userInfo.id,
                            streamId: streamId,
                            userName: self.userInfo.fullName || '',
                            room: self.room, // 在Meeting.vue中绑定过来
                            screen: '', // 在Meeting.vue中绑定过来
                            role: 'joiner'
                        }
                        self.joinMeeting()

                        logger.info(`MeetingService.joinMeeting time-consume:${endTime - startTime} response users ${JSON.stringify(res.users)}`)
                        self.$emit('roominfo', {
                            member: member,
                            duration: res.duration,
                            users: res.users || []
                        })
                    } else {
                        self.isJoined = false
                        if (res.full) {
                            self.changeErrTip('room_is_full')
                        } else {
                            self.changeErrTip('room_not_exist')

                        }
                    }
                }).catch((err) => {
                    console.log('check error')
                    console.log(err)
                    ErrorHandle.showErrorMessage({
                        code: 'server_error'
                    })
                    self.isJoined = false
                })
            } else {
                this.isJoined = false
                self.changeErrTip('empty_room')
            }

        },
        joinMeeting() {
            this.$emit('join-meeting', {
                screen: '',
                room: this.room,
                profile: this.profile
            })
            // setTimeout(() => {
            //     this.clearStatus()
            // }, 1000)

        },
        cancel() {
            this.clearStatus()
            this.$emit('cancel')
        }
    }
}
