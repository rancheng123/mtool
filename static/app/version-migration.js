const fs = require('fs')
const path = require('path')
const logger = require('./logger')
const execFile = require('child_process').execFile
const exec = require('child_process').exec

/**
 * auto uninstall the previous mTool that installed inside user's dir.
 * cau the current mTool is now been installed in side "Program Files (with x86 on x64)"
 */
function uninstallMToolInUserDir() {
    if (process.platform !== 'win32') {
        return
    }
    const fp = process.env.LOCALAPPDATA + '\\Programs\\mTool\\Uninstall mTool.exe';
    if (!fs.existsSync(fp)) {
        return
    }
    logger.info('mTool inside user dir exist, will uninstall now ....')
    execFile(fp, ['/S'], (error, stdout, stderr) => {
        if (error) {
            logger.error('uninstall in-user-dir mTool error: ' + error)
        }
        if (stderr) {
            logger.error('uninstall in-user-dir mTool stderr: ' + stderr)
        }
        if (stdout) {
            logger.error('uninstall in-user-dir mTool stdout: ' + stdout)
        }
        if (!error && !stderr) {
            logger.info('uninstall in-user-dir mTool done')
        }
    })
}

/**
 * auto run launchctl on Mac
 */
function launchctlForPrinterDriver() {
    if (process.platform !== 'darwin') {
        return
    }
    const cmd = 'launchctl load /Library/LaunchDaemons/com.isecprinter.server.plist'
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            logger.warn('[launchctl load /Library/LaunchDaemons/com.isecprinter.server.plist] error: ' + error)
        }
        if (stderr) {
            logger.warn('[launchctl load /Library/LaunchDaemons/com.isecprinter.server.plist] stderr: ' + stderr)
        }
        if (stdout) {
            logger.warn('[launchctl load /Library/LaunchDaemons/com.isecprinter.server.plist] stdout: ' + stdout)
        }
        if (!error && !stderr) {
            logger.info('[launchctl load /Library/LaunchDaemons/com.isecprinter.server.plist] done')
        }
    })
}

function openPrinterClient() {
    if (process.platform !== 'darwin') {
        return
    }
    const cmd = 'open /Applications/PrinterClient.app';
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            logger.warn('[open /Applications/PrinterClient.app] error: ' + error)
        }
        if (stderr) {
            logger.warn('[open /Applications/PrinterClient.app] stderr: ' + stderr)
        }
        if (stdout) {
            logger.warn('[open /Applications/PrinterClient.app] stdout: ' + stdout)
        }
        if (!error && !stderr) {
            logger.info('[open /Applications/PrinterClient.app] done')
        }
    })
}

function deleteWindowsUpdateJson() {
    if (process.platform !== 'win32') {
        return
    }
    const fp = path.join(process.env.APPDATA, 'mTool', '__update__', 'update-info.json')
    if (fs.existsSync(fp)) {
        fs.unlinkSync(fp)
        logger.info('deleted [' + fp + ']')
    }
}

module.exports = {
    uninstallMToolInUserDir: uninstallMToolInUserDir,
    launchctlForPrinterDriver: launchctlForPrinterDriver,
    openPrinterClient: openPrinterClient,
    deleteWindowsUpdateJson: deleteWindowsUpdateJson
};
