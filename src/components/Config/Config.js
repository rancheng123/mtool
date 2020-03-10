const electron = require('electron')
const ipc = electron.ipcRenderer
const Vue = require('vue');
const remote = electron.remote
const CONFIG = remote.require('./app/configuration')
const IOT = remote.require('./app/iot')
const logger = remote.require('./app/logger')
const guestMode = remote.require('./app/guest-mode')

export default {
    components: {},

    props: {
        backUrl: {
            type: String,
            default: undefined
        },

        finishedCallback: {
            type: Function,
            default: undefined
        }
    },

    data() {
        return {
            isAutoStart: true,
            fromRouterPath: '/app/projector',
            smartOfficeServerUrl: '',
            janusServerUrl: '',
            meetingServerUrl: '',
            useQA: false,
            isGuest: false,
            activeCode: '',
            showActiveCodeError: false,
            isDebug: false
        }
    },

    computed: {
        onlyShowConfigMenu() {
            return !window.bridge.configuration.readSettings('userInfo')
        }
    },

    watch: {
        '$route': 'routeChange',
        'isAutoStart': 'autoStartChange',
        'activeCode': 'validateCode',
        'isDebug': (ev)=>{
            ipc.send('switchDebug',ev)
        }
    },

    created() {
        let self = this
        self.readConfig()
        self.$router.beforeEach((to, from, next) => {
            if (to.path === '/app/config') {
                self.fromRouterPath = from.path
            }
            next()
        })
    },

    mounted() {
        var self = this
        logger.info(`Config mounted~~~! ${self.fromRouterPath}`)
        self.isGuest = guestMode.isGuestMode()

        ipc.on('fetch-config-success', self.readConfig)

    },

    destroyed() {
    },

    methods: {
        readConfig() {
            const self = this;
            self.smartOfficeServerUrl = CONFIG.readSettings('smartOfficeServerUrl')
            self.janusServerUrl = CONFIG.readSettings('janusServerUrl')
            self.isAutoStart = CONFIG.readSettings('isAutoStart')
            // 默认true
            if (self.isAutoStart !== false) {
                self.isAutoStart = true;
            }
            self.activeCode = CONFIG.readSettings('activeCode')
        },
        submitConfig() {
            let self = this
            CONFIG.saveSettings('activeCode', self.activeCode)
            this.setToQA().then(() => {
                if (self.janusServerUrl && self.smartOfficeServerUrl) {
                    let config = {
                        smartOfficeServerUrl: self.smartOfficeServerUrl,
                        janusServerUrl: self.janusServerUrl,
                        isAutoStart: self.isAutoStart,
                        fromRouterPath: self.backUrl ? self.backUrl : self.fromRouterPath,
                        meetingServerUrl: self.meetingServerUrl,
                        activeCode: self.activeCode
                    }

                    let shouldLogout = false

                    if (self.smartOfficeServerUrl !== CONFIG.readSettings('smartOfficeServerUrl')) {
                        shouldLogout = true
                    }
                    ipc.send('save-config', config)
                    if (shouldLogout) {
                        ipc.send('logout')
                    }
                } else {
                    window.alert('服务器地址和投影服务器地址都必须填写')
                }
            })
        },
        setToQA() {
            // true 为qa，false 为正式
            return IOT.fetchConfig(false)
        },
        cancleConfig() {
            if (this.finishedCallback) {
                this.finishedCallback()
            } else {
                this.$router.replace({
                    path: this.fromRouterPath
                })
            }
        },

        routeChange() {
            this.smartOfficeServerUrl = CONFIG.readSettings('smartOfficeServerUrl')
            this.janusServerUrl = CONFIG.readSettings('janusServerUrl')
            this.isAutoStart = CONFIG.readSettings('isAutoStart')
            if (this.isAutoStart !== false) {
                this.isAutoStart = true;
            }
            this.activeCode = CONFIG.readSettings('activeCode')
        },

        autoStartChange(newVal) {
            // console.log(`set auto start: ${newVal}`)
            CONFIG.saveSettings('isAutoStart', newVal);
            if (!newVal) {
                // 提示用户mtool退出不能使用打印功能

            }
        },

        fetchActiveCode() {
            this.activeCode = '';
            this.submitConfig();
        },

        validateCode() {
            if (!this.activeCode) return;
            IOT.validateCode(this.activeCode).then((res) => {
                if (!res.isValid) {
                    this.showActiveCodeError = true;
                } else {
                    this.showActiveCodeError = false;
                }
            })
        }
    }
}
