
const printer = require('./printer')
const sysPrinterSetup = require('./sys-printer-setup')
const pdfPrinterSetup = require('./pdf-printer-setup')
const CONFIG = require('./configuration')
const logger = require('./logger')

const mainWin = require('./main-window')

const Printer = {
    initialize(userLoginName) {

        printer.createPrinter(userLoginName)
        this.setup({ force: false })
    },
    driverCompatibility() {
        const supportPrinters = CONFIG.readSettings('supportPrinters')
        let supportMxjDriver = false
        let supportSysDriver = false
        if (supportPrinters == null) {
            // 如果没有得到配置文件，默认打印机
            supportMxjDriver = false;
            supportSysDriver = false;

        } else {
            supportPrinters.map(function (driver) {
                if (driver.name === 'mxj') {
                    supportMxjDriver = true
                } else if (driver.name === 'sys') {
                    supportSysDriver = true
                }
            })
            if (supportPrinters.length === 0) {
                supportMxjDriver = true
            }
        }
        logger.info(`support prints:mxj:${supportMxjDriver},sys:${supportSysDriver}`);
        return {
            supportMxjDriver,
            supportSysDriver
        }
    },
    /**
     * 驱动安装
     */
    async setup({ force = false }) {
        let { supportMxjDriver, supportSysDriver } = Printer.driverCompatibility()
        if (!force) {
            if ((!supportMxjDriver || (supportMxjDriver && await pdfPrinterSetup.hasInstalled())) &&
                (!supportSysDriver || (supportSysDriver && await sysPrinterSetup.hasInstalled()))) {
                // 需要开启私印
                return
            }
        }
        logger.info(`Will install driver: pdf driver - ${supportMxjDriver}, sys driver - ${supportSysDriver}`)
        mainWin.getMainWin().webContents.send('start-setup-sys-printer')
        mainWin.getMainWin().webContents.send('download-sys-printer-progress', { percent: 1 })
        return Promise.resolve().then(function () {
            if (supportMxjDriver) {
                // 梦想加打印机驱动
                console.log('安装pdf打印驱动');
                return pdfPrinterSetup.setup(force)
            }
            return Promise.resolve()
        }).then(function () {
            if (supportSysDriver) {
                // fssl打印机驱动
                return sysPrinterSetup.setup(force)
            }
            return Promise.resolve()
        }).then(() => {
            // success
            mainWin.getMainWin().webContents.send('success-setup-sys-printer')
            mainWin.getMainWin().webContents.send('end-setup-sys-printer')
            return Promise.resolve()
        }).catch((error) => {
            // error
            mainWin.getMainWin().webContents.send('error-setup-sys-printer')
            mainWin.getMainWin().webContents.send('end-setup-sys-printer')
            return Promise.reject(error)
        })
    }
}

module.exports = Printer
