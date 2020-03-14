const builder = require("electron-builder")
const Platform = builder.Platform

//     && ./node_modules/.bin/electron-builder
//     --config electron-builder-dev.json
//     --mac
//     --win
//     --publish never
//     -c.mac.identity=null",
//

// Promise is returned
builder.build({
    projectDir: '/Users/mxj/zoom/mtool',
    targets: Platform.MAC.createTarget(),
    //publish: {},

    //win:"",
    //linux: "",
    //projectDir:"../",
    //prepackaged:{},

    config: {
        "productName": "mTool",
        "appId": "com.mxj360.mTool",
        "electronVersion": "5.0.6",
        "directories": {
            "buildResources": "../build",
            "output": "../dev-release",
            "app": "../"
        },

        "files": [
            "./build/",
            "./config/",
            "./dist/",
            "./static/",
            "./node_modules/",
            "electron-builder-dev.json",
            "package.json"
        ],
        "extraResources": [
            "./extraResources/${os}/${arch}/**/*",
            "./extraResources/${os}/common/**/*"
        ],
        "asar": false,
        "artifactName": "dev-${productName}-${version}-${arch}.${ext}",
        mac:{
            gatekeeperAssess: false
        },
        "dmg": {
            "window": {
                "width": 550,
                "height": 320
            },
            "contents": [
                {
                    "x": 130,
                    "y": 180
                },
                {
                    "x": 410,
                    "y": 180,
                    "type": "link",
                    "path": "/Applications"
                }
            ]
        },
        "win": {
            "target": [
                {
                    "target": "nsis",
                    "arch": [
                        "x64",
                        "ia32"
                    ]
                }
            ]
        },
        "squirrelWindows": {
            "iconUrl": "https://s3.cn-north-1.amazonaws.com.cn/mtool/icon.ico",
            "msi": false
        },
        "nsis": {
            "perMachine": true,
            "artifactName": "dev-${productName}-setup-${version}.${ext}",
            "installerLanguages": "zh_CN"
        },
        "forceCodeSigning": false,
        "publish": {
            "provider": "s3",
            "bucket": "mtool",
            "region": "cn-north-1",
            "endpoint": "https://s3.cn-north-1.amazonaws.com.cn",
            "path": "dev-releases/${os}"
        }
        // 指定平台的环境变量
        //platform: process.env.BUILD_TARGET
        //"artifactBuildCompleted": ""
    }

})
    .then((res) => {
        // handle result
        console.log(res)
    })
    .catch((error) => {
        // handle error
        console.log(error)
    })
