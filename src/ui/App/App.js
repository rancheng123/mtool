import Printer from 'components/Printer/Printer.vue'
import About from 'components/About/About.vue'
import Config from 'components/Config/Config.vue'
import PrintSuccess from 'components/PrintSuccess/PrintSuccess.vue'
import PrintRecord from 'components/PrintRecord/PrintRecord.vue'
import Home from 'components/Home/Home.vue'
import Meeting from 'components/Meeting/Meeting.vue'
import MeetingProject from 'components/MeetingProject/MeetingProject.vue'
import PrinterIntro from 'components/PrinterIntro/PrinterIntro.vue'
import Account from 'components/Account/Account.vue'


export default {
    components: {
        'printer': Printer,
        'print-success': PrintSuccess,
        'about': About,
        'config': Config,
        'print-record': PrintRecord,
        'home': Home,
        'meeting': Meeting,
        'meeting-projector': MeetingProject,
        'printer-intro': PrinterIntro,
        'account': Account
    },

    data() {
        return {
            title: '',
            isShowHeadLogo: false,
            isShowPrinter: false,
            isShowProjector: true,
            isShowAbout: false,
            isShowConfig: false,
            isShowAccount: false,
            isShowPrintSuccess: false,
            isShowPrintRecord: false,
            isShowSsLocal: false,
            isShowHome: false,
            isShowMeeting: false,
            isShowMeetingProject: false,
            isShowPrintInstro: false
        }
    },

    computed: {},

    watch: {
        '$route': 'routeChange'
    },

    created() {},

    mounted() {
        let self = this
        self.$nextTick(() => {
            self.routeChange()
            document.body.addEventListener('click', this.resetByBodyClick, true)
        })
    },

    methods: {
        reset() {
            let self = this
            self.title = ''
            self.isShowHeadLogo = false
            self.isShowPrinter = false
            self.isShowProjector = false
            self.isShowAbout = false
            self.isShowConfig = false
            self.isShowAccount = false
            self.isShowPrintSuccess = false
            self.isShowPrintRecord = false
            self.isShowSsLocal = false
            self.isShowHome = false
            self.isShowMeeting = false
            self.isShowMeetingProject = false
            self.isShowPrintInstro = false
        },
        setPropertes(props) {
            let ps = props || {}
            let self = this
            Object.keys(ps).forEach(p => {
                self[p] = ps[p]
            })
        },
        goback() {
            this.$router.back()
        },
        routeChange() {
            let self = this
            let route = self.$route
            this.reset()

            let routeMap = {
                '/app/home': {
                    title: '',
                    isShowHeadLogo: false,
                    isShowProjector: false,
                    isShowHome: true
                },
                '/app/projector': {
                    title: '梦想加云投影',
                    isShowProjector: true
                },
                '/app/printer': {
                    title: '梦想加云打印',
                    isShowPrinter: true
                },
                '/app/about': {
                    title: '关于',
                    isShowAbout: true
                },
                '/app/config': {
                    title: '配置',
                    isShowConfig: true
                },
                '/app/print-success': {
                    title: '打印信息',
                    isShowPrintSuccess: true
                },
                '/app/meeting': {
                    title: '视频会议',
                    isShowMeeting: true
                },
                '/app/print-record': {
                    title: '云打印 > 打印记录',
                    isShowPrintRecord: true
                },
                '/app/meeting-projector': {
                    title: '本地投影',
                    isShowMeetingProject: true
                },
                '/app/print-intro': {
                    isShowPrintInstro: true
                },
                '/app/account': {
                    isShowAccount: true
                }

            }
            let props = routeMap[route.path]
            if (props) {
                self.setPropertes(props)
            }
        },
        resetByBodyClick(e) {
            // body点击关闭邀请菜单
            this.$store.state.isShowInviteMenu = false
        }
    }

}
