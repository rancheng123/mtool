const packager = require('electron-packager')

packager({
    dir: './',
    appname: 'zoomsdkapp',
    out: './OutApp'
}).then((res)=>{
    debugger
})

// "electron": "^5.0.13"