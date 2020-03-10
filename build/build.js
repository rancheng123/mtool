/**
 * @file build.js
 * @author shijh
 * 修改升级信息及版本号脚本
 */

var fs = require("fs");
var process = require("process");
var path = require("path");
var readline = require('readline');
var colors = require('colors');
var env = process.argv[2];

// 配置文件路径
var buildVersionJson = path.resolve(process.cwd(), 'build_'+ env +'.json');

// 升级日志路径
var notesPath = path.resolve(process.cwd(), 'build/release-notes.md');
// 项目package.json
var packagePath = path.resolve(process.cwd(), 'package.json');
// static下package.json
var sPackagePath = path.resolve(process.cwd(), 'static/package.json');
// static/app/main-window.js
var mainWindow = path.resolve(process.cwd(), 'static/app/main-window.js');

const log = (msg = '', color = 'white') => {
    // console.log((flag ? '\x1b[4m\x1b[40m\x1b[37m' : '\x1b[31m\x1b[4m\x1b[40m') + msg);
    console.log(colors[color](msg))
}

/**
 * 重写升级日志
 * @param {Object} buildVersionJsonData 配置数据
 */
function rewriteNotes(buildVersionJsonData) {
    // [//]: # (--force-update: false--)
    // [//]: # (当上面的注释force-update的值为true时，此版本为强制升级版本)
    var notes = buildVersionJsonData.version + '\n'
        + buildVersionJsonData.describe.join('\n') + '\n\n'
        + '[//]: # (--force-update: ' + buildVersionJsonData.forceUpdate + '--)\n'
        + '[//]: # (当上面的注释force-update的值为true时，此版本为强制升级版本)';

    fs.writeFile(notesPath, notes, function (err) {
        if (err) {
            log(err, 'red');
            return;
        }
        log(notesPath + '修改成功 version：' + buildVersionJsonData.version);
    })
}

/**
 * 修改package.json中版本信息
 * @param {string} pathStr 文件路径
 * @param {Object} buildVersionJsonData 配置数据
 */
function changeVersion(pathStr, buildVersionJsonData) {
    return new Promise((resolve) => {
        fs.readFile(pathStr, 'utf8', function (err, data) {
            if (err) console.log(err);

            var newStr = data.replace(/(\"version\":) \"(.*)\"/, function ($0, $1) {
                return $1 + ' "' + buildVersionJsonData.version + '"';
            })
            fs.writeFile(pathStr, newStr, function (err) {
                if (err) {
                    log(err, 'red');
                    return;
                }
                log(pathStr + '修改成功 version：' + buildVersionJsonData.version)
                resolve();
            })
        })
    })
}

function changeUpdate(buildVersionJsonData) {
    return new Promise((resolve) => {
        fs.readFile(mainWindow, 'utf8', function (err, data) {
            if (err) console.log(err);
            const autoUpdate = buildVersionJsonData.autoUpdate;
            const clickUpdate = buildVersionJsonData.clickUpdate;

            var newStr = data.replace(/(const AUTOUPDATE = )(.*)/, function ($0, $1, $2) {
                if (autoUpdate) {
                    log('自动升级功能开启', 'yellow');
                } else {
                    log('自动升级功能关闭', 'yellow');
                }
                return $1 + autoUpdate;
            })
            var newStr2 = newStr.replace(/(const CLICKUPDATE = )(.*)/, function ($0, $1, $2) {
                if (clickUpdate) {
                    log('手动升级功能开启', 'yellow');
                } else {
                    log('手动升级功能关闭', 'yellow');
                }
                return $1 + clickUpdate;
            })
            fs.writeFile(mainWindow, newStr2, function (err) {
                if (err) {
                    log(err, 'red');
                    return;
                }
                log(mainWindow + '修改成功升级相关自动升级：' + autoUpdate + '手动升级：' + clickUpdate)
                resolve();
            })
        })
    })
}

var qaNetworkChecker = path.resolve(process.cwd(), 'static/app/networkChecker.js');
var qaElectronMain = path.resolve(process.cwd(), 'static/electron-main.js');
var qaConfig = path.resolve(process.cwd(), 'src/components/Config/Config.js');
var qaPrint = path.resolve(process.cwd(), 'src/components/Printer/Printer.js');
var qaUpdate = path.resolve(process.cwd(), 'static/app/app-updater.js');
function rewriteEnvConf() {
    if (!fs.existsSync(qaNetworkChecker)) {
        log('配置文件缺失::' + qaNetworkChecker, 'red');
        return false;
    }
    if (!fs.existsSync(qaElectronMain)) {
        log('配置文件缺失::' + qaElectronMain, 'red');
        return false;
    }
    if (!fs.existsSync(qaConfig)) {
        log('配置文件缺失::' + qaConfig, 'red');
        return false;
    }

    if (!fs.existsSync(qaUpdate)) {
        log('配置文件缺失::' + qaUpdate, 'red');
        return false;
    }

    var reWriteEnvConf = function (type = false, isqa = false) {
        [qaNetworkChecker, qaElectronMain, qaConfig, qaPrint].forEach((filePath) => {
            var fileData = fs.readFileSync(filePath, 'utf-8');
            fileData = fileData.replace(/iot\.fetchConfig\(\w+\)/ig, (a, b) => {
                return a.replace(/true|false/, type.toString())
            });
            fs.writeFileSync(filePath, fileData, 'utf-8');
        })



        // 重新写更新
        let updataData = fs.readFileSync(qaUpdate, 'utf-8');
        updataData = updataData.replace(/\$\{(stable|qa|dev)\}/ig, (a, b) => {
            return a.replace(/\w+/, appEnv)
        });
        fs.writeFileSync(qaUpdate, updataData, 'utf-8');


    }


    var appEnv = process.argv[2];


    //默认为生产环境
    let isQa = false
    if (
        process.argv[2] === 'qa' ||
        process.argv[2] === 'dev'
    ) {
        isQa = true
    }



    var isOnlineApi = false;

    if (
        process.argv[3] === 'stableApi'
    ) {
        isOnlineApi = true
    }

    if(isOnlineApi){
        /**
         * 正式环境
         */
        reWriteEnvConf(false, isQa);
        log('正式环境配置修改完成', 'yellow');
    }else{
        /**
         * 测试环境
         */
        reWriteEnvConf(true, isQa);
        log('测试环境配置修改完成', 'yellow');
    }
}

/**
 * 读取配置文件
 */
fs.readFile(buildVersionJson, 'utf8', function (err, data) {
    if (err) {
        console.log(err);
        return;
    }

    var buildVersionJsonData = JSON.parse(data);

    // 修改release-notes
    rewriteNotes(buildVersionJsonData);

    // 修改package.json的version
    changeVersion(packagePath, buildVersionJsonData)
        // .then(() => {
        //     // 修改static下面package.json的version
        //     return changeVersion(sPackagePath, buildVersionJsonData);
        // })
        .then(() => {
            // 修改升级相关
            return changeUpdate(buildVersionJsonData);
        })
        .then(() => {
            // 修改是否QA环境配置
            rewriteEnvConf();
        })
});


