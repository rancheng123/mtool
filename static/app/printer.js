const fs = require('fs')
const nodePath = require('path')
const Promise = require('bluebird')
const zlib = require('zlib')
const moment = require('moment')
const Printer = require('ipp-printer')
const url = require('url')
const uuid = require('node-uuid')
const _ = require('lodash')
const httpServer = require('./http-server')
const printerSetup = require('./printer-setup')
const mainWindow = require('./main-window')
const config = require('./configuration')
const sso = require('./sso')
const utils = require('./utils')
const logger = require('./logger')
const printHistory = require('./print-history')
const rpErrors = require('request-promise/errors')
const guestMode = require('./guest-mode')

const PRINTER_IP = 'localhost'
const PRINT_HISTORY_EXPIRE_TIME = 1000 * 60 * 60 * 24
const MAX_ZIPPED_PS_FILE_SIZE = 1024 * 1024 * 200

const POST_PRINTER_CONFIG_DEFAULT = { color: 1, duplexprint: 1, papersize: 'A4' }

const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})

let printer = null
let postPrinterServer = null

function createPrinter(userLoginName) {

    let isGuest = guestMode.isGuestMode()
    logger.info(`current user is guest: ${isGuest}`)
    if (isGuest) return

    logger.info(userLoginName)

    // 因为使用了新的驱动(postPrinterServer)，去掉了以前的驱动：
    // const printerConfig = require('rc')('ipp-printer', {
    //     name: '梦想加打印机',
    //     zeroconf: false,
    //     port: 6311,
    //     server: httpServer.createServer()
    // })
    // const psSaveDir = config.getPrintDir()
    // if (!printer) {
    //     logger.info('create mxj printer.....')

    //     try {
    //         printer = new Printer(printerConfig)
    //     } catch (error) {
    //         logger.error(`error happened when try to create printer server ${error}`)
    //     }

    //     printer.on('job', (job) => {
    //         cleanOldPsFile(psSaveDir)

    //         const originalName = job.name.replace(/^\d+ - /, '')
    //         logger.info(`start print job: ${originalName}`)
    //         let mainWin = mainWindow.getMainWin()
    //         mainWin.show()
    //         mainWin.webContents.send('start-print', originalName)
    //         // print error from here, need check it why
    //         getPrintQuota().then((quota) => {
    //             logger.info(`got quota from server: ${JSON.stringify(quota)}, job::${job}`)
    //             logger.info(job)
    //             startPrintJob(quota, job, psSaveDir)
    //         }).catch(error => {
    //             logger.error(`get printer quota: ${error}`)
    //             mainWindow.getMainWin().webContents.send('print-error', '获取打印配额出错')
    //         })
    //     })

    //     printer.server.on('listening', () => {
    //         logger.info('ipp-printer listening on:', url.format({ protocol: 'http', hostname: PRINTER_IP, port: printerConfig.port }))
    //         // auto add a printer to system
    //         // logger.info(`try to create a printer: ${printerConfig.name}`)
    //         if (process.platform === 'win32') {
    //             printerSetup.setupPrinter(printerConfig.name)
    //         }
    //     })
    // }

    /**
     * 新的打印驱动
     */
    if (!postPrinterServer) {
        /**
         * 监听初始化
         */
        postPrinterServer = httpServer.createPostServer(postPrinterHandler)
        /**
         * 写入配置
         */
        let postConfigureFileCont = '; 打印驱动配置文件 printer-config.ini \n'
        for (let key in POST_PRINTER_CONFIG_DEFAULT) {
            let val = POST_PRINTER_CONFIG_DEFAULT[key]
            val = typeof val === 'string' ? ('"' + val + '"') : val
            postConfigureFileCont += key + ' = ' + val + '\n'
        }

        const confPath = config.getPrintDir()
        fs.writeFile(confPath + '/printer-config.ini', postConfigureFileCont, 'utf-8',()=>{

        });
    }
}


