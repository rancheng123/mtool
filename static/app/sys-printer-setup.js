const net = require('net')
const fs = require('fs')
const path = require('path')
const electron = require('electron')
const logger = require('./logger')
const exec = require('child_process').exec
const configuration = require('./configuration')
const request = require('request')
const requestProgress = require('request-progress')
const unzip = require('extract-zip')
const print = require('./printer.js');

const app = electron.app
const darwinDriverPath = '/Applications/Brocadesoft/BSPrintNotify.app'
const windowsDriverPath = `${process.env['PUBLIC']}\\Documents\\Brocadesoft\\BSPrintNotify.exe`

const darwinResourcesDir = print.getdir()
const darwinResourcesScript = path.resolve(app.getAppPath() + '/../extraResources/mac')
let windowsResourcesDir = print.getdir()

const s3Dir = 'https://s3.cn-north-1.amazonaws.com.cn/mtool'
const ISMAC = process.platform === 'darwin'
let downloadFile = ''
let saveName = ''

async function hasInstalledNew() {
    getDownloadFile()
    let log = print.printLog();
    if (log && log.sys === downloadFile) {
        // 开启
        startUserIdProvider();
        startSysDriverNotify();
        return true
    }

    return false
}

// 检查是否已经安装司印打印机驱动
async function hasInstalled(timestampToCheck = 0) {
    let targetFile = ISMAC ? darwinDriverPath : windowsDriverPath
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
        logger.info('******. sys printer hasInstalled checkTimestamp: ' + st.ctime.getTime() + ' - vs - ' + timestampToCheck)
        if (st.ctime.getTime() >= timestampToCheck - 30000) {
            return true
        } else {
            return false
        }
    } catch (err) {
        logger.info('******. sys printer hasInstalled checkTimestamp exception: ' + err)
        return false
    }
}

function getSaveName(downloadFile) {
    let len = downloadFile.split('/')
    let fileName = len[len.length - 1]
    return fileName || (ISMAC ? 'SysPrinter.pkg' : 'SysPrinter.exe')
}

function getDownloadFile() {
    const supportPrinters = configuration.readSettings('supportPrinters') || [];
    let macDownloadUrl
    let winDownloadUrl
    supportPrinters.map(function (driver) {
        if (driver.name === 'sys') {
            macDownloadUrl = driver.macDownloadUrl
            winDownloadUrl = driver.winDownloadUrl
        }
    })
    if (ISMAC) {
        downloadFile = macDownloadUrl
    } else {
        downloadFile = winDownloadUrl
    }
    saveName = getSaveName(downloadFile)
}

// 下载司印打印机驱动
function downloadSysDriver() {
    return new Promise((resolve, reject) => {
        getDownloadFile()
        logger.info(`download sys printer from ${downloadFile}`)
        let filename = path.join(ISMAC ? darwinResourcesDir : windowsResourcesDir, saveName);
        requestProgress(request(downloadFile), {})
            .on('progress', (state) => {
                logger.info(`download file state, ${JSON.stringify(state)}`)
            })
            .on('error', (err) => {
                logger.error(`download file error....${err}`)
                reject(new Error('download sys printer driver error'))
            })
            .on('end', () => {
                // mainWin.getMainWin().webContents.send('download-sys-printer-progress', {'percent': 1})
                logger.info('download finished.')
                logger.info(`file save to:${filename}`);
                setTimeout(() => {
                    resolve()
                }, 500)
            })
            .pipe(fs.createWriteStream(filename)).on('error', (err) => {
                logger.error(`download file error....${err}`)
                reject(new Error('download sys printer driver error'))
            })
    })
}

function unzipdrvier(callback) {
    if (path.extname(saveName) === '.zip') {
        // 解压缩
        logger.info(`unzip sys driver start`);
        unzip(`${darwinResourcesDir}/${saveName}`, {
            dir: darwinResourcesDir
        }, err => {
            if (err) {
                logger.info(`unzip sys driver failed:`);
                logger.error(err);
                callback(err)
            } else {
                saveName = path.basename(saveName, '.zip');
                callback();
            }
        })
    } else {
        callback();
    }
}

