const ChildProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const osLocale = require('os-locale')
const logger = require('./logger')
const config = require('./configuration')
const electron = require('electron')
const mainWindow = require('./main-window')
const Promise = require('bluebird')
const guestMode = require('./guest-mode')

const app = electron.app
// const winPrinterDriverSourceDir = path.resolve(app.getAppPath() + '\\prngdriver')
// const winPrinterDriverDestDir = path.resolve(app.getAppPath() + '\\..')
const darwinResourcesDir = path.resolve(`${app.getAppPath()}/../extraResources/mac/${process.arch}/`)
const windowsResourcesDir = path.resolve(`${app.getAppPath()}/../extraResources/win/${process.arch}/`)

function setupPrinter(printerName, fromUI) {
    let isGuest = guestMode.isGuestMode()
    if (isGuest) return

    let commandToExecute = ''

    if (fromUI) {
        // ainWindow.getMainWin().webContents.send('info-msg', '开始设置打印机......')
        setTimeout(() => {
            // mainWindow.getMainWin().webContents.send('info-msg', '打印机设置完成')
            mainWindow.getMainWin().webContents.send('setup-printer-finished')
        }, 3100)
    }

    if (process.platform === 'darwin') {
        const printerPPD = `${__dirname}/../mxj-printer.ppd`
        const copyPPDTo = `${config.getConfigDir()}/mxj-printer.ppd`
        let writeStream = fs.createWriteStream(copyPPDTo)
        fs.createReadStream(printerPPD)
            .pipe(writeStream)
            .on('finish', () => {
                const printerURL = `ipp://localhost:6311/`
                commandToExecute = `lpadmin -x "梦想加打印机"; lpadmin -x ${printerName};` +
                    `lpadmin -E -p "${printerName}" -v "${printerURL}" -P "${copyPPDTo}" -o printer-is-shared=false;` +
                    `cupsenable "${printerName}"; cupsaccept "${printerName}"; lpoptions -d "${printerName}"`

                executeCommand(commandToExecute)
            }).on('error', (error) => {
                logger.error('copy pdd file error: ')
                if (error) logger.error(error.stack)
            })

    } else {
        let osArch = os.arch()
        let printerDriverZip = 'i386_hp_printer_driver.zip'
        let infPath = windowsResourcesDir + '\\i386_hp_printer_driver\\hpcu210d.inf'

        if (osArch === 'x64') {
            printerDriverZip = 'amd64_hp_printer_driver.zip'
            infPath = windowsResourcesDir + '\\amd64_hp_printer_driver\\hpcu210v.inf'
        }

        logger.info('driver path: ' + infPath)
        const locale = osLocale.sync().replace('_', '-')
        const printingAdminScriptDir = `${process.env.windir}\\system32\\Printing_Admin_Scripts\\${locale}`
        const prnmngrPath = `${printingAdminScriptDir}\\prnmngr.vbs`
        const prndrvrPath = `${printingAdminScriptDir}\\prndrvr.vbs`
        const listPrintersCommand = `cscript ${prnmngrPath} -l`
        const listDriversCommand = `cscript ${prndrvrPath} -l`
        // const prnportPath = `${printingAdminScriptDir}\\prnport.vbs`
        // const driverName = 'Microsoft PS Class Driver'
        // const driverName = 'HP Color LaserJet 2800 Series PS'
        const driverName = 'HP Universal Printing PS'
        const printerUrl = 'http://localhost:6311'
        // const printerPortName = 'mxj-printer-port'

        let drivers
        ChildProcess.exec(listDriversCommand, (error2, stdout2, stderr2) => {
            drivers = error2 || stdout2 || stderr2
            const deletePrinterCommand = `cscript "${prnmngrPath}" -d -p "梦想加打印机" & cscript "${prnmngrPath}" -d -p "${printerName}"`

            let addPrinterCommand = `rundll32 printui.dll,PrintUIEntry /b "${printerName}" /n "${printerName}" /if /f "${infPath}" /r "${printerUrl}" /m "${driverName}"`
            if (drivers.indexOf(driverName) >= 0) {
                logger.info('user already install drivers')
                addPrinterCommand = `rundll32 printui.dll,PrintUIEntry /b "${printerName}" /n "${printerName}" /if /r "${printerUrl}" /m "${driverName}"`
            } else {
                logger.info('user not install drivers, install driver while install printer')
            }
            let setDefaultPrinterCommand = `rundll32 printui.dll,PrintUIEntry /y /n "${printerName}"`

            executeCommand(`${deletePrinterCommand} & ${addPrinterCommand} & ${setDefaultPrinterCommand}`)
        })
    }
}

function checkIfHasMxjPrinter(printerName) {
    if (process.platform === 'darwin') {
        let command = 'lpstat -p'

        return executeCommand(command).then(result => {
            return String(result).indexOf(printerName) >= 0
        }).catch(err => {
            logger.error(`list printers error: ${err}`)
        })
    } else {
        // windows 每次启动自动重新安装打印机
        return Promise.resolve(true)
    }
}

function executeCommand(commandToExecute) {
    logger.info(`will execute command: ${commandToExecute}`)
    return new Promise((resolve, reject) => {
        ChildProcess.exec(commandToExecute, (error, stdout, stderr) => {
            if (error) {
                logger.error(`execute command [${commandToExecute}] error: ${error}`)
                let errorToThrow = new Error(`error execute command [${commandToExecute}]`)
                errorToThrow.code = 'execute-command-error'
                reject(errorToThrow)
            } else {
                let result = stdout || stderr
                logger.info(`execute command [${commandToExecute}] result: ${result}`)
                resolve(result)
            }
        })
    })
}

module.exports = {
    // setupPrinter: setupPrinter,
    setupPrinter: () => {
        console.log('去掉老打印驱动')
    },
    // checkIfHasMxjPrinter: checkIfHasMxjPrinter
    checkIfHasMxjPrinter: () => {
        return Promise.resolve(true)
    }
}

