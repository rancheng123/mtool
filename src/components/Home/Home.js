const electron = require('electron')
const remote = electron.remote
const ipc = electron.ipcRenderer
const config = remote.require('./app/configuration')
const logger = remote.require('./app/logger')
const guestMode = remote.require('./app/guest-mode')
const printerSetup = remote.require('./app/printer-setup')
import meetingService from '../../service/meetingService'
import SmartOfficeAPI from '../../service/SmartOfficeAPI'

debugger
var zoomSdkCase = remote.require('../zoom-sdk-electron-master/demo/main.js');



export default {
    props: {},
    components: {},

    data() {
        return {
            userInfo: {},
            authToken: {},
            isShowUserInfo: false,
            needInstallPrinter: false,
            printerInstalling: false,
            isGuest: false
        }
    },

    computed: {},

    watch: {
        '$route': 'routeChange'
    },
    mounted() {
        var self = this

        logger.info(`Home.js mounted~~!`)
        self.isGuest = guestMode.isGuestMode()

        if (!self.isGuest) {
            // self.checkIfHasMxjPrinter()
        }

        self.$nextTick(() => {
            self.userInfo = config.readSettings('userInfo')
            self.authToken = config.readSettings('authToken')
        })

    },


    methods: {

        routeChange() {
            let self = this
            self.isShowLicence = false
            if (self.$route.path === '/app/home') {
                let query = this.$route.query
                if (query.redirect) {
                    this.$router.replace({
                        path: query.redirect
                    })
                }
            }
        },

        checkIfHasMxjPrinter() {
            printerSetup.checkIfHasMxjPrinter('梦想加打印机')
                .then(result => {
                    this.needInstallPrinter = !result
                })
                .catch(err => {
                    console.error(`检查打印机列表出错： ${err}`)
                })
        },

        projectorSelected() {
            this.$router.replace({
                path: '/app/projector'
            })
        },

        // 这个方法实际上没有被调用了 -- Dec 13, 2018
        printerSelected() {
            let self = this
            if (self.printerInstalling) return

            if (self.needInstallPrinter) {
                self.printerInstalling = true
                printerSetup.setupPrinter('梦想加打印机', true)
                setTimeout(() => {
                    self.checkIfHasMxjPrinter()
                    self.printerInstalling = false
                }, 3500)
            } else {
                self.$router.replace({
                    path: '/app/printer'
                })
            }
        },

        videoMeetingSelected() {
            let self = this
            logger.info(`self.userInfo:${JSON.stringify(self.userInfo)}`)
            logger.info(`auth-token:${JSON.stringify(self.authToken)}`)

            this.$router.replace({
                path: '/meeting'
            })
        },
        startZoom() {


            //直接发起
            var roomNumber = 0;
            var startCBOption = null;

            zoomSdkCase.wrapSdk.start(roomNumber,startCBOption)

        },

        joinZoom() {






            //直接发起
            var meetingnum = Number(document.getElementById('joinRoomNum').value.replace('https://huawan.zoomus.cn/j/',''));
            var username = document.getElementById('joinusername').value;
            var startCBOption = null;

            zoomSdkCase.wrapSdk.join(meetingnum, username, startCBOption)

        },

        agoraProjector() {
            this.$router.replace({
                path: '/meeting-project',
                query: {
                    'type': 'projector'
                }
            })
        },
        showUserInfo() {
            this.isShowUserInfo = !this.isShowUserInfo
        },
        hideUserInfo() {
            this.isShowUserInfo = false
        },
        logout() {
            ipc.send('logout')
        },
        settings() {
            this.$router.replace({
                path: '/app/config'
            })
        },
        about() {
            this.$router.replace({
                path: '/app/about'
            })
        }
    }
}
