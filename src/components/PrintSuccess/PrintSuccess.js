const electron = require('electron')
const Promise = require('bluebird')
const moment = require('moment')
const ipc = electron.ipcRenderer
const remote = electron.remote
const logger = remote.require('./app/logger')
const config = remote.require('./app/configuration')
const printer = electron.remote.require('./app/printer')
import TitleBar from 'src/components/TitleBar/TitleBar.vue'

export default {
    components: {
        TitleBar
    },

    props: [],

    data() {
        return {
            refreshPrintJobHandler: undefined,
            status: {
                fileName: undefined,
                msg: undefined,
                isError: false
            },
            isSelectAll: false,
            printJobFiles: [],
            checkeds: 0
        }
    },

    computed: {
    },

    watch: {
        '$route': 'routeChange'
    },

    beforeCreate() {
    },

    created() {
        let self = this

        ipc.on('start-print', self.onStartPrint)
        ipc.on('print-ps-finished', self.onPrintPsFinished)
        ipc.on('print-error', self.onPrintError)
    },

    mounted() {
        let self = this
        console.log('PrinterSuccess mounted~~~!')

        self.startRefreshPrintListTask()
    },

    destroyed() {
        let self = this

        ipc.removeListener('start-print', self.onStartPrint)
        ipc.removeListener('print-ps-finished', self.onPrintPsFinished)
        ipc.removeListener('print-error', self.onPrintError)
        self.stopRefreshPrintListTask()
    },

    methods: {
        startRefreshPrintListTask() {
            let self = this
            if (!self.refreshPrintJobHandler) {
                console.log('set get print list interval')
                self.refreshPrintJobHandler = setInterval(() => {
                    self.getPrintJobFiles()
                }, 60 * 1000)
            }
        },

        stopRefreshPrintListTask() {
            let self = this
            if (self.refreshPrintJobHandler) {
                console.log('clear refresh print list interval')
                clearInterval(self.refreshPrintJobHandler)
                self.refreshPrintJobHandler = undefined
            }
        },

        onStartPrint(event, msg) {
            let self = this
            remote.getCurrentWindow().show()
            self.status.fileName = msg
            self.status.msg = `请稍后，正在处理打印文件：${msg} ...`
            self.status.isError = false

            self.$router.replace({ path: `/app/print-success` })
        },

        onPrintPsFinished(event, param) {
            let self = this
            remote.getCurrentWindow().show()
            self.status.fileName = param.originFileName
            self.status.msg = `完成处理文件: ${self.status.fileName}`
            self.status.isError = false

            self.getPrintJobFiles()
            self.hideStatusMsg()
        },

        onPrintError(event, msg) {
            let self = this
            remote.getCurrentWindow().show()
            self.status.msg = `打印文件出错: ${msg}`
            self.status.isError = true
        },

        hideStatusMsg() {
            let self = this
            setTimeout(() => {
                self.status.fileName = undefined
                self.status.msg = undefined
                self.status.isError = false
            }, 3000)
        },

        routeChange() {
            let self = this
            if (self.$route.path === '/app/print-success') {
                self.getPrintJobFiles()
                self.startRefreshPrintListTask()
            } else {
                self.stopRefreshPrintListTask()
            }
        },

        backToPrinter() {
            this.$router.replace({ path: '/app/printer' })
        },

        getPrintJobFiles() {
            console.log('get print job files')
            let self = this
            printer.getPrintJob().then((result) => {
                let timezone = moment.parseZone().utcOffset()
                result.forEach(r => {
                    let date = moment.utc(r.createdDate)
                    date.utcOffset(timezone)
                    r.createdDate = date.format('YYYY-MM-DD HH:mm:ss')
                    r.info = (r.color === 2 || r.color === '2') ? '彩色' : '黑白';
                    r.checked = false
                })

                self.isSelectAll = false
                self.printJobFiles = result
            }).catch((error) => {
                logger.error('获取打印列表失败~~~')
                logger.error(error.message)
            })
        },
        selectFile(file) {
            let len = this.printJobFiles.length
            let counter = 0
            file.checked = !file.checked
            this.printJobFiles.forEach((f) => {
                if (f.checked) { counter += 1 }
            })
            this.isSelectAll = len === counter
            this.checkeds = counter
        },
        selectAllFile() {
            if (this.printJobFiles.length === 0) {
                return
            }
            this.isSelectAll = !this.isSelectAll
            let checked = this.isSelectAll
            this.printJobFiles.forEach((f) => {
                f.checked = checked
            })

            this.checkeds = checked ? this.printJobFiles.length : 0
        },
        cancelCheckFile() {
            let self = this
            let ps = []
            this.printJobFiles.forEach((f) => {
                if (f.checked) {
                    ps.push(printer.deletePrintFileById(f.id))
                }
            })
            Promise.all(ps).then(() => {
                self.getPrintJobFiles()
            }).catch((error) => {
                logger.error(error)
                remote.getCurrentWebContents().send('error-msg', '撤销打印失败')
            })
        },

        deletePrintFile(id) {
            let self = this
            printer.deletePrintFileById(id).then((result) => {
                if (result) {
                    console.info(`delete print file ${id} success`)
                    self.getPrintJobFiles()
                }
            }).catch((error) => {
                logger.error(`撤销打印文件${id}失败`)
                logger.error(error)
                remote.getCurrentWebContents().send('error-msg', '撤销打印失败')
            })
        }

    }
}
