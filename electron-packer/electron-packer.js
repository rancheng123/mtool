
// 文档 ！！！！！！！！！！！！
//https://electron.github.io/electron-packager/master/modules/electronpackager.html


/*

问题： 打包node_modules 太慢
解决： 用 npm  不用cnpm

原因：说到npm与cnpm的区别，可能大家都知道，但大家容易忽视的一点，是cnpm装的各种node_module，这种方式下所有的包都是扁平化的安装。一下子node_modules展开后有非常多的文件。导致了在打包的过程中非常慢。但是如果改用npm来安装node_modules的话，所有的包都是树状结构的，层级变深。
*/


var isMac = true;
var arch = 'x64'


var child_process = require('child_process');
var fs = require('fs');

var utils = require('./utils');
var config = require('./config')






if( fs.existsSync(config.mToolPath + '/node_modules') ){

    var packager = require('electron-packager');
    var sign = require('electron-osx-sign');
    var createDMG = require('electron-installer-dmg');
    var electronInstaller = require('electron-winstaller');
    var AWS = require('aws-sdk');
}









class ElectronBuilder {
    constructor(){

    }

    sign(opts,callback){






        console.log('签名开始')
                         //C87E21D1492CFCCCB0780A2368CAC30E1AA0B84B
        var identityHash = 'C87E21D1492CFCCCB0780A2368CAC30E1AA0B84B'

        child_process.exec(
            'codesign ' +

            // identity
            '--sign '+ identityHash +' ' +
            '--force ' +
            '--options runtime ' +

            //解决报错 code object is not signed at all
            '--deep ' +

            //解决报错  /Users/kri/EC_Collection_Premiere_AW20_v1_0_0.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework Reason: no suitable image found. Did find: /Users/kri/EC_Collection_Premiere_AW20_v1_0_0.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib: code signature in (/Users/kri/EC_Collection_Premiere_AW20_v1_0_0.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib) not valid for use in process using Library Validation: mapped file has no cdhash, completely unsigned? Code has to be at least ad-hoc signed.
            '--entitlements '+ config.mToolPath +'/electron-packer/entitlements.mac.plist ' +
            opts.appPath,
            {
                encoding: 'utf-8'
            },
            (error, stdout, stderr)=>{

                debugger
                if (error) {
                    // Handle the error
                    console.log('签名失败  ' + error)
                }else{
                    console.log(stderr)
                    callback && callback()
                }

            }
        )
    }

