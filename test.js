
var command = '/Users/mxj/zoom/mtool/node_modules/app-builder-bin/mac/app-builder';
var args = ["node-dep-tree","--dir","/Users/mxj/zoom/mtool"];
var options = {
    "env":{"PATH":"/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/X11/bin:/Applications/VMware Fusion.app/Contents/Public:/Library/Frameworks/Mono.framework/Versions/Current/Commands:/usr/local/munki","SHELL":"/bin/bash","FORCE_COLOR":"1","JB_INTERPRETER":"/usr/local/bin/node","NODE_OPTIONS":"--require /private/var/folders/kd/b6dzy5gd53d3z77n1wd29lnc0000gn/T/debugConnector.193.6494.34.js","VERSIONER_PYTHON_PREFER_32_BIT":"no","USER":"mxj","DEBUG_COLORS":"true","TMPDIR":"/var/folders/kd/b6dzy5gd53d3z77n1wd29lnc0000gn/T/","npm_config_color":"always","SSH_AUTH_SOCK":"/private/tmp/com.apple.launchd.E5YtsFIAuF/Listeners","DISPLAY":"/private/tmp/com.apple.launchd.gDYQyzUlRR/org.macosforge.xquartz:0","MOCHA_COLORS":"1","XPC_FLAGS":"0x0","VERSIONER_PYTHON_VERSION":"2.7","COLORTERM":"true","__CF_USER_TEXT_ENCODING":"0x1F5:0x19:0x34","Apple_PubSub_Socket_Render":"/private/tmp/com.apple.launchd.gcD9Eqfec4/Render","LOGNAME":"mxj","LC_CTYPE":"en_US.UTF-8","XPC_SERVICE_NAME":"com.jetbrains.WebStorm.25380","PWD":"/Users/mxj/zoom/mtool","JB_PUBLISH_PORT":"61921","HOME":"/Users/mxj","SZA_PATH":"/Users/mxj/zoom/mtool/node_modules/7zip-bin/mac/7za","LANG":"en_US.UTF-8","LC_ALL":"en_US.UTF-8"},
    "stdio":[
        "ignore",
        "pipe",
        process.stdout
     ]
}


const child_process = require("child_process");

try {
    var ls = child_process.spawn(command, args, options)


    var stdoutData = '';
    var stderrData = '';
    ls.stdout && ls.stdout.on('data', (data) => {
        stdoutData += data
        console.log('stdout:  灌入数据');
    });

    ls.stderr && ls.stderr.on('data', (data) => {
        stderrData += data
        console.log('stderr:  灌入数据');
    });

    ls.on('close', (code) => {
        console.log(`子进程退出，退出码 ${code}`);

        console.log('stdoutData :   '+ stdoutData)
        console.log('stderrData :   '+ stderrData)
    });

    // let out = "";
    // var errorOut = ""
    // childProcess.on("error", ()=>{
    //     debugger
    // });
    // childProcess.stdout.on("data", data => {
    //     out += data;
    // });
    // if(childProcess.stderr){
    //     childProcess.stderr.on("data", data => {
    //         errorOut += data;
    //     });
    // }








} catch (e) {
    debugger
    console.log(e)
}
