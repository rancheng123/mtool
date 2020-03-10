const electron = require('electron')
const remote = electron.remote
const logger = remote.require('./app/logger')
export class SignalingClient {
    constructor() {
        this.signal = null
        this.channel = null
        this.session = null
        this.callObj = {}
    }

    login(appid, token, account, succCB) {
        this.signal = global.Signal(appid)
        if (!this.signal)
            return
        this.session = this.signal.login(account, token)
        this.session.onLoginSuccess = function (uid) {
            logger.info('signClient login success, uid = ' + uid)
            if (succCB)
                succCB(uid)
        }
        this.session.onLoginFailed = function (errCode) {
            logger.info('signClient login failed, error = ' + errCode)
        }
        this.session.onLogout = function () {
            logger.info(account + ' signClient logout')
        }
    }

    loginAsync(appid, token, account) {
        return new Promise(function(resolve, reject) {
            this.signal = global.Signal(appid)
            if (!this.signal)
                return reject({state: 1})
            
            this.session = this.signal.login(account, token)
            this.session.onLoginSuccess = function (uid) {
                logger.info('signClient login success, uid = ' + uid)
                resolve({state: 0, uid})
            }
            this.session.onLoginFailed = function (errCode) {
                logger.info('signClient login failed, error = ' + errCode)
                reject({state: errCode})
            }
            this.session.onLogout = function () {
                logger.info(account + ' signClient logout')
                reject({state: 1})
            }
        }.bind(this))
    }

    logout() {
        this.session.logout()
    }

    join(channelName) {
        if (!this.session)
            return

        this.channel = this.session.channelJoin(channelName)
        this.channel.onChannelJoined = function () {
            logger.info('signClient join ' + channelName + ' success')
        }
        this.channel.onChannelJoinFailed = function (errCode) {
            logger.info('signClient join ' + channelName + ' failed, error = ' + errCode)
        }
        this.channel.onChannelUserJoined = function (acount, uid) {
            logger.info('signClient ' + acount + '-' + uid + ' join ' + channelName)
        }
        this.channel.onChannelUserLeaved = function (acount, uid) {
            logger.info('signClient ' +acount + '-' + uid + ' leave ' + channelName)
        }
    }

    leave() {
        if (!this.channel)
            return
        this.channel.onChannelLeaved = function (code) {
            logger.info('leave channel, code = ' + code)
            this.channel = null
        }
        this.channel.channelLeave()
    }
    endcall(peer) {
        this.callObj[peer].channelInviteEnd(peer)
    }
    call(peer, streamId, onInviteReceivedByPeer, onInviteFailed, onInviteEndByPeer) {
        if (!this.session)
            return
        var call = this.session.channelInviteUser2(this.channel.name, peer, JSON.stringify({'destMediaUid': streamId}))
        this.callObj[peer] = call
        call.onInviteReceivedByPeer = onInviteReceivedByPeer
        call.onInviteFailed = onInviteFailed
        call.onInviteEndByPeer = onInviteEndByPeer
    }
}
