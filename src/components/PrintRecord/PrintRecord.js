const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const printer = remote.require('./app/printer')
const printHistory = remote.require('./app/print-history')
const pdfPrinterSetup = remote.require('./app/pdf-printer-setup')
const _ = require('lodash')

import TitleBar from 'src/components/TitleBar/TitleBar.vue'

export default {
    components: {
        TitleBar
    },

    props: [],

    data() {
        return {
            localPrintFiles: []
        }
    },

    computed: {
    },

    watch: {
        '$route': 'routeChange'
    },

    created() {
        let self = this
        ipc.on('print-ps-finished', self.getHistories)
        ipc.on('print-error', self.getHistories)
    },

    mounted() {
        let self = this
        console.log('PrinterRecord mounted~~~!')
        self.$nextTick(() => {
            self.getHistories()
        })
    },

    destroyed() {
        let self = this
        ipc.removeListener('print-ps-finished', self.getHistories)
        ipc.removeListener('print-error', self.getHistories)
    },

    methods: {
        routeChange() {
            let self = this
            if (self.$route.path === '/app/print-record') {
                self.getHistories()
            } else {
                self.localPrintFiles = []
            }
        },

        getHistories() {
            let self = this
            let histories = printHistory.getAllHistories()
            self.localPrintFiles = []
            _.forEach(histories, function(item, key) {
                const itemCopy = {};
                itemCopy.uuidName = key;
                for (const objK in item) {
                    itemCopy[objK] = item[objK];
                }
                self.localPrintFiles.push(itemCopy)
            })

            self.localPrintFiles = _.orderBy(self.localPrintFiles, ['date', 'name'], ['desc', 'asc'])
        },

        async printAgain(fileUUIDName, domIdx) {
            const installed = await pdfPrinterSetup.hasInstalled()
            if (!installed) {
                pdfPrinterSetup.setup();
                return;
            }

            let self = this
            let history = _.find(self.localPrintFiles, function(item) {
                return item.uuidName === fileUUIDName
            })

            let isFileExistOnDisk = printHistory.isFileExistOnDisk(fileUUIDName)

            if (history && isFileExistOnDisk) {
                //let dom = document.querySelector('#btnPrintAgain' + domIdx)
                //dom.innerHTML = '<span>准备中...</span>'
                //dom.setAttribute('disabled', true)
                printer.printAccordingHistory(history)
            } else {
                printHistory.delHistory(fileUUIDName)
                remote.getCurrentWebContents().send('error-msg', '没有找到你所选择的记录，可能已经被删除')
                self.getHistories()
            }
        },
        goBack() {
            if (this.$route.path === '/app/print-record') {
                this.$router.replace({path: '/app/printer'})
            }
        }
    }
}
