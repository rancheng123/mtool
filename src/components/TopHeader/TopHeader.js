import NavMenu from 'components/NavMenu/NavMenu.vue'
const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const config = remote.require('./app/configuration')

export default {
    components: { NavMenu },

    props: {
        title: String,
        isShowLogo: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            isShowUserInfo: false,
            userInfo: {},
            showCloseBtn: false
        }
    },

    computed: {
    },

    watch: {
    },

    created() {
    },

    mounted() {
        var self = this

        self.$nextTick(() => {
            self.userInfo = config.readSettings('userInfo')
        })
    },

    destroyed() {

    },

    methods: {
        showUserInfo() {
            this.isShowUserInfo = !this.isShowUserInfo
        },

        hideUserInfo() {
            this.isShowUserInfo = false
        },

        onPopupClicked(event) {
            event.stopPropagation()
        },

        hideWindow() {
            remote.getCurrentWindow().hide()
        },

        minWindow() {
            remote.getCurrentWindow().minimize()
        },

        logout() {
            ipc.send('logout')
        }
    }
}
