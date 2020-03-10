const electron = require('electron')
const ipc = electron.ipcRenderer

const updater = electron.remote.require('./app/app-updater')
const config = electron.remote.require('./app/configuration')

const remote = electron.remote
const logger = remote.require('./app/logger')

export default {
    props: {
        isCloseBtnOpacity: {
            type: Boolean,
            default: false
        }
    },

    components: {},
    created() {
        logger.info(`Account.js created~~~!`)
    },
    mounted() {
        let self = this
        logger.info(`Account.js mounted~~~!`)
        self.$nextTick(() => {
            self.userInfo = config.readSettings(`userInfo`)
            if (!self.userInfo) self.userInfo = {}
        })
    },
    data() {
        return {
            userInfo: {}
        }
    },
    methods: {
        logout() {
            ipc.send('logout')
        }
    }
}