//是否可以打印
function isAllowdPrint(quota,printParams){

    //测试  start
   // var printParams = {"realFileName":"打印点数扣除逻辑 (0828).pdf","fileName":"ec511aee-5d68-49e5-b603-2df8e9359dc7.pdf.gz","filePath":"http://10.28.12.197:10080/file/ec511aee-5d68-49e5-b603-2df8e9359dc7.pdf.gz","quantity":"1","printerMacAddress":"e0:9d:31:d5:4b:bb","color":"1","duplexPrint":"1","paperSize":"9","pages":"1","direction":"1"};
    //测试  end


    //测试 start
    // global.mainWindow = mainWindow;
    // debugger
    // var quota = {
    //     "organizationMember":true,
    //     "userQuota":0,
    //     "organizationQuota":0,
    //     "quota":10
    // };
    // quota.userQuota = 0;
    // quota.organizationQuota = 0;
    //测试  end


    //取消前端拦截
    return true;

    //兼容老的接口
    if(typeof quota.organizationMember == 'undefined'){
        return true;

    }
    //兼容新的接口
    else{
        //如果加入企业
        if(quota.organizationMember){
            //企业点数足够，正常打印
            if(quota.organizationQuota >= printParams.pages){

                return true;
            }
            //如果企业点数不足，扣除个人点数
            else{
                //如果企业点数不足,个人点数足够，正常打印
                if(quota.userQuota >= printParams.pages){
                    //提示
                    mainWindow.getMainWin().webContents.send('info-msg', '您所在企业打印点数不足，已扣除个人点数，撤销打印任务后，将退还打印扣除点数')

                    return true;
                }else{
                    //提示
                    mainWindow.getMainWin().webContents.send('info-msg', '您所在企业与您个人打印点数均不足，请联系企业管理员进行充值')
                    return false;
                }
            }

        }else{

            //个人点数足够，正常打印
            if(quota.userQuota >= printParams.pages){
                return true;
            }else{
                //提示
                mainWindow.getMainWin().webContents.send('info-msg', '您个人打印点数不足，请联系企业管理员进行充值')
                return false;
            }
        }
    }



}

const query = require('querystring')
function postPrinterHandler(request, response) {
    logger.info('mTool print start  (收到 打印客户端的请求)  ---------');


    var requestParams = url.parse(request.url, true)
    response.writeHead(200, { 'Content-Type': 'text/json' })

    if (request.method === 'GET') {
        if (requestParams.pathname === '/print') {
            var printParams = Object.assign({}, POST_PRINTER_CONFIG_DEFAULT, requestParams.query)




            //start
            getPrintQuota().then((quota) => {
                logger.info(`got quota from server: ${JSON.stringify(quota)}`)

                if(!isAllowdPrint(quota,printParams)){
                    return;
                }

                logger.info(`打印任务：`);
                logger.info(`docname: ${printParams.docname}`);
                logger.info(`pages: ${printParams.pages}`);
                logger.info(`copies: ${printParams.copies}`);
                logger.info(`color: ${printParams.color}`);

                var errMsg = ''
                if (!printParams.copies) {
                    printParams.copies = 1;
                    // errMsg = '打印参数copies缺失'
                } else if (!printParams.pages) {
                    printParams.pages = 1;
                    // errMsg = '打印参数pages缺失'
                } else if (!printParams.docname) {
                    printParams.docname = '未命名文档';
                    // errMsg = '打印参数docname缺失'
                } else if (!printParams.filepath) {
                    errMsg = '打印参数filepath缺失'
                }

                let mainWin = mainWindow.getMainWin()
                if (errMsg) {
                    logger.error(errMsg)
                    mainWin.webContents.send('print-error', errMsg)
                    // throw printError(errMsg)
                } else {
                    logger.info(`start print job: ${printParams.docname}`)
                    const psSaveDir = config.getPrintDir()
                    cleanOldPsFile(psSaveDir)

                    const copiedFilePath = nodePath.join(psSaveDir, uuid.v4().toString() + '.pdf')
                    logger.info(`copying files from driver's filepath to: [${copiedFilePath}]`)
                    fs.copyFileSync(printParams.filepath, copiedFilePath)
                    printParams.filepath = copiedFilePath

                    mainWin.show()
                    mainWin.webContents.send('start-print', printParams.docname)


                    startPostPrintJob(quota, printParams)


                }

            }).catch(error => {
                logger.error(`get printer quota: ${error}`)
                mainWin.webContents.send('print-error', '获取打印配额出错')
            })




        }

        response.write(JSON.stringify({ success: 'ok' }))
        response.end()
    } else {
        let postData = ''
        request.addListener('data', function (chunk) {
            postData += chunk
        })
        request.addListener('end', function () {
            var params = query.parse(postData)
            logger.info('***** Post', requestParams.pathname, params)
            response.write(JSON.stringify({ success: 'ok' }))
            response.end()
        })
    }
}

