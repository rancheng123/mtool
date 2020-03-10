function SignalingClient() {
    this.onMessage = null;
    this.onServerDisconnected = null;

    var wsServer = null;
    var self = this;

    this.sendMessage = function (message, targetId, successCallback, failureCallback) {
        var data = {
            data: message,
            to: targetId
        };
        wsServer.emit('agle-message', data, function (err) {
            if (err && failureCallback)
                failureCallback(err);
            else if (successCallback)
                successCallback();
        });
    };

    this.connect = function (loginInfo, successCallback, failureCallback) {
        var serverAddress = loginInfo.host;
        var token = loginInfo.token;
        var paramters = [];
        var queryString = null;

        if (token)
            paramters.push('token=' + encodeURIComponent(token));
        if (paramters)
            queryString = paramters.join('&');

        var opts = {
            query: queryString,
            'reconnection': true,
            'reconnectionAttempts': 10,
            'force new connection': true,
            transports: ['websocket'],
            upgrade: false
        };

        wsServer = io(serverAddress, opts);

        wsServer.on('connect', function () {
            Logging.Logger.info((new Date()).toLocaleTimeString() + " : " + 'Connected to signal server.');
        });

        wsServer.on('server-authenticated', function (data) {
            Logging.Logger.debug((new Date()).toLocaleTimeString() + " : " + 'Authentication passed. User ID: ' + data.uid);
            if (successCallback) {
                successCallback(data.uid);
                successCallback = null;
                failureCallback = null;
            }
        });

        wsServer.on('disconnect', function () {
            Logging.Logger.info((new Date()).toLocaleTimeString() + " : " + 'Disconnected from signal server.');
            if (self.onServerDisconnected)
                self.onServerDisconnected();
        });

        wsServer.on('connect_failed', function (errorCode) {
            Logging.Logger.error((new Date()).toLocaleTimeString() + " : " + 'Connect to signal server failed, error:' + errorCode + '.');
            if (failureCallback) {
                failureCallback(parseInt(errorCode));
                successCallback = null;
                failureCallback = null;
            }
        });

        wsServer.on('error', function (err) {
            Logging.Logger.error((new Date()).toLocaleTimeString() + " : " + 'Socket.IO error:' + err);
            if (err == '2103' && failureCallback) {
                failureCallback(err);
                successCallback = null;
                failureCallback = null;
            }
        });

        wsServer.on('agle-message', function (data) {
            if (self.onMessage)
                self.onMessage(data.data, data.from);
        });
    };

    this.disconnect = function () {
        if (wsServer)
            wsServer.close();
    };
}
