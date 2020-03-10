const electron = require('electron')
const crypto = require('crypto')

const ipc = electron.ipcRenderer
const remote = electron.remote
const config = remote.require('./app/configuration')
const logger = remote.require('./app/logger')
const connectConf = remote.require('./app/connect.conf')
const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})

export default {
    getServiceUrl() {
        return config.getCnbServiceUrl()
    },

    send(api, method, data) {
        let meetingServer = config.getCnbServiceUrl()
        let uri = `${meetingServer}/${api}`

        let authToken = config.readSettings('authToken')
        if (data) {
            logger.info(`so api ${uri} send ` + JSON.stringify(data))
        }

        return rp({
            uri: uri,
            method: method || 'GET',
            json: true,
            headers: {
                'auth-token': authToken
            },
            timeout: 20000,
            body: data || {},
            transform: (body, response, resolveWithFullResponse) => {
                logger.info(`so api ${uri}  response ` + JSON.stringify(response.body))
                return response.body
            }
        })
    },

    users(str = '') {
        let api = `rest/user/v2/users/org-user/search`
        const opt = {
            data: {
                'keyword': str
            }
        }
        return this.send(api, 'POST', opt).then(res => {
            const { data } = res
            console.log(res)
            return {
                status: res.code > -1,
                data
            }
        })
    }
}