function startPostPrintJob(quota, printParams) {
    if (!quota || !quota.quota) {
        mainWindow.getMainWin().webContents.send('print-error', '打印配额不足，请购买足够的配额')
        return
    }

    const originalName = /pdf$/.test(printParams.docname) ? printParams.docname : (printParams.docname + '.pdf')
    const filePageNum = printParams.pages
    const filepath = printParams.filepath
    const filename = nodePath.basename(filepath);

    logger.info(`mxj printer printed: ${printParams.docname}`)
    if (quota < filePageNum) {
        throw printError('打印配额不足，请先购买足够的配额')
    } else {
        zipAndDelPsFile(filepath, originalName, filePageNum)
            .then(() => {
                let date = Date.now()
                printHistory.saveHistory(filename + '.gz', {
                    name: originalName,
                    pageNum: filePageNum,
                    date: date,
                    dateStr: moment(date).format('YYYY-MM-DD HH:mm'),
                    // the following 4 is new from HP printer -- Dec 19, 2018:
                    color: printParams.color,
                    duplexPrint: printParams.duplexprint,
                    paperSize: printParams.papersize,
                    pages: printParams.pages,
                    direction: printParams.orientation
                })
                return getPrinters()
            })
            .then((printerArray) => {
                return uploadFileToPrinter(filepath + '.gz', filename + '.gz', printerArray)
            })
            .then((result) => {
                logger.info('上传gz之后得到的数据：' + JSON.stringify(result, null, 4) + '\r')

                let reqBody = {
                    // TODO: need to remove ps, but if i remove it, C# printer prog will report error
                    realFileName: originalName,
                    fileName: filename + '.gz',
                    filePath: 'http://' + result.printer.localIP + ':10080/file/' + filename + '.gz',
                    quantity: printParams.copies,
                    printerMacAddress: result.printer.macAddress,
                    color: printParams.color,
                    duplexPrint: printParams.duplexprint,
                    paperSize: printParams.papersize,
                    pages: printParams.pages,
                    direction: printParams.orientation
                }
                logger.info(`ready to create server post print job: ${JSON.stringify(reqBody)}`)
                let smartOfficeUrl = 'http://' + config.readSettings('smartOfficeServerUrl')
                return sso.getCsrfTokenAndSession(smartOfficeUrl, config.readSettings('authToken')).then((csrfTokenResp) => {
                    logger.info(`use rest to get csrf token: ${csrfTokenResp.csrf}, session: ${csrfTokenResp.sid}`)
                    return createServerPrintJob(reqBody)
                })
            })
            .then((createJobResp) => {
                logger.info(`created print job sucessed`)
                const mainWin = mainWindow.getMainWin()
                mainWin.show()
                mainWin.webContents.send('print-ps-finished', { originFileName: originalName, filename: filename })
            })
            .catch((err) => {
                logger.error(`print job ${filename}.gz failed! ${err}`)
                err.code = 'print-error'
                sendPrintErrorToUi(err)
            })
    }
}

function startPrintJob(quota, job, psSaveDir) {
    if (!quota || !quota.quota) {
        mainWindow.getMainWin().webContents.send('print-error', '打印配额不足，请购买足够的配额')
        return
    }

    // original name is like [11 - broofa/node-uuid: Generate RFC-compliant UUIDs in JavaScript]
    const originalName = job.name.replace(/^\d+ - /, '')
    const filename = uuid.v4().toString() + '.ps'
    const filepath = psSaveDir + '/' + filename
    const fileWriteStream = fs.createWriteStream(filepath)
    job.pipe(fileWriteStream)
        .on('finish', () => {
            logger.info(`mxj printer printed: ${filename} -- ${originalName}`)
            logger.info('*********', filepath + '.gz', filename + '.gz')
            let filePageNum
            getFileInfo(filepath).then((stats) => {
                return getPagesFromPsFile(filepath, stats.size - 100, stats.size)
            }).then((pageNum) => {
                filePageNum = pageNum
                if (quota < pageNum) {
                    throw printError('打印配额不足，请先购买足够的配额')
                } else {
                    return zipAndDelPsFile(filepath, originalName, pageNum)
                }
            }).then(() => {
                let date = Date.now()
                printHistory.saveHistory(filename + '.gz', {
                    name: originalName,
                    pageNum: filePageNum,
                    date: date,
                    dateStr: moment(date).format('YYYY-MM-DD HH:mm')
                })
                return getPrinters()
            }).then((printerArray) => {
                return uploadFileToPrinter(filepath + '.gz', filename + '.gz', printerArray)
            }).then((result) => {
                let reqBody = {
                    // TODO: need to remove ps, but if i remove it, C# printer prog will report error
                    realFileName: originalName,
                    fileName: filename + '.gz',
                    filePath: 'http://' + result.printer.localIP + ':10080/file/' + filename + '.gz',
                    quantity: 1,
                    printerMacAddress: result.printer.macAddress
                }
                logger.info(`ready to create server print job: ${JSON.stringify(reqBody)}`)
                let smartOfficeUrl = 'http://' + config.readSettings('smartOfficeServerUrl')
                return sso.getCsrfTokenAndSession(smartOfficeUrl, config.readSettings('authToken')).then((csrfTokenResp) => {
                    logger.info(`use rest to get csrf token: ${csrfTokenResp.csrf}, session: ${csrfTokenResp.sid}`)
                    return createServerPrintJob(reqBody)
                })

            }).then((createJobResp) => {
                logger.info(`created print job sucessed`)
                const mainWin = mainWindow.getMainWin()
                mainWin.show()
                mainWin.webContents.send('print-ps-finished', { originFileName: originalName, filename: filename })

                logger.info('mTool print end  (接下来的工作是  小平板)  ---------');
            }).catch((err) => {
                logger.error(`print job ${filename}.gz failed! ${err}`)
                sendPrintErrorToUi(err)
            })
        })

    job.on('end', () => {
        logger.info('print job ended')
    })
}

