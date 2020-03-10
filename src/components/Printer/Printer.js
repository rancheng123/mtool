const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const logger = remote.require('./app/logger')
const config = remote.require('./app/configuration')
const printer = remote.require('./app/printer')
const IOT = remote.require('./app/iot')
// const printerSetup = remote.require('./app/printer-setup')
// const pdfPrinterSetup = remote.require('./app/pdf-printer-setup')
const printerPolyfill = remote.require('./app/printer-polyfill')
const _ = require('lodash')

import ICountUp from 'vue-countup-v2'
import EventBus from '../../helpers/event-bus'

const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})

export default {
    components: {
        ICountUp
    },

    props: [],

    data() {
        return {
            refreshPrintJobHandler: undefined,
            isStillHavePrintingFiles: false,
            userQuota: 0,
            orgQuota: 0,
            quota: 0,
            printInfo: '',
            infomsg: '',
            showMacPrintInstruction: true,
            showSetting: false,
            macTabCls: {
                tab: 'tab',
                active: 'active'
            },
            winTabCls: {
                tab: 'tab',
                active: ''
            },
            macBtnCls: {
                active: 'active'
            },
            winBtnCls: {
                active: ''
            },
            quotaCountUpStartVal: 0,
            quotaCountUpEndVal: 0,
            quotaCountUpOptions: {
                useEasing: true,
                useGrouping: true,
                separator: ''
            }
        }
    },

    computed: {
    },

    watch: {
        '$route': 'routeChange'
    },

    created() {
        window.xxx = this
        logger.info(`Printer.js created~~~!`)
        let self = this
        ipc.on('setup-printer-finished', self.checkIfHasMxjPrinter)
        ipc.on('success-setup-sys-printer', self.onPdfPrinterSetupSuccess)
        ipc.on('error-setup-sys-printer', self.onPdfPrinterSetupError)
        EventBus.$on('GoToPrinterView', this.checkPdfPrinterInstalled)
        let supportPrinters = config.readSettings('supportPrinters');
        console.log(supportPrinters);
        supportPrinters.map(function (driver) {
            if (driver.name === 'mxj') {
                self.printInfo = self.printInfo ? `梦想加打印机/${self.printInfo}` : '梦想加打印机';
            } else if (driver.name === 'sys') {
                let name = driver.sysDriverName || '富士施乐打印机';
                self.printInfo = self.printInfo ? `梦想加打印机/${name}` : name;
            }
        })
        if (!self.printInfo) {
            self.printInfo = '梦想加打印机/富士施乐打印机'
        }
    },

    beforeMount() {
    },

    mounted() {
        var self = this
    },

    destroyed() {
        let self = this
        ipc.removeListener('setup-printer-finished', self.checkIfHasMxjPrinter)
        ipc.removeListener('success-setup-sys-printer', self.onPdfPrinterSetupSuccess);
        ipc.removeListener('error-setup-sys-printer', self.onPdfPrinterSetupError);
        EventBus.$off('GoToPrinterView', this.checkPdfPrinterInstalled)
    },

    methods: {
        async checkPdfPrinterInstalled() {
            // const installed = await pdfPrinterSetup.hasInstalled()
            // if (!installed) {
            //     pdfPrinterSetup.setup();
            // }
        },

        macBtnClick(event) {
            event.preventDefault()
            this.macBtnCls.active = 'active'
            this.macTabCls.active = 'active'
            this.winBtnCls.active = ''
            this.winTabCls.active = ''
        },

        winBtnClick(event) {
            event.preventDefault()
            this.macBtnCls.active = ''
            this.macTabCls.active = ''
            this.winBtnCls.active = 'active'
            this.winTabCls.active = 'active'
        },

        routeChange() {
            let self = this
            if (self.$route.path === '/app/printer') {
                self.getPrintQuota()
                self.checkIfStillHavePrintingFiles()
                if (!self.refreshPrintJobHandler) {
                    self.refreshPrintJobHandler = setInterval(() => {
                        self.checkIfStillHavePrintingFiles()
                    }, 60 * 1000)
                }

            } else {
                clearInterval(self.refreshPrintJobHandler)
                self.refreshPrintJobHandler = undefined
            }
        },

        checkIfHasMxjPrinter() {
            // printerSetup.checkIfHasMxjPrinter('梦想加打印机')
            //     .then(result => {
            //         this.needInstallPrinter = !result
            //     })
            //     .catch(err => {
            //         console.error(`检查打印机列表出错： ${err}`)
            //     })
        },

        openLocalPrintHistory() {
            this.$router.replace({ path: '/app/print-record' })
        },

        openPrintingFileList() {
            this.$router.replace({ path: '/app/print-success' })
        },

        openPrintingInstro() {
            this.$router.replace({ path: '/app/print-intro' })
        },

        // jumpToConfigPrinter() {
        //     let container = document.getElementById('printer')
        //     let isMac = process.platform === 'darwin'
        //     // let dom = isMac ? '' : document.getElementById('printerSetWindows')
        //     let dom = document.getElementById('printerSetWindows')
        //     container.scrollTop = dom.getBoundingClientRect().top + container.scrollTop - 60
        //     this.showSetting = true
        // },

        getPrintQuota() {
            let self = this
            const authToken = config.readSettings('authToken')
            const smartOfficeUrl = 'http://' + config.readSettings('smartOfficeServerUrl')
            return rp({
                uri: smartOfficeUrl + '/api/printing/quota',
                method: 'GET',
                json: true,
                headers: {
                    'auth-token': authToken
                },
                transform: (body, response, resolveWithFullResponse) => {
                    if (response.statusCode === 200) {
                        let quotaData = response.body
                        self.quota = quotaData.quota
                        self.quotaCountUpStartVal = 0
                        
                        //老的接口
                        if(typeof quotaData.organizationMember == 'undefined'){
                            self.quotaCountUpEndVal = parseInt(quotaData.quota)
                        }else{
                            //如果加入企业
                            if(quotaData.organizationMember){
                                self.quotaCountUpEndVal = parseInt(quotaData.organizationQuota)
                            }else{
                                self.quotaCountUpEndVal = parseInt(quotaData.userQuota)
                            }
                        }

                       
                        self.userQuota = quotaData.userQuota
                        self.orgQuota = quotaData.organizationQuota
                        return response.body
                    } if (response.statusCode === 401) {
                        logger.error('get print quota server return 401, token is: ' + authToken)
                        remote.getCurrentWebContents().send('login-expired')
                    } else {
                        throw new Error('getPrintQuota failed, status code: ' + response.statusCode)
                    }
                }
            }).catch((err) => {
                console.log('get print quota failed: ' + err)
            })
        },

        checkIfStillHavePrintingFiles() {
            console.log('get print job files')
            let self = this
            printer.getPrintJob().then((result) => {
                if (result && result.length > 0) {
                    self.isStillHavePrintingFiles = true
                } else {
                    self.isStillHavePrintingFiles = false
                }

            }).catch((error) => {
                console.error(error)
            })
        },

        installPrinter() {
            let self = this
            let userName = config.readSettings('userInfo').login
            // printerSetup.setupPrinter('梦想加打印机', true) // 去掉老打印驱动
            self.infomsg = '开始设置打印机......'
            // pdfPrinterSetup.setup(true)

            // 通过polyfill安装打印机驱动
            IOT.fetchConfig(false).then(() => {
                printerPolyfill.setup({ force: true })
            })
        },
        onPdfPrinterSetupSuccess() {
            const self = this
            self.infomsg = '打印机设置完成'
            setTimeout(() => {
                self.infomsg = ''
            }, 3000)
        },
        onPdfPrinterSetupError() {
            const self = this
            self.infomsg = '打印机驱动安装失败，请尝试再次安装'
            setTimeout(() => {
                self.infomsg = ''
            }, 3000)
        },
        backToHome() {
            if (this.$route.path === '/app/printer') {
                this.$router.replace({ path: '/app/home' })
            }
        },

        onQuotaCountUpReady() {

        }
    }
}
