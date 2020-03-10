/**
 * 此脚本用来用来注册一个LaunchDaemons，用来监视mTool被删除，实现自动卸载驱动。
 * 它会复制一些文件，并在preflight中添加一些代码。
 *
 * 要使用此脚本，有几个前置条件：
 * 1. 把外包提供的驱动程序命名为“hpdriver.pkg”，放至/extraResources/mac/common/下面
 * 2. preflight文件的最后一行（除开空白行）必须为“exit 0”，这样才能找到添加自动卸载驱动的代码的位置
 * 3. 驱动更新后，记得增加 static/app/pdf-printer-setup.js 中的 CURRENT_DRIVER_VERSION 的值
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

async function copyUninstPlist() {
    const src = path.join(__dirname, 'com.mxj360.mtool.uninst.plist');
    const dest = path.join(__dirname,
        '../../extraResources/mac/common/hpdriver.pkg/Contents/Resources/com.mxj360.mtool.uninst.plist');
    fs.copyFileSync(src, dest);
    console.log('copied com.mxj360.mtool.uninst.plist');
}

async function copyUninstScript() {
    const src = path.join(__dirname, 'mtool_try_uninstall_driver.sh');
    const dest = path.join(__dirname,
        '../../extraResources/mac/common/hpdriver.pkg/Contents/Resources/mtool_try_uninstall_driver.sh');
    fs.copyFileSync(src, dest);
    console.log('copied mtool_try_uninstall_driver.sh');
}

async function insertToPreflight() {
    return new Promise((resolve, reject) => {
        const addFp = path.join(__dirname, 'preflight_add.sh');
        const addContent = fs.readFileSync(addFp, { encoding: 'utf8' });
        const fp = path.join(__dirname,
            '../../extraResources/mac/common/hpdriver.pkg/Contents/Resources/preflight');
        const tmpOut = path.join(os.tmpdir(), 't' + Date.now() + Math.floor(Math.random * 1000) + '.sh');
        const outStream = fs.createWriteStream(tmpOut);
        let isInAddedArea = false;
        let alreadyReplaced = false;
        let rmPrinterLineExists = false;
        const rmPrinterCmd = 'lpadmin -x 梦想加打印机';
        var lineReader = readline.createInterface({
            input: fs.createReadStream(fp)
        });
        lineReader.on('line', (line) => {
            if (line === rmPrinterCmd) {
                rmPrinterLineExists = true;
            }
            if (line.indexOf('lpadmin -p') === 0) {
                if (rmPrinterLineExists) {
                    console.log('preflight add rm printer skipped');
                } else {
                    outStream.write(rmPrinterCmd + '\n');
                    console.log('preflight added rm printer block');
                }
            }
            if (!alreadyReplaced && line.indexOf('=== preflight_add.sh begin ===') >= 0) {
                isInAddedArea = true;
            }
            if (isInAddedArea) {
                if (line.indexOf('=== preflight_add.sh end ===') >= 0) {
                    outStream.write(addContent);
                    alreadyReplaced = true;
                    isInAddedArea = false;
                    console.log('preflight replaced the block')
                }
                return;
            }
            if (line === 'exit 0') {
                if (!alreadyReplaced) {
                    outStream.write('\n' + addContent + '\n');
                    console.log('preflight inserted before "exit 0"')
                }
            }
            outStream.write(line + '\n');
        });
        lineReader.on('close', () => {
            outStream.end();
            fs.renameSync(tmpOut, fp);
            fs.chmodSync(fp, 0o755);
            resolve();
        })
    });
}

async function checkNodeVer() {
    const cmps = process.version.split(/\D+/g).map(_ => parseInt(_)).filter(_ => !isNaN(_));
    if (cmps.length !== 3) {
        throw new Error('Unkown node version');
    }
    if (cmps[0] < 8 || (cmps[0] === 8 && cmps[1] < 5)) {
        throw new Error('Need node version 8.5.0 or above');
    }
}

async function bootstrap() {
    try {
        await checkNodeVer();
        await copyUninstPlist();
        await copyUninstScript();
        await insertToPreflight();
    } catch (ex) {
        console.error(ex);
    }
}

bootstrap();