function printAccordingHistory(history) {
    const isNewHPDriver = history.hasOwnProperty('duplexPrint');
    let smartOfficeUrl = 'http://' + config.readSettings('smartOfficeServerUrl')
    const psSaveDir = config.getPrintDir()
    let newFileName = uuid.v4() + (isNewHPDriver ? '.pdf.gz' : '.ps.gz')
    const mainWin = mainWindow.getMainWin()
    mainWin.show()

    getPrintQuota(smartOfficeUrl).then((quota) => {

        if(!isAllowdPrint(quota,history)){
            mainWin.show()
            throw printError('abortPrinting')

        }else{

            mainWin.webContents.send('start-print', history.name)
            if (quota < history.pageNum) {
                throw printError('打印配额不足，请先购买足够的配额')
            } else {
                return getPrinters()
            }
        }



    }).then((printerArray) => {
        return uploadFileToPrinter(psSaveDir + '/' + history.uuidName, newFileName, printerArray)
    }).then((result) => {
        let reqBody = {
            // TODO: need to remove ps, but if i remove it, C# printer prog will report error
            realFileName: history.name,
            fileName: newFileName,
            filePath: 'http://' + result.printer.localIP + ':10080/file/' + newFileName,
            quantity: 1,
            printerMacAddress: result.printer.macAddress
        }
        if (isNewHPDriver) {
            // 是新的HP打印驱动
            reqBody.color = history.color;
            reqBody.duplexPrint = history.duplexPrint;
            reqBody.paperSize = history.paperSize;
            reqBody.pages = history.pages;
            reqBody.direction = history.direction;
        }
        logger.info(`ready to create server print history job: ${JSON.stringify(reqBody)}`)
        return sso.getCsrfTokenAndSession(smartOfficeUrl, config.readSettings('authToken')).then((csrfTokenResp) => {
            logger.info(`use rest to get csrf token: ${csrfTokenResp.csrf}, session: ${csrfTokenResp.sid}`)
            return createServerPrintJob(reqBody)
        })
    }).then((createJobResp) => {
        logger.info(`created print job sucessed`)
        const mainWin = mainWindow.getMainWin()
        mainWin.show()
        mainWin.webContents.send('print-ps-finished', { originFileName: history.name, filename: history.uuidName })
    }).catch((err) => {
        logger.info(`print job filename: [${history.name}.gz] failed! ${err}`)


        if(!(err.message == 'abortPrinting')){
            sendPrintErrorToUi(err)
        }
    })
}

function cleanOldPsFile(psSaveDir) {
    logger.info(`try to clean old ps file in ${psSaveDir}`)

    let histories = printHistory.getAllHistories()
    _.forEach(histories, (item, key) => {
        if (Date.now() - item.date >= PRINT_HISTORY_EXPIRE_TIME) {
            logger.info(`delete expired print history record: ${key}`)
            printHistory.delHistory(key)
        }
    })

    return getFileListFromDir(psSaveDir).then((files) => {
        let psAndGzFiles = _.filter(files, (filename) => {
            return filename.endsWith('.ps.gz') || filename.endsWith('.ps')
        })
        logger.info('intent to delete expired printed files: ' + JSON.stringify(psAndGzFiles))

        _.forEach(psAndGzFiles, (filename, idx) => {
            let filepath = psSaveDir + '/' + filename
            checkIfNeedDelPrintHistory(filepath).then((isNeedDel) => {
                if (isNeedDel) {
                    logger.info(`delete file: ${filepath}`)
                    return deleteFile(filepath)
                } else {
                    return Promise.resolve()
                }
            }).catch(err => {
                logger.error(`删除打印历史记录出错: ${err}`)
            })
        })
    })
}

