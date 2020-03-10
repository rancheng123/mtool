var child_process = require('child_process');

function execSync(cmd){
    var res = child_process.execSync(cmd,{
        encoding: 'utf-8'
    });
    console.log(res)
    return res
}


module.exports = {
    execSync
}
