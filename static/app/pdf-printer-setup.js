const electron = require('electron')
const fs = require('fs')
const path = require('path')
const logger = require('./logger')
const request = require('request')
const requestProgress = require('request-progress')
const mainWin = require('./main-window')
const exec = require('child_process').exec
const unzip = require('extract-zip')
const VersionMigration = require('./version-migration')
const utils = require('./utils')
const print = require('./printer.js');

const ISMAC = process.platform === 'darwin'
const isMSI = false
const resourcesDir = path.resolve(electron.app.getAppPath() + (ISMAC ? '/../extraResources/mac' : '/../extraResources/win'))
const programFilesDirEnvKey = process.arch === 'x64' ? 'ProgramFiles(x86)' : 'ProgramFiles'
const programFilesDir = process.env[programFilesDirEnvKey]

async function waitForSecond(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000))
}


/**
 * 标识驱动的版本，当外包方更新了驱动后，请更新此值，注意这是一个整型
 */
const CURRENT_DRIVER_VERSION = 2

function filePathOfSavedDriverVersion() {
    return path.join(utils.getUserHome(), '.mxj-desktop', 'pdf-printer-driver-version.txt');
}

function hasInstalledByCompareSavedDriverVersion() {
    const fp = filePathOfSavedDriverVersion()
    if (!fs.existsSync(fp)) {
        return false
    }
    const fc = fs.readFileSync(fp, { encoding: 'utf8' })
    if (parseInt(fc) < CURRENT_DRIVER_VERSION) {
        return false
    }
    return true
}

function savedDriverVersion() {
    const fp = filePathOfSavedDriverVersion()
    fs.writeFileSync(fp, CURRENT_DRIVER_VERSION + '');
    logger.info('pdf printer dirver version saved: ' + CURRENT_DRIVER_VERSION)
}
function hasInstalledNew() {
    let log = print.printLog();
    if (log && log.pdf) {
        return !(log.pdf < CURRENT_DRIVER_VERSION)
    } else {
        return false
    }
}

async function hasInstalled(timestampToCheck = 0) {

    let targetFile = null
    if (ISMAC) {
        targetFile = '/Applications/PrinterClient.app/Contents/MacOS/PrinterClient'
    } else {
        targetFile = `${programFilesDir}\\iSecStar\\MengXiangJia\\iCltPrintHost.exe`
    }
    const exist = fs.existsSync(targetFile)
    logger.info('******.  file [' + targetFile + '] existence:' + exist)
    if (!fs.existsSync(targetFile)) {
        return false
    }
    if (!timestampToCheck) {
        return true
    }
    try {
        const st = fs.lstatSync(targetFile)
        logger.info('******.  hasInstalled checkTimestamp: ' + st.ctime.getTime() + ' - vs - ' + timestampToCheck)
        if (st.ctime.getTime() >= timestampToCheck) {
            return true
        } else {
            return false
        }
    } catch (err) {
        logger.info('******.  hasInstalled checkTimestamp exception: ' + err)
        return false
    }
}


const uninstallMSIDriver = async () => {
    return new Promise(async (resolve, reject) => {
        const installed = await hasInstalled()
        if (!installed) {
            resolve()
            return
        }
        const drivePath = path.join(resourcesDir, 'common', 'hpdriver.msi')
        const installerCmd = `msiexec /qn /uninstall "${drivePath}"`
        exec(`${installerCmd}`, (error, stdout, stderr) => {
            if (error || stderr) {
                logger.error('uninstallMSIDriver error::' + (error || stderr))
                reject(new Error(`uninstallMSIDriver`))
            } else {
                logger.info(`uninstallMSIDriver: ${stdout}`)
            }
        })

        let doResolve = null
        let doReject = null
        let checkCount = 0
        let checkInterval = null
        const clearCheckInterval = () => {
            if (checkInterval) {
                clearInterval(checkInterval)
                checkInterval = null
            }
        }
        checkInterval = setInterval(async () => {
            checkCount = checkCount + 1
            if (checkCount > 60) {
                doReject(new Error(`uninstallMSIDriver check time out....`))
                return
            }
            const r = await hasInstalled()
            if (r) {
                return
            }
            clearCheckInterval()
            await waitForSecond(3)
            logger.info('uninstallMSIDriver check finished.')
            doResolve()
        }, 1000)

        doReject = (arg) => {
            clearCheckInterval()
            reject(arg)
        }

        doResolve = () => {
            clearCheckInterval()
            resolve()
        }
    })
}

