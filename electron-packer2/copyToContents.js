var utils = require('./utils');
var config = require('./config');

console.log('  拷贝zoomsdk  到 electron  开始  ')
utils.execSync(
    'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac/Plugins      '+ config.electronPath +'/Contents/ &&' +
    'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac/Resources    '+ config.electronPath +'/Contents/&&' +
    'yes|cp -R  -H '+ config.zoomPath +'/sdk/mac/ZoomSDK/*    '+ config.electronPath +'/Contents/Frameworks'
)
console.log('  拷贝zoomsdk  到 electron  成功  ')