function zipAndDelPsFile(filepath, originalName, pageCount) {
    return new Promise((resolve, reject) => {
        // compress ps file and then create print job in smart office
        let stat = fs.statSync(filepath)

        let zipOutfilepath = filepath + '.gz'

        const gzip = zlib.createGzip()
        const input = fs.createReadStream(filepath)
        const zipout = fs.createWriteStream(zipOutfilepath)
        input.pipe(gzip)
            .on('error', (err) => {
                logger.error(`error when zip file ${filepath}` + err)
                reject(new Error('error when zip file '))
            }).pipe(zipout).on('error', (err) => {
                logger.error(`error when zip file ${filepath}` + err)
                reject(new Error('error when zip file '))
            }).on('finish', () => {
                let stats = fs.statSync(zipOutfilepath)
                let fileSizePerPage = stats.size / pageCount
                logger.info(`after zipped: ${Number(fileSizePerPage / 1024).toFixed(2)}K per page.`)

                fs.unlink(filepath, (err) => {
                    if (err) logger.error(`delete file ${filepath} failed!` + err)
                })

                if (stats.size >= MAX_ZIPPED_PS_FILE_SIZE) {
                    fs.unlink(zipOutfilepath, (err) => {
                        if (err) logger.error(`file is too big, delete file ${filepath} failed!` + err)
                    })
                    let maxPagePerPrint = Math.floor(MAX_ZIPPED_PS_FILE_SIZE / fileSizePerPage)
                    let printTimes = Math.ceil(pageCount / maxPagePerPrint)
                    if (maxPagePerPrint > 0) {
                        reject(printError(`文件[${originalName}]页数太多，建议分${printTimes}次打印, 每次打印不超过${maxPagePerPrint}页`))
                    } else {
                        reject(printError(`打印文件${originalName}生成的文件太大`))
                    }
                }
                resolve()
            })
    })
}

function createServerPrintJob(body) {
    let smartOfficeUrl = 'http://' + config.readSettings('smartOfficeServerUrl')
    let csrfToken = config.readSettings('csrfToken')
    let jsessionId = config.readSettings('sessionId')

    logger.info(`use csrfToken: ${csrfToken}, jsessionId: ${jsessionId} to create print job`)
    logger.info('createServerPrintJob filePath::' + body.filePath)

    let opt = {
        uri: smartOfficeUrl + '/api/printing/local-file',
        method: 'POST',
        json: true,
        body: body,
        headers: {
            'auth-token': config.readSettings('authToken'),
            'Cookie': `JSESSIONID=${jsessionId}`,
            'X-CSRF-TOKEN': csrfToken
        },
        transform: (body, response, resolveWithFullResponse) => {
            if (response.statusCode === 200) {
                /*测试  start*/
                // response.body.type = 1;
                // response.body.message = '3333rrrrr2222'
                /*测试  end*/

                /* 测试  start */
                // var body = {"realFileName":"nodejs-websocket - npm.pdf","fileName":"38ef8b22-83e5-4c50-973f-6b83b60df466.pdf.gz","filePath":"http://10.28.12.197:10080/file/38ef8b22-83e5-4c50-973f-6b83b60df466.pdf.gz","quantity":"1","printerMacAddress":"e0:9d:31:d5:4b:bc","color":"1","duplexPrint":"1","paperSize":"9","pages":"10","direction":"1"}
                // createServerPrintJob(body)
                /* 测试  end */


                if(response.body && response.body.type == 2){
                    logger.info(response.body.message)

                    mainWindow.getMainWin().webContents.send('info-msg', response.body.message)

                    //throw new Error(response.body.message)
                }else{
                    return response.body
                }
            }else if (response.statusCode === 401) {
                logger.info('create server print job, server return status 401, means need login')
                const mainWin = mainWindow.getMainWin()
                mainWin.webContents.send('login-expired')
                throw new Error('login-expired')
            } else {
                logger.error('create server print job failed, status code: ' + response.statusCode);
                try {
                    logger.error('create server print job failed, response: ' + JSON.stringify(response.body));
                } catch (ex) {
                    logger.error('create server print job failed, parse response error: ' + ex);
                }
                //mainWindow.getMainWin().webContents.send('info-msg', response.body)


                throw new Error(response.body)
            }
        }
    }

    return rp(opt).catch(rpErrors.RequestError, (error) => {
        logger.errorLocal(error)
        throw printError(`调用服务器API,创建打印任务出错`)
    })
}

