const electron = require('electron')
const remote = electron.remote
const ipc = electron.ipcRenderer
const CONFIG = remote.require('./app/configuration')
const logger = remote.require('./app/logger')
const guestMode = remote.require('./app/guest-mode')

import {Tooltip} from 'element-ui'
import EventBus from './helpers/event-bus'

export default {
    components: {
        'el-tooltip': Tooltip
    },

    props: [],

    data() {
        return {
            isFullscreen: false,
            isShowNav: true,
            isOverHeader: false,
            isGuest: false,
            hasPrinter: false
        }
    },

    computed: {
        isFullscreenMode: function() {
            return this.$store.state.isFullscreenMode
        },
        isShowHeader: function() {
            return this.isFullscreenMode ? (this.isOverHeader || this.$store.state.isShowHeader) : true
        },
        isAlreadyLogin() {
            return this.$store.state.isLogin
        }
    },

    watch: {
        '$route': 'routeChange'
    },

    created() {
        this.hasPrinter = CONFIG.readSettings('hasPrinter');
    },

    mounted() {
        var self = this
        self.isGuest = guestMode.isGuestMode()
        ipc.on('fetch-config-success', () => {
            this.hasPrinter = CONFIG.readSettings('hasPrinter');
        })
    },

    destroyed() {

    },

    methods: {
        overHeader() {
            this.isOverHeader = true
        },
        leaveHeader() {
            this.isOverHeader = false
        },
        hideWindow() {
            if (this.isFullscreen) {
                this.maxWindow()
                setTimeout(() => {
                    logger.info('try hide window')
                    remote.getCurrentWindow().hide()
                }, 150)

            } else {
                remote.getCurrentWindow().hide()
            }

        },
        minWindow() {
            remote.getCurrentWindow().minimize()
        },
        maxWindow() {
            this.isFullscreen = !this.isFullscreen
            remote.getCurrentWindow().setFullScreen(this.isFullscreen)
        },
        toPrinter() {
            if (!this.isAlreadyLogin) {
                return
            }
            EventBus.$emit('GoToPrinterView');
            logger.info(`toPrinter`)
            this.$router.push('/app/printer')
        },
        toHome() {
            if (!this.isAlreadyLogin) {
                return
            }
            logger.info(`toHome`)
            this.$router.push('/app/home')

        },
        routeChange(to, from) {
            // if (!this.$router.path){
            //     this.isShowNav = true
            // } else if (this.$router.path.indexOf('meeting') < 0) {
            //     this.isShowNav = true
            // } else {
            //     this.isShowNav = false
            // }
            //
            if (to.path.indexOf('meeting') > 0) {
                this.isShowNav = false
            } else {
                this.isShowNav = true
            }
        }
    }
}
