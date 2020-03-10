const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote


module.exports = {
    on(event) {
        return new Promise((resolve, reject) => {
            ipc.on(event, (e, data) => {
                resolve(e, data)
            })
        })
    },
    send(event, data) {
        if (event) {
            remote.getCurrentWebContents().send(event)
        }
    }
}