async function uploadFileToPrinter(filePath, filename, printerArray) {
    let selectedPrinter = await choosePrinter(printerArray);
    if (selectedPrinter) {
        let formData = {
            printFile: {
                value: fs.createReadStream(filePath),
                options: {
                    filename: filename
                }
            }
        }
        try {
            let res = await rp({
                uri: 'http://' + selectedPrinter.localIP + ':10080/upload',
                method: 'POST',
                formData: formData,
                json: true,
                transform: (body, response, resolveWithFullResponse) => {
                    if (response.statusCode === 200 && response.body.success) {
                        return {
                            response: response.body,
                            printer: selectedPrinter
                        }
                    } else {
                        throw new Error('upload file to printer failed, status code: ' + response.statusCode + '; response: ' + JSON.stringify(response.body))
                    }
                }
            });
            return res;
        } catch (err) {
            // 2次尝试
            logger.info('上传任务失败，重新尝试一次');
            if (printerArray.length <= 1) {
                throw err;
            } else {
                // 移出不能上传的节点
                for (var i = 0; i < printerArray.length; i++) {
                    if (printerArray[i].localIP === selectedPrinter.localIP) {
                        printerArray.splice(i, 1)
                    }
                }
            }
            selectedPrinter = await choosePrinter(printerArray);
            formData = {
                printFile: {
                    value: fs.createReadStream(filePath),
                    options: {
                        filename: filename
                    }
                }
            }
            let res = await rp({
                uri: 'http://' + selectedPrinter.localIP + ':10080/upload',
                method: 'POST',
                formData: formData,
                json: true,
                transform: (body, response, resolveWithFullResponse) => {
                    if (response.statusCode === 200 && response.body.success) {
                        return {
                            response: response.body,
                            printer: selectedPrinter
                        }
                    } else {
                        throw new Error('upload file to printer failed, status code: ' + response.statusCode + '; response: ' + JSON.stringify(response.body))
                    }
                }
            });

            return res;
        }

    } else {
        // 出错了
        throw printError('你所在的场地找不到打印机, 请先在你所在场地的门禁刷卡, 用于识别你在哪个场地');
    }
}

function uploadFileToPrinterold(filePath, filename, printerArray) {
    return choosePrinter(printerArray).then(selectedPrinter => {
        if (!selectedPrinter) {
            logger.info('no printer selected');
            return Promise.reject(printError('你所在的场地找不到打印机, 请先在你所在场地的门禁刷卡, 用于识别你在哪个场地'))
        }

        logger.info(`upload file ${filePath} to printer:${selectedPrinter.localIP}, fileName:${filename}`)

        let formData = {
            printFile: {
                value: fs.createReadStream(filePath),
                options: {
                    filename: filename
                }
            }
        }

        return rp({
            uri: 'http://' + selectedPrinter.localIP + ':10080/upload',
            method: 'POST',
            formData: formData,
            json: true,
            transform: (body, response, resolveWithFullResponse) => {
                if (response.statusCode === 200 && response.body.success) {
                    return {
                        response: response.body,
                        printer: selectedPrinter
                    }
                } else {
                    throw new Error('upload file to printer failed, status code: ' + response.statusCode + '; response: ' + JSON.stringify(response.body))
                }
            }
        }).catch(rpErrors.RequestError, (error) => {
            logger.errorLocal(error)
            throw printError(`上传文件到打印机控制器(${selectedPrinter.localIP})出错，请在场地门禁刷卡后重试或联系管理员`)
        })
    })
}

function getPrinters() {
    let self = this

    let smartOfficeUrl = 'http://' + config.readSettings('smartOfficeServerUrl')

    return rp({
        uri: smartOfficeUrl + '/api/printer/list-user-around',
        method: 'GET',
        json: true,
        headers: {
            'auth-token': config.readSettings('authToken')
        },
        transform: (body, response, resolveWithFullResponse) => {
            if (response.statusCode === 200) {
                logger.info('get prints list, server return status 200: ' + JSON.stringify(response.body))
                return response.body
            } if (response.statusCode === 401) {
                logger.info('get prints list, server return status 401, means need login')
                mainWindow.getMainWin().webContents.send('login-expired')
                throw new Error('login-expired')
            } else {
                throw new Error('getPrinters failed, status code: ' + response.statusCode)
            }
        }
    }).catch(rpErrors.RequestError, (error) => {
        logger.errorLocal(error)
        throw printError(`从服务器获取打印机列表出错`)
    })
}

function getPagesFromPsFile(filename, startPos, endPos) {
    return new Promise((resolve, reject) => {
        var rs = fs.createReadStream(filename, {
            encoding: 'utf8',
            start: startPos,
            end: endPos
        })
        var pageNum = 0
        rs.on('data', (chunk) => {
            var matched = chunk.toString().match(/%%Pages: (\d+)/)
            if (matched) {
                pageNum = matched[1]
                rs.close()
            }
        })
            .on('close', () => {
                logger.info(`after parsed ps file, we know will print ${pageNum} pages.`)
                resolve(pageNum)
            })
            .on('error', (err) => {
                reject(err)
            })
    })

}