const installDriver = async () => {
    const fileName = (ISMAC ? 'hpdriver.pkg' : (isMSI ? 'hpdriver.msi' : 'hpdriver.exe'))
    const drivePath = path.join(resourcesDir, 'common', fileName)
    return new Promise(async (resolve, reject) => {
        let doResolve = null
        let doReject = null
        let checkInterval = null

        const timeoutSec = 120
        let isAutoKilledMacPro = false
        let autoKillMacProcTimeout = null

        const clearCheckInterval = () => {
            if (checkInterval) {
                clearInterval(checkInterval)
                checkInterval = null
            }
        }

        doReject = (arg) => {
            clearCheckInterval()
            reject(arg)
        }

        doResolve = () => {
            clearCheckInterval()
            resolve()
        }
        const checkStartTS = Date.now();
        if (ISMAC) {
            let installerCmd = `installer -pkg '${drivePath}' -target /`
            logger.info(`install cmd line: ${installerCmd}`);
            const macProc = exec(`osascript "${resourcesDir}/${process.arch}/admin-run.scpt" "${installerCmd}"`, (error, stdout, stderr) => {
                clearTimeout(autoKillMacProcTimeout)
                autoKillMacProcTimeout = null
                if (error || stderr) {
                    logger.error('install pdf printer error::' + (error || stderr))
                    if (isAutoKilledMacPro) {
                        logger.info(`osascript callback but isAutoKilledMacPro, skipping reject`)
                    } else {
                        // 只有当不是超时引起的错误时，才抛出。因为超时已经抛出相应错误:
                        doReject(new Error(`install printer driver failed....`))
                    }
                } else {
                    savedDriverVersion()
                    logger.info(`install pdf printer stdout: ${stdout}`)
                }
            })
            const macProcId = macProc.pid
            logger.info(`macProcId = ${macProcId}`)
            autoKillMacProcTimeout = setTimeout(() => {
                isAutoKilledMacPro = true
                try {
                    logger.info(`killing process ${macProcId}`)
                    process.kill(macProcId)
                } catch (ex) {
                    logger.error(`kill process exception: ${macProcId}`)
                }
            }, (timeoutSec + 2) * 1000) // +2是为了保证下面的超时检查先解发
        } else {
            let installerCmd = null
            if (isMSI) {
                await uninstallMSIDriver()
                installerCmd = `msiexec /qn /i "${drivePath}"`
            } else {
                installerCmd = `start "" "${drivePath}" /S`
            }
            logger.info(`install cmd line: ${installerCmd}`);
            exec(`${installerCmd}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    logger.error('install pdf printer error::' + (error || stderr))
                    doReject(new Error(`install pdf printer driver failed....`))
                } else {
                    logger.info(`install pdf printer stdout: ${stdout}`)
                }
            })
        }
        // save
        print.printLog({ pdf: CURRENT_DRIVER_VERSION })
        const checkTimeoutTS = checkStartTS + timeoutSec * 1000
        checkInterval = setInterval(async () => {
            if (Date.now() >= checkTimeoutTS) {
                // 不在提示超时问题
                doResolve()
                return
            }
            const r = await hasInstalled(checkStartTS)
            if (!r) {
                return
            }
            clearCheckInterval()
            // wait for the rest file been created and the driver service startup
            const waitTime = (ISMAC ? 3 : 4)
            await waitForSecond(waitTime)
            logger.info('install pdf printer finished.')
            doResolve()
        }, 1000)
    })
}

const setupDefaultPrinter = async () => {
    return new Promise((resolve, reject) => {
        let command
        if (ISMAC) {
            command = 'lpoptions -d 梦想加打印机'
        } else {
            command = 'rundll32 printui.dll,PrintUIEntry /y /q /n 梦想加打印机'
        }
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                logger.error('set default printer error:')
                logger.error(error || stderr)
                reject(new Error('set default printer error'))
            } else {
                logger.info(`set default pdf printer stdout: ${stdout}`)
                logger.info('set default pdf printer finished.')
                resolve()
            }
        })
    })
}

const driverSetup = async (force = false) => {
    logger.info('Printer mxj driver install beginning...')
    if (!force) {
        const installed = await hasInstalledNew()
        if (installed) {
            return
        }
    }
    try {

        logger.info(`start install pdf print......`);
        await installDriver()
        if (ISMAC) {
            await setupDefaultPrinter()
            VersionMigration.launchctlForPrinterDriver()
            VersionMigration.openPrinterClient()
        } else {
            if (isMSI) {
                // exe version will set default printer automatically
                waitForSecond(5).then(() => {
                    setupDefaultPrinter()
                })
                waitForSecond(15).then(() => {
                    setupDefaultPrinter()
                })
            }
        }
        // mainWin.getMainWin().webContents.send('success-setup-sys-printer')
        // mainWin.getMainWin().webContents.send('end-setup-sys-printer')
        return Promise.resolve()
    } catch (error) {
        logger.error('error in setup....' + error)
        // mainWin.getMainWin().webContents.send('error-setup-sys-printer')
        // mainWin.getMainWin().webContents.send('end-setup-sys-printer')
        return Promise.resolve(error)
    }
}

module.exports = {
    setup: driverSetup,
    hasInstalled: hasInstalledNew
}
