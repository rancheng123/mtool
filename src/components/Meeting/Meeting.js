import SmartOfficeAPI from '../../service/SmartOfficeAPI'

import MeetingCreate from './MeetingCreate/MeetingCreate.vue'
import MeetingJoin from './MeetingJoin/MeetingJoin.vue'
import MeetingView from './MeetingView/MeetingView.vue'
import AccessorialTitleBar from '../AccessorialTitleBar/AccessorialTitleBar.vue'
import TitleBar from '../TitleBar/TitleBar.vue'

import MView from './MeetingView/MView.vue'

const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const guestMode = remote.require('./app/guest-mode')
const logger = remote.require('./app/logger')
export default {
    components: {
        'meeting-create': MeetingCreate,
        'meeting-join': MeetingJoin,
        'meeting-view': MeetingView,
        'm-view': MView,
        AccessorialTitleBar,
        TitleBar
    },

    props: {

    },

    data() {

        return {
            /**
             * 页面显示逻辑
             * create 发起会议
             * join 加入会议
             * control 投屏，电视控制页面
             */
            showType: '',
            screen: '',
            room: '',
            meetingTimer: null,
            quit: false,
            tostartMeeting: 'no',
            roomInfo: {
                users: []
            },
            meetingtimeout: false,
            isGuest: false
        }
    },

    computed: {
        isVip: function() {
            return this.$store.state.isVip
        }
    },

    watch: {
        '$route': 'routeChange',
        'showType': 'showTypeChange'
    },

    created() {
        console.log('created')
    },

    mounted() {
        var self = this
        self.isGuest = guestMode.isGuestMode()
    },

    destroyed() {

    },
    methods: {
        setRoomInfo(e) {
            this.roomInfo = e
        },
        toHome() {
            this.$router.replace({
                path: '/app/home'
            })
        },
        showTypeChange(n, o) {
            if (n === 'create' || n === 'join') {
                let input = document.getElementById(`meeting-input-${n}`)

                if (input) {
                    setTimeout(() => {
                        input.focus()
                    }, 100)

                }
            }
            if (n !== 'view') {
                this.reset()
            }

        },
        routeChange() {
            this.showType = ''
            this.roomInfo = {
                users: []
            }
            this.reset()
            // this.quit = true
        },
        tocancel() {
            this.showType = ''
            this.roomInfo = {
                users: []
            }
            this.reset()
            this.quit = true
        },
        create() {
            let self = this

            self.showType = 'create'

        },
        startTimer() {
            let self = this
            if (self.meetingTimer) {
                clearTimeout(self.meetingTimer)
                self.meetingTimer = null
            }
            logger.info(`meetingTimer start`)
            self.meetingTimer = setTimeout(() => {
                logger.info(`meetingTimer timeout`)
                self.meetingtimeout = true
                setTimeout(function() {
                    self.meetingtimeout = false
                    self.tostartMeeting = 'no'
                }, 500)
            }, 30000)

        },
        setMeetingInfo(info) {
            let self = this
            logger.debug(`setMeetingInfo ${JSON.stringify(info)}`)
            if (info && info.room) {
                this.screen = info.screen
                this.tostartMeeting = 'yes'
                this.roomInfo.isFake = info.isFake
                this.roomInfo.isVip = info.vip
                if (this.roomInfo.isVip || this.roomInfo.isFake) {
                    this.showType = 'view'
                } else {
                    self.startTimer()
                }
                this.room = info.room + ''
            }
        },
        showview() {
            let self = this
            this.showType = 'view'
            logger.info(`showview`)
            // 清除timer
            if (self.meetingTimer) {
                logger.info(`clear meetingTimer`)
                clearTimeout(self.meetingTimer)
                self.meetingTimer = null
                self.meetingtimeout = false
            }
        },
        join() {
            this.showType = 'join'
        },
        project() {
            let screen = this.screen
            if (screen === '') {
                this.error.empty_screen = true
                return
            }

            this.showType = 'control'
        },
        cancel() {
            this.$router.replace({
                path: '/app/home'
            })
        },
        reset() {
            this.room = ''
            this.screen = ''
            this.tostartMeeting = 'no'
            let query = this.$route.query || {}
        }
    }
}