function getPrintQuota() {
    let self = this
    let smartOfficeUrl = 'http://' + config.readSettings('smartOfficeServerUrl')
    let authToken = config.readSettings('authToken')
    return rp({
        uri: smartOfficeUrl + '/api/printing/quota',
        method: 'GET',
        json: true,
        headers: {
            'auth-token': authToken
        },
        transform: (body, response, resolveWithFullResponse) => {
            if (response.statusCode === 200) {
                logger.info('get print quota, server return status 200: ' + JSON.stringify(response.body))
                return response.body
            } if (response.statusCode === 401) {
                logger.info('get print quota, server return status 401, means need login')
                logger.info('token is: authToken')
                utils.cleanUserInfo(config)
                let mainWin = mainWindow.getMainWin()
                mainWin.webContents.send('login-expired')
                throw new Error('login-expired')
            } else {
                throw new Error('getPrintQuota failed, status code: ' + response.statusCode)
            }
        }
    }).catch(rpErrors.RequestError, (error) => {
        logger.errorLocal(error)
        throw printError(`从服务器获取打印配额出错`)
    })
}

function getPrintJob() {
    let smartOfficeUrl = 'http://' + config.readSettings('smartOfficeServerUrl')
    // 增加判断是否需要查询私印
    const supportPrinters = config.readSettings('supportPrinters')
    let flag = '/api/printing/ready-file';
    supportPrinters.map(item => {
        if (item.name === 'sys') {
            flag = '/api/printing/ready-file?flag=1';
        }
    })
    let reqOpts = {
        uri: smartOfficeUrl + flag,
        method: 'GET',
        json: true,
        headers: {
            'auth-token': config.readSettings('authToken')
        },
        transform: (body, response, resolveWithFullResponse) => {
            if (response.statusCode !== 200) {
                try {
                    logger.info('getPrintJob result body: ' + JSON.stringify(response.body));
                } catch (ex) {
                    logger.info('log result body error: ' + ex);
                }
            }
            if (response.statusCode === 200) {
                return response.body
            } if (response.statusCode === 401) {
                logger.info('get server print job, server return status 401, means need login')
                utils.cleanUserInfo(config)
                let mainWin = mainWindow.getMainWin()
                mainWin.webContents.send('login-expired')
                throw new Error('login-expired')
            } else {
                throw new Error('getPrintJob failed, status code: ' + response.statusCode)
            }
        }
    }

    return rp(reqOpts).catch(rpErrors.RequestError, (error) => {
        logger.errorLocal(error)
        throw printError(`从服务器获取打印任务出错`)
    })
}

function deletePrintFileById(fileId) {
    let smartOfficeUrl = 'http://' + config.readSettings('smartOfficeServerUrl')
    let reqOpts = {
        uri: smartOfficeUrl + '/api/printing/ready-file/' + fileId,
        method: 'DELETE',
        json: true,
        headers: {
            'auth-token': config.readSettings('authToken')
        },
        transform: (body, response, resolveWithFullResponse) => {
            if (response.statusCode === 200) {
                logger.info(reqOpts.uri + ', response: ' + JSON.stringify(response.body))
                if (!response.body) {
                    return true
                } else {
                    return false
                }
            } else if (response.statusCode === 401) {
                logger.info('delete server print job, server return status 401, means need login')
                utils.cleanUserInfo(config)
                let mainWin = mainWindow.getMainWin()
                mainWin.webContents.send('login-expired')
                throw new Error('login-expired')
            } else {
                throw new Error('delete print file failed, status code: ' + response.statusCode)
            }
        }
    }

    return rp(reqOpts)
}

function getFileListFromDir(dirPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                logger.error(err)
                reject(new Error(`读取文件夹文件列表失败：${dirPath}`))
            } else {
                resolve(files)
            }
        })
    })
}

function getFileInfo(path) {
    return new Promise((resolve, reject) => {
        fs.lstat(path, (err, stats) => {
            if (err) {
                logger.error(err)
                reject(new Error(`获取文件信息失败: ${path}`))
            } else {
                resolve(stats)
            }
        })
    })
}

function checkIfNeedDelPrintHistory(filePath) {
    return getFileInfo(filePath).then((stats) => {
        let needDel = false
        let ctime = stats.ctime.getTime()
        let now = Date.now()
        let timeDiff = now - ctime
        if (now - ctime >= PRINT_HISTORY_EXPIRE_TIME) {
            logger.debug(`need to delete ${filePath}: ctime: ${ctime}, now: ${now}, diff: ${timeDiff}`)
            needDel = true
        }

        return needDel
    })
}

function deleteFile(path) {
    return new Promise((resolve, reject) => {
        fs.unlink(path, (err) => {
            if (err) {
                logger.error(err)
                reject(`删除文件失败：${path}`)
            } else {
                resolve()
            }
        })
    })
}

function choosePrinter(printerArray) {
    if (!_.isArray(printerArray) || printerArray.length === 0) {
        return Promise.resolve(null)
    }
    return selectPrinterBySpeed(printerArray).then(printer => {
        if (printer) {
            logger.info('selectPrinterBySpeed: ' + printer.localIP)
            return printer
        }
        const rand = selectPrinterByRandom(printerArray)
        logger.info('selectPrinterByRandom: ' + rand.localIP)
        return rand
    });
}

