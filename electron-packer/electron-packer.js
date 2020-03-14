var packager = require('electron-packager');

const { serialHooks } = require('electron-packager/hooks')



var config = require('./config')





packager({
    "platform":config.platform,
    "arch":config.arch,
    "out":config.out,
    "icon":config.icon,
    "deref-symlinks":true,
    "derefSymlinks":true,
    "download":{
        "rejectUnauthorized":true,
        "reject-unauthorized":true
    },
    "junk":true,
    asar:true,
    //"prune":true,
    "dir":config.appDir,
    "protocols":[],
    overwrite: true,
    name: config.appName,
    afterCopy: [serialHooks([
        // (buildPath, electronVersion, platform, arch) => {
        //
        //     return new Promise((resolve, reject) => {
        //         setTimeout(() => {
        //             console.log('first function')
        //             resolve()
        //         }, 1000)
        //     })
        // },
        (buildPath, electronVersion, platform, arch) => {
            debugger;
            console.log('copy function')
        }
    ])],
    afterExtract: [serialHooks([
        (buildPath, electronVersion, platform, arch) => {
            debugger;
            console.log('afterExtract')
        }
    ])],
    afterPrune:[serialHooks([
        (buildPath, electronVersion, platform, arch) => {
            debugger;
            console.log('afterPrune')
        }
    ])],


    ignore: (path)=>{

        if(path == ""){

        }else{
            //要的
            if(
                // path.match('/build')   ||
                // path.match('/config')  ||
                // path.match('/dist')  ||
                path.match('/static')  ||
                path.match('/node_modules')  ||
                //path.match('/electron-builder-dev.json')  ||
                path.match('/package.json')




            ){
                console.log(path)
            }
            //不要的
            else{
                return true;
            }
        }
    }
}).then((res)=>{
    console.log('打包完毕')



    const installer = require('electron-installer-windows')
    console.log('Creating package (this may take a while)')


    var startTime = Date.now()

//electron-installer-windows --src /Users/mxj/zoom/mtool/dev-release/win-unpacked  --dest /Users/mxj/zoom/mtool/dev-release/installers/x64/  --config /Users/mxj/zoom/electron-installer-windows/example/config.json
    var installerDest = config.out + 'installers/'+ config.arch +'/'


    installer({
        src: config.out + config.appName +'-'+ config.platform +'-'+ config.arch +'/',
        dest: installerDest,
        name: config.appName,
        arch: config.arch,

        "icon": config.icon,
        "tags": [
            "Utility"
        ],


    }).then((res)=>{
        debugger


        return;
        console.log(`Successfully created package at ${res.exe}`)
        var endTime = Date.now()
        console.log('花费时间： ' + (endTime - startTime))

        var exePath = res.packagePaths.filter((ele)=>{
            if(ele.match('.exe')){
                return true
            }
        })[0]



        var AWS = require('aws-sdk');
        var fs = require('fs')
        var stream = fs.createReadStream( exePath )
        var s3 = new AWS.S3({
            apiVersion: '2006-03-01',
            accessKeyId: "AKIAO7GIAC3NCSDPPKLA",
            secretAccessKey: "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",
            region: "cn-north-1",
            endpoint: "https://s3.cn-north-1.amazonaws.com.cn",
        });

        var exeName = exePath.match(/\/[\w\-\d\.]{0,100}.exe/)[0].replace('/','')
        var uploader = s3.upload({
            Bucket: 'mtool',
            Key: 'dev-releases/win/'+ exeName,
            Body: stream,

            //不设置 不允许下载
            ACL: 'public-read'
        }, function(err, data) {


            if(!err){
                console.log('上传S3 成功  ', data);


            }else{
                console.log('上传S3 失败  ', err);
            }
        });
        uploader.progress = (info)=>{
            console.log('已加载： ' + info.loaded,   '总共： ' + info.total)
        }

    }).catch((err)=>{
        console.error(err, err.stack)
    })

    return;




}).catch((err)=>{
    console.log('打包失败 ' + err)


})
