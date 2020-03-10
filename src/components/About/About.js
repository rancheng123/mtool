import Licence from 'components/Licence/Licence.vue'
const electron = require('electron')
const ipc = electron.ipcRenderer

const updater = electron.remote.require('./app/app-updater')
const config = electron.remote.require('./app/configuration')
const guestMode = electron.remote.require('./app/guest-mode')

const remote = electron.remote
const logger = remote.require('./app/logger')

export default {
    props: {
        isCloseBtnOpacity: {
            type: Boolean,
            default: false
        }
    },
    components: {
        Licence
    },

    data() {
        return {
            version: updater.version(),
            series: config.readSettings('mtoolUUID'),
            isShowLicence: false,
            isGuest: false
        }
    },
    mounted() {
        logger.info(`About.js mounted~~!`)
        var self = this
        self.isGuest = guestMode.isGuestMode()
    },
    computed: {
        isLogin() {
            return this.config.readSettings('userInfo')
        }
    },

    watch: {
        '$route': 'routeChange'
    },

    methods: {
        checkForUpdate() {
            ipc.send('check-app-update-from-ui')
        },

        routeChange() {
            let self = this
            self.isShowLicence = false
            if (self.$route.path === '/app/about') {}
        },

        protocolClicked() {
            let self = this
            self.isShowLicence = !self.isShowLicence
        },
        onLicenceCloseClick() {
            let self = this
            self.isShowLicence = false
        },
        backToHome() {
            let self = this
            if (self.$route.path === '/app/about') {
                self.$router.replace({
                    path: '/app/home'
                })
            }
            this.$emit('leave-about')
        }
    }
}