function sendPrintErrorToUi(err) {
    let errorMsg = '创建打印任务失败'
    if (err && err.code === 'print-error') {
        errorMsg = err.message
    }
    mainWindow.getMainWin().webContents.send('print-error', errorMsg)
}

function printError(message) {
    let err = new Error(message)
    err.code = 'print-error'

    return err
}

function selectPrinterByRandom(printerArray) {
    // 随机选择一台打印机
    const printerIdx = Math.floor(Math.random() * printerArray.length)
    return printerArray[printerIdx]
}

function selectPrinterBySpeed(printerArray) {
    const allProms = []
    printerArray.forEach(printer => {
        allProms.push(testPrinterSpeed(printer))
    })
    return Promise.race(allProms)
}

/**
 * test the printer by calling the API, fulfill if success, or reject on error or timeout
 * @param printer
 */
function testPrinterSpeed(printer) {
    const reqProm = new Promise((resolve, reject) => {
        const start = Date.now();
        rp({
            uri: 'http://' + printer.localIP + ':10080/upload',
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            method: 'POST',
            json: true,
            transform: (body, response, resolveWithFullResponse) => {
                if (response.statusCode === 200 && response.body && response.body.success === false) {
                    // this API call is expected be success === false
                    const dt = Date.now() - start
                    logger.info('testPrinterSpeed ' + printer.localIP + ': ' + dt)
                    resolve(printer)
                } else {
                    logger.error('testPrinterSpeed ' + printer.localIP + ' error, status code: ' + response.statusCode)
                    try {
                        logger.error('testPrinterSpeed ' + printer.localIP + ' error, body: ' + JSON.stringify(response.body))
                    } catch (ex) {
                        logger.error('testPrinterSpeed ' + printer.localIP + ' error, parse body error: ' + ex)
                    }
                }
                return {}
            }
        }).catch(() => {
        })
    })
    const timeoutProm = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(null)
        }, 5000)
    })
    return Promise.race([reqProm, timeoutProm])
}
function getdir() {
    let appName = 'mTool';
    var o;
    switch (process.platform) {
        case 'linux':
            o = prepareDir(process.env['XDG_CONFIG_HOME'], appName)
                .or(process.env['HOME'], '.config', appName)
                .or(process.env['XDG_DATA_HOME'], appName)
                .or(process.env['HOME'], '.local', 'share', appName)
                .result;
            break;
        case 'darwin':
            o = prepareDir(process.env['HOME'], 'Library', 'Logs', appName)
                .or(process.env['HOME'], 'Library', 'Application Support', appName)
                .result;
            break;
        case 'win32':
            o = prepareDir(process.env['APPDATA'], appName)
                .or(process.env['USERPROFILE'], 'AppData', 'Roaming', appName)
                .result;
            break;
    }
    return o

    function prepareDir(dirPath) {
        // jshint -W040
        if (!this || this.or !== prepareDir || !this.result) {
            if (!dirPath) {
                return { or: prepareDir };
            }
            dirPath = nodePath.join.apply(nodePath, arguments);
            mkDir(dirPath);
            try {
                fs.accessSync(dirPath, fs.W_OK);
            } catch (e) {
                return { or: prepareDir };
            }
        }

        return {
            or: prepareDir,
            result: (this ? this.result : false) || dirPath
        };
    }

    function mkDir(dirPath, root) {
        var dirs = dirPath.split(nodePath.sep);
        var dir = dirs.shift();
        root = (root || '') + dir + nodePath.sep;

        try {
            fs.mkdirSync(root);
        } catch (e) {
            if (!fs.statSync(root).isDirectory()) {
                throw new Error(e);
            }
        }

        return !dirs.length || mkDir(dirs.join(nodePath.sep), root);
    }
}
/*
  print: {sys:"http://fefefefef",pdf:3}
*/
function printLog(print) {


    var dir = getdir();

    if (dir) {
        let ff = nodePath.join(dir, 'print.log');
        if (fs.existsSync(ff)) {
            let log = fs.readFileSync(ff, 'utf8');
            log = JSON.parse(log);
            if (print) {
                log.sys = print.sys || log.sys;
                log.pdf = print.pdf || log.pdf;
                fs.writeFileSync(ff, JSON.stringify(log), 'utf8');
            }
            return log;
        } else {
            if (print) {
                print = JSON.stringify(print);
                fs.writeFileSync(ff, print, 'utf8');
            }
            return print;
        }

    } else {
        return false;
    }
}

module.exports = {
    createPrinter: createPrinter,
    printLog: printLog,
    getdir: getdir,
    getPrintJob: getPrintJob,
    printAccordingHistory: printAccordingHistory,
    deletePrintFileById: deletePrintFileById,
    createServerPrintJob: createServerPrintJob
}