let installre = 0;
// 安装司印打印机驱动
function installSysDriver() {
    return new Promise((resolve, reject) => {
        if (process.platform === 'darwin') {
            // 处理zip类型文件
            unzipdrvier((err) => {
                if (err) {
                    // 发生了错误
                    console.log('err:', err);
                    reject(new Error(`install sys printer driver failed....`));
                } else {
                    let installerCmd = `installer -allowUntrusted -pkg '${darwinResourcesDir}/${saveName}' -target /`
                    logger.info(`Exec shell: osascript "${darwinResourcesScript}/${process.arch}/admin-run.scpt" "${installerCmd}"`)
                    exec(`osascript "${darwinResourcesScript}/${process.arch}/admin-run.scpt" "${installerCmd}"`, (error, stdout, stderr) => {
                        if (error || stderr) {
                            logger.error(error || stderr)
                            reject(new Error(`install sys printer driver failed....`))
                        } else {
                            logger.info(`install sys printer stdout: ${stdout}`)
                        }
                    })
                }
            });
        } else {
            let installerCmd = `start "" "${windowsResourcesDir}\\${saveName}" /S`
            logger.info(`Exec shell: ${installerCmd}`)
            // 加入时间延时
            setTimeout(() => {
                // 60秒超时
                exec(installerCmd, (error, stdout, stderr) => {
                    if (error || stderr) {
                        if (installre < 2) {
                            // 可以重试2次
                            setTimeout(() => {
                                installre++;
                                installSysDriver();
                            }, 5000)
                        }
                        installre = 0;
                        logger.error(error || stderr)
                        reject(new Error(`install sys printer driver failed....`))
                    } else {
                        logger.info(`install sys printer stdout: ${stdout}`)
                    }
                })
            }, 10000);
        }
        // 保存
        print.printLog({ sys: downloadFile })

        const checkStartTS = Date.now()
        let checkCount = 0
        let checkInterval = setInterval(async () => {
            checkCount = checkCount + 1

            if (checkCount > 60) {
                clearInterval(checkInterval)
                logger.info('install sys printer finished....')
                resolve();
                // reject(new Error(`check if sys printer driver installed time out....`))
            }

            if (await hasInstalled(checkStartTS)) {
                clearInterval(checkInterval)
                logger.info('install sys printer finished.')
                resolve()
            }
        }, 10000)
    })
}

/**
 * 查询司印打印机节点服务器
 * 返回数据格式：{"nodeServerDetectionFinished":"Y","nodeServerFound":"Y","nodeServerLocation":"10.28.3.142" }
 */
function fetchNodeServerInfo() {
    logger.info('check if there is a sys node server.')
    return new Promise((resolve, reject) => {
        let client = new net.Socket()
        client.connect(6669, '127.0.0.1', () => {
            logger.info('connected to socket 127.0.0.1:6669 ......')
            client.write('requestnodeinfo')
        })

        client.on('data', (data) => {
            let str = Buffer.from(data).toString()
            logger.info(`sys driver says: ${str}`)
            client.destroy()
            let answer
            try {
                answer = JSON.parse(str)
                resolve(answer)
            } catch (error) {
                reject(new Error(`can't parse sys driver answer to json ...`))
            }
        })

        client.on('error', (err) => {
            logger.error(`error when fetch sys node server info`)
            reject(err)
        })
    })
}

// 启动司印打印程序
function startSysDriverNotify(nTry) {
    return new Promise((resolve, reject) => {
        logger.info('starting sys driver notify.')
        let command = `start "" "${windowsDriverPath}"`
        if (process.platform === 'darwin') {
            command = `open ${darwinDriverPath}`
        } else {
            // 检查是否存在
            if (!fs.existsSync(windowsDriverPath)) {
                setTimeout(() => {
                    startSysDriverNotify(nTry);
                }, 60000)
                return;
            }
        }

        logger.info(`will execute command: ${command}`)
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                logger.error(error || stderr)
                reject('start sys driver notify failed.')
            }
            // 启动
            let client = new net.Socket()
            client.connect(6669, '127.0.0.1', () => {
                logger.info('connected to socket 127.0.0.1:6669 to check if port is open ......')
                logger.info('sys notify started.')
                resolve();
            })
            client.on('data', data => {
                let str = Buffer.from(data).toString()
                logger.info('***********sys**********');
                logger.info(`sys driver says: ${str}`)
            })

            client.on('error', () => {
                // 出错重连，todo
                resolve();
            })
        })
    })
}


let userIdServer
// 启动用户Id服务
function startUserIdProvider() {
    if (userIdServer) return

    logger.info('starting userId provider socket server.')
    userIdServer = net.createServer((socket) => {
        socket.on('data', (data) => {
            let text = Buffer.from(data).toString()
            text = text.replace('\r\n', '').replace('\n', '')
            logger.info(`sys printer driver ask: ${text}`)
            if (text === 'bsclientgetuserinfo') {
                let userObj = { 'userId': '' }

                let userInfo = configuration.readSettings('userInfo')
                if (userInfo && userInfo.id) {
                    userObj = { 'userId': String(userInfo.id) }
                }
                let answer = JSON.stringify(userObj)
                logger.info(`mTool answer: ${answer}`)
                socket.write(answer)
            }
        })
    })

    userIdServer.on('error', (err) => {
        logger.error('user Id provider server error')
        throw err
    })

    userIdServer.listen(6668, '127.0.0.1', () => {
        logger.info('user Id provider start success on 127.0.0.1:6668')
    })
}

async function setup(isForce = false) {
    logger.info('Printer fssl driver install beginning...')
    if (isForce || !await hasInstalledNew()) {
        return installAndSetup()
    } else {
        startUserIdProvider()
        logger.info(`sys printer driver already installed`)
        // 添加延时
        setTimeout(() => {
            startSysDriverNotify();
        }, 30000)
    }
}

function installAndSetup() {
    startUserIdProvider()
    return downloadSysDriver().then(() => {
        return installSysDriver()
    }).then(() => {
        setTimeout(() => {
            // 第一次安装尝试3次
            startSysDriverNotify();
        }, 60000)
        return;
    })
}


module.exports = {
    setup: setup,
    hasInstalled: hasInstalledNew,
    installAndSetup
}