    pack(callback){

        //删除 打包的目录
        utils.execSync('rm -rf ' + config.out)

        //  electron-packager ./ zoomsdkapp --platform=darwin --arch=x64 --out ./OutApp --electron-version=5.0.13 --overwrite --icon=./app.icns
        packager({
            // ...
            afterCopy: ()=>{

            },
            asar: false,
            dir: config.dir,
            electronVersion: '5.0.6',
            out: config.out,
            name: config.appName,
            platform: isMac?'darwin':'win32',  //"linux" | "win32" | "darwin" | "mas"
            arch: config.arch,  //"ia32" | "x64" | "armv7l" | "arm64" | "mips64el"
            overwrite: true,
            icon: config.icon,
            //Walks the node_modules dependency tree to remove all of the packages specified in the devDependencies section of package.json from the outputted Electron app.
            prune: true,
            ignore: (path)=>{

                if(path == ""){

                }else{
                    //要的
                    if(
                        path.match('/build')   ||
                        path.match('/config')  ||
                        path.match('/dist')  ||
                        path.match('/static')  ||
                        path.match('/node_modules')  ||
                        path.match('/electron-builder-dev.json')  ||
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
            // ...
        }).then((res)=>{
            console.log('打包完毕')
            var appPath = config.out +'/'+ config.appName +'-'+ config.platform +'-'+ config.arch +'/'+ config.appName +'.app';
            callback && callback(appPath)
        }).catch((err)=>{
            console.log('打包失败 ' + err)


            // Error: Could not find "wine" on your system


            /*
            wine
                参考链接： https://newsn.net/say/mac-wine.html
                作用 :
                    使mac系统 能够运行exe

                安装：
                    //https://wiki.winehq.org/MacOS
                    1. 安装依赖

                        brew cask install xquartz
                        brew cask install wine-stable



            */
        })
    }

    copyZoom(opts,callback){



        utils.execSync('rm -rf '+ opts.appPath +'/Contents/Resources/app/zoom-sdk-electron-master')
        utils.execSync(
            'mkdir '+ opts.appPath +'/Contents/Resources/app/zoom-sdk-electron-master &&' +
            'mkdir '+ opts.appPath +'/Contents/Resources/app/zoom-sdk-electron-master/sdk'
        )


        var cmd =
            'yes|cp -R  -H '+ config.zoomPath +'/demo                 '+ opts.appPath +'/Contents/Resources/app/zoom-sdk-electron-master/ &&' +
            'yes|cp -R  -H '+ config.zoomPath +'/lib                  '+ opts.appPath +'/Contents/Resources/app/zoom-sdk-electron-master/ &&';

            // 'rm -rf '+ config.zoomPath +'/sdk/win32 &&' +
            // 'rm -rf '+ config.zoomPath +'/sdk/win64 &&' +
            //

        if(isMac){
            cmd = cmd +

            'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac              '+ opts.appPath +'/Contents/Resources/app/zoom-sdk-electron-master/sdk/ &&'+


            'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac/Plugins      '+ opts.appPath +'/Contents/ &&' +
            'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac/Resources    '+ opts.appPath +'/Contents/&&' +
            'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac/ZoomSDK/*    '+ opts.appPath +'/Contents/Frameworks'
        }else{
            cmd = cmd +

            'yes|cp -R  -H '+ config.zoomPath +'/sdk/win32            '+ opts.appPath +'/Contents/Resources/app/zoom-sdk-electron-master/sdk/'
        }


        utils.execSync( cmd )


        // utils.execSync(
        //     'yes|cp -R  -H '+ config.zoomPath +'/lib                  '+ appPath +'/Contents/Resources/ &&' +
        //
        //     'rm -rf '+ config.zoomPath +'/sdk/win32 &&' +
        //     'rm -rf '+ config.zoomPath +'/sdk/win64 &&' +
        //
        //     'yes|cp -R  -H '+ config.zoomPath +'/sdk                  '+ appPath +'/Contents/Resources/ &&' +
        //     'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac/Plugins      '+ appPath +'/Contents/ &&' +
        //     'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac/Resources    '+ appPath +'/Contents/&&' +
        //     'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac/ZoomSDK/*    '+ appPath +'/Contents/Frameworks'
        // )

        console.log('  拷贝zoom  成功  ')

        callback && callback()
    }


    createInstaller(opts,callback){

        console.log('创建 installer 开始')

        //测试  start
        //isMac = false
        //测试  end



        var out     = opts.appPath.replace(/[\w\d]{0,20}\.app/,'')
        var installerName = opts.appPath.match(/\/[\w\d]{1,20}\.app/)[0].replace('.app','').replace('/','')

        if(isMac){
            var fullInstallerPath = out + installerName + '.dmg'
        }else{
            var fullInstallerPath = out + installerName + '.exe'
        }



        utils.execSync('rm -rf ' + fullInstallerPath)


        if(isMac){
            createDMG({
                appPath: opts.appPath,
                name: installerName,
                title: 'myDreamPlus',
                background: '',
                icon: '',
                overwrite: true,
                //debug: true,
                out: out,
                contents: function (opts) {
                    return [

                        { x: 448, y: 344, type: 'link',
                            //链接放在 目录下
                            path: '/Applications'
                        },
                        { x: 192, y: 344, type: 'file', path: opts.appPath}
                    ];
                }
            }).then((optsInfo)=>{

                console.log('创建 installer 完成')

                callback && callback(fullInstallerPath);

            })
        }else{
            electronInstaller.createWindowsInstaller({
                appDirectory: opts.appPath,
                outputDirectory: out,
                authors: 'My App Inc.',
                exe: installerName + '.exe'
            }).then((res)=>{
                debugger
            }).catch((err)=>{
                debugger
                console.log(err)
            })
        }




    }


    publish(opts,callback){
        /*

         亚马逊账号
            Aws 只读账号
            url：http://console.amazonaws.cn
            账户：889511930858
            用户名：mxjreadonly
            密码：5WouEchvta



                //mTool 存放的地方
                https://console.amazonaws.cn/s3/buckets/mtool/?region=cn-northwest-1&tab=overview



                mtool
                项目地址：git@gitlab.mxj360.com:mdp-smart-device/mxj-desktop-app.git
                分支：  embedZoom
                注意事项： 不要运行npm run  stable-publish-2s3, 这个是发布线上命令

                微信公众号
                项目地址：git@gitlab.mxj360.com:mydreamplus-dev/member-center-wechat.git






        */


        var stream = fs.createReadStream(opts.localFile)
        var s3 = new AWS.S3({
            apiVersion: '2006-03-01',
            accessKeyId: "AKIAO7GIAC3NCSDPPKLA",
            secretAccessKey: "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",
            region: "cn-north-1",
            endpoint: "https://s3.cn-north-1.amazonaws.com.cn",
        });


        var uploader = s3.upload({
            Bucket: 'mtool',
            Key: opts.Key,
            Body: stream,

            //不设置 不允许下载
            ACL: 'public-read'
        }, function(err, data) {


            if(!err){
                console.log('上传S3 成功  ', data);

                callback && callback()
            }else{
                console.log('上传S3 失败  ', err);
            }
        });
        uploader.progress = (info)=>{
            console.log('已加载： ' + info.loaded,   '总共： ' + info.total)
        }
    }

    preContext(opts,callback){

        console.log('准备环境    开始')

        console.log('依赖模块下载    开始')
        utils.execSync(
            'cd ' + config.mToolPath + ' && ' +
            'rm -rf node_modules && ' +
            'npm install '
        )

        console.log('依赖模块下载    成功')



        if(opts.isBuildNative){
            this.buildNative()
        }


        console.log('编译vue  开始')
        utils.execSync(
            'cd ' + config.mToolPath + ' && ' +
            'npm run build '
        )

        console.log('编译vue  成功')



        console.log('准备环境    完成')

        callback && callback()

    }

    buildNative(){

        console.log('编译原生模块   开始')
        var version = utils.execSync(config.mToolPath + '/node_modules/.bin/electron --version')
        version.replace('v','')
        utils.execSync(
            'cd ' + config.zoomPath + '&&  ' +
            'rm -rf ./build && ' +

            //5.0.13 会报错
            'node-gyp rebuild --target='+ '5.0.2' + ' --dist-url=https://npm.taobao.org/mirrors/atom-shell'
        )
        console.log('编译原生模块   成功')




        console.log('复制原生模块   开始')
        utils.execSync(
            'cd ' + config.zoomPath + '/sdk/mac/  &&  ' +
            'rm -rf  zoomsdk.node                 &&' +
            'rm -rf  zoomsdk.node.dSYM            &&' +
            'rm -rf  zoomsdk_render.node          &&' +
            'rm -rf  zoomsdk_render.node.dSYM     &&' +


            'cp -Rf '+ config.zoomPath +'/build/Release/zoomsdk.node                     '+ config.zoomPath +'/sdk/mac &&' +
            'cp -Rf '+ config.zoomPath +'/build/Release/zoomsdk.node.dSYM                '+ config.zoomPath +'/sdk/mac &&' +
            'cp -Rf '+ config.zoomPath +'/build/Release/zoomsdk_render.node              '+ config.zoomPath +'/sdk/mac &&' +
            'cp -Rf '+ config.zoomPath +'/build/Release/zoomsdk_render.node.dSYM         '+ config.zoomPath +'/sdk/mac '
        )
        console.log('复制原生模块   成功')

    }
}

var electronBuilderCase = new ElectronBuilder();

//测试 start
debugger
var isMac = false
config.arch = 'x64'
electronBuilderCase.pack((appPath)=>{
    //var appPath = '/Users/deo/WebstormProjects/workPlace/workDeliver/mxj-desktop-app-dir/mxj-desktop-appMdify/dev-release/test-darwin-x64/test.app'
    electronBuilderCase.createInstaller({
        appPath: appPath
    },(dmgPath)=>{


    })
})


return;

// var dmgPath = '/Users/deo/WebstormProjects/workPlace/workDeliver/mxj-desktop-app-dir/mxj-desktop-appMdify/dev-release/mTool-darwin-x64/mTool.dmg'
// electronBuilderCase.publish({
//     localFile: dmgPath,
//     Key: 'dev-releases/mac/' + dmgPath.match(/[\w\d]{0,20}\.dmg/)[0]
// })
// return;
//测试 end




electronBuilderCase.preContext({
    isBuildNative: false
},()=>{



    electronBuilderCase.pack((appPath)=>{
        console.log('打包成功')



        electronBuilderCase.copyZoom({
            appPath: appPath
        },()=>{
            console.log('拷贝zoom  成功')




            electronBuilderCase.createInstaller({
                appPath: appPath
            },(dmgPath)=>{





                debugger

                electronBuilderCase.publish({
                    localFile: dmgPath,
                    Key: 'dev-releases/mac/' + dmgPath.match(/[\w\d]{0,20}\.dmg/)[0]
                })

            })



        })


        //签名之后 zoom 无法使用
        // electronBuilderCase.sign({
        //     appPath: appPath
        // },()=>{
        //     console.log('签名成功')
        //
        //
        //
        //
        //
        // });

    });



})







//测试 start
// var appPath = '/Users/deo/WebstormProjects/workPlace/workDeliver/mxj-desktop-app-dir/mxj-desktop-appMdify/OutApp111/test-darwin-x64/test.app'
// electronBuilderCase.sign({
//     appPath: appPath
// },()=>{
//     console.log('签名成功')
// });
//
// return;
//测试 end



//测试 start
// var appPath = '/Users/deo/WebstormProjects/workPlace/workDeliver/mxj-desktop-app-dir/mxj-desktop-appMdify/OutApp111/test-darwin-x64/test.app'
//
//
//
// electronBuilderCase.copyZoom({
//     appPath: appPath
// },()=>{
//     console.log('拷贝zoom  成功')
// })
// return;
//测试 end



// electronBuilderCase.buildNativeToNode();
// return;






