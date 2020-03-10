'use strict';
!function (global) {
    function parser(params) {
        this.type = params.type;
        this.attributes = params.attributes;
    }

    // message with signal server
    function onMessage() {
        var _this = this;
        var signal = new SignalingClient;
        this.onConnected = null;
        this.onDisconnected = null;
        this.onCallStopped = null;
        this.onCallAccepted = null;
        this.onCallSignal = null;
        this.onAuthenticated = null;
        signal.onMessage = function (payload, attr) {
            var message = JSON.parse(payload);
            switch (message.type) {
                case "chat-accepted":
                    if (_this.onCallAccepted)
                        _this.onCallAccepted(attr, message.ua);
                    break;
                case "chat-closed":
                    if (_this.onCallStopped)
                        _this.onCallStopped(attr);
                    break;
                case "chat-signal":
                    if (_this.onCallSignal)
                        _this.onCallSignal(message.data, attr);
                    break;
                default:
                    Log.Logger.error("Received unknown message");
            }
        };
        signal.onServerDisconnected = function () {
            if (_this.onDisconnected)
                _this.onDisconnected();
        };
        this.sendCallInvitation = function (destId, msg, succCB, failCB) {
            var data = { type: "chat-closed" };
            signal.sendMessage(JSON.stringify(data), destId);
            var data = { type: "chat-invitation", ua: msg };
            signal.sendMessage(JSON.stringify(data), destId, succCB, failCB);
        };
        this.sendCallStopped = function (destId, succCB, failCB) {
            var data = { type: "chat-closed" };
            signal.sendMessage(JSON.stringify(data), destId, succCB, failCB);
        };
        this.sendStreamType = function (destId, msg, succCB, failCB) {
            var data = { type: "stream-type", data: msg };
            signal.sendMessage(JSON.stringify(data), destId, succCB, failCB);
        };
        this.sendSignalMessage = function (destId, msg, succCB, failCB) {
            var data = { type: "chat-signal", data: msg };
            signal.sendMessage(JSON.stringify(data), destId, succCB, failCB);
        };
        this.disconnect = function () {
            signal.disconnect();
        };
        this.connect = function (url, succCB, failCB) {
            signal.connect(url, function (view) {
                if (_this.onConnected)
                    _this.onConnected();
                if (_this.onAuthenticated)
                    _this.onAuthenticated(view);
                if (succCB)
                    succCB(view);
            }, failCB);
        };
    }
    // end signaling

    // webrtc wrapper, dispatch webrtc events
    var Wrapper = function () {
        var owner = {};
        Object.defineProperties(owner, {
            version: { get: function () { return "1.0"; } },
            name: { get: function () { return "AGLE WebRTC JS SDK"; } }
        });
        return owner;
    }();
    Wrapper.EventDispatcher = function (options) {
        var prototype = {};
        options.dispatcher = {};
        options.dispatcher.eventListeners = {};
        prototype.addEventListener = function (eventName, handler) {
            if (void 0 === options.dispatcher.eventListeners[eventName])
                options.dispatcher.eventListeners[eventName] = [];
            options.dispatcher.eventListeners[eventName].push(handler);
        };
        prototype.on = prototype.addEventListener;
        prototype.removeEventListener = function (type, element) {
            if (options.dispatcher.eventListeners[type]) {
                var classes = options.dispatcher.eventListeners[type].indexOf(element);
                if (classes !== -1)
                    options.dispatcher.eventListeners[type].splice(classes, 1);
            }
        };
        prototype.dispatchEvent = function (id) {
            if (options.dispatcher.eventListeners[id.type]) {
                options.dispatcher.eventListeners[id.type].map(function (listener) { listener(id); });
            }
        };
        return prototype;
    };
    Wrapper.ChatEvent = function (options) {
        parser.call(this, options);
        this.type = options.type;
        this.senderId = options.senderId;
        this.peerId = options.peerId;
    };
    Wrapper.ChatEvent.prototype = Object.create(parser.prototype);
    Wrapper.ChatEvent.prototype.constructor = Wrapper.ChatEvent;
    // end webrtc events

    // webrtc common functions
    Wrapper.Common = function () {
        function index(value, key, first) {
            return getIndex(value, 0, -1, key, first);
        }
        function getIndex(source, start, end, term, key) {
            var lastPos = end !== -1 ? end : source.length;
            for (var i = start; i < lastPos; ++i) {
                if (0 === source[i].indexOf(term) && (!key || source[i].toLowerCase().indexOf(key.toLowerCase()) !== -1))
                    return i;
            }
            return null;
        }
        function rtpMap(data, options) {
            var str = index(data, "a=rtpmap", options);
            return str ? parseText(data[str]) : null;
        }
        function parseText(stream) {
            var stringPrefixes = new RegExp("a=rtpmap:(\\d+) [a-zA-Z0-9-]+\\/\\d+", "i");
            var codeSegments = stream.match(stringPrefixes);
            return codeSegments && 2 === codeSegments.length ? codeSegments[1] : null;
        }
        function join(arr, x) {
            var tail = arr.split(" ");
            var context = tail.slice(0, 3);
            context.push(x);
            for (var i = 3; i < tail.length; i++) {
                if (tail[i] !== x)
                    context.push(tail[i]);
            }
            return context.join(" ");
        }

        var setBitrate = function (sdpStr, data, _as) {
            var s = sdpStr.split("\r\n");
            var cont = index(s, "m=", data);
            if (null === cont)
                return Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Failed to add bandwidth line to sdp, as no m-line found"), sdpStr;

            var c = getIndex(s, cont + 1, -1, "m=");
            if (null === c)
                c = s.length;
            var r = getIndex(s, cont + 1, c, "c=");
            if (null === r)
                return Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Failed to add bandwidth line to sdp, as no c-line found"), sdpStr;

            var b = getIndex(s, r + 1, c, "b=AS");
            if (b) {
                s.splice(b, 1);
            }
            var id = "b=AS:" + _as;
            return s.splice(r + 1, 0, id), sdpStr = s.join("\r\n");
        };
        var getStatus = function (stream) {
            var blockId = 0;
            var _highlightedBlocks = [];
            for (var i in stream) {
                var that = stream[i]
                var block
                var res = false
                if ('ssrc' === that.type) {
                    res = true
                    if (that.bytesSent) {
                        if (that.googFrameHeightSent) {
                            var adapt_reason = that.googCpuLimitedResolution ? 1 : that.googBandwidthLimitedResolution ? 2 : that.googViewLimitedResolution ? 3 : 99
                            block = {
                                type: 'ssrc_video_send',
                                id: that.id,
                                stats: {
                                    bytes_sent: that.bytesSent,
                                    codec_name: that.googCodecName,
                                    packets_sent: that.packetsSent,
                                    packets_lost: that.packetsLost,
                                    firs_rcvd: that.googFirsReceived,
                                    plis_rcvd: that.googPlisReceived,
                                    nacks_rcvd: that.googNacksReceived,
                                    send_frame_width: that.googFrameWidthSent,
                                    send_frame_height: that.googFrameHeightSent,
                                    adapt_reason: adapt_reason,
                                    adapt_changes: that.googAdaptationChanges,
                                    framerate_sent: that.googFrameRateSent,
                                    framerate_input: that.googFrameRateInput,
                                    rtt_ms: that.googRtt,
                                    avgEncode: that.googAvgEncodeMs,
                                    encode_percent: that.googEncodeUsagePercent
                                }
                            }
                        } else {
                            block = {
                                type: 'ssrc_audio_send',
                                id: that.id,
                                stats: {
                                    bytes_sent: that.bytesSent,
                                    codec_name: that.googCodecName,
                                    packets_sent: that.packetsSent,
                                    packets_lost: that.packetsLost,
                                    rtt_ms: that.googRtt
                                }
                            }
                        }
                    } else {
                        block = that.googFrameHeightReceived ? {
                            type: 'ssrc_video_recv',
                            id: that.id,
                            stats: {
                                bytes_rcvd: that.bytesReceived,
                                packets_rcvd: that.packetsReceived,
                                packets_lost: that.packetsLost,
                                firs_sent: that.googFirsSent,
                                nacks_sent: that.googNacksSent,
                                plis_sent: that.googPlisSent,
                                frame_width: that.googFrameWidthReceived,
                                frame_height: that.googFrameHeightReceived,
                                framerate_rcvd: that.googFrameRateReceived,
                                framerate_output: that.googFrameRateDecoded,
                                current_delay_ms: that.googCurrentDelayMs,
                                codec_name: that.googCodecName
                            }
                        } : {
                                type: 'ssrc_audio_recv',
                                id: that.id,
                                stats: {
                                    bytes_rcvd: that.bytesReceived,
                                    delay_estimated_ms: that.googCurrentDelayMs,
                                    packets_rcvd: that.packetsReceived,
                                    packets_lost: that.packetsLost,
                                    codec_name: that.googCodecName
                                }
                            }
                    }
                } else if ('VideoBwe' === that.type) {
                    res = true
                    block = {
                        type: 'VideoBWE',
                        id: '',
                        stats: {
                            available_send_bandwidth: that.googAvailableSendBandwidth,
                            available_receive_bandwidth: that.googAvailableReceiveBandwidth,
                            transmit_bitrate: that.googTransmitBitrate,
                            retransmit_bitrate: that.googRetransmitBitrate
                        }
                    }
                }
                if (res) {
                    _highlightedBlocks[blockId] = block
                    blockId++
                }
            }
            return _highlightedBlocks;
        };
        var setCodec = function (sdpStr, data, options) {
            if (!data || !options)
                return Log.Logger.warning((new Date()).toLocaleTimeString() + " : " + "Media type or codec name is not provided."), sdpStr;

            var buf = sdpStr.split("\r\n");
            var r = index(buf, "m=", data);
            if (null === r)
                return sdpStr;

            var ret = rtpMap(buf, options);
            return ret && (buf[r] = join(buf[r], ret)), sdpStr = buf.join("\r\n");
        };
        var getPlatform = function () {
            var MySDK = Object.create({});
            MySDK.sdk = {
                version: 1.0,
                type: "JavaScript"
            };
            var ua = navigator.userAgent;
            var rmozilla = /Firefox\/([0-9\.]+)/;
            var rwebkit = /Chrome\/([0-9\.]+)/;
            var rTrendit = /Edge\/([0-9\.]+)/;

            var result = rwebkit.exec(ua);
            if (result) {
                MySDK.runtime = {
                    name: "Chrome",
                    version: result[1]
                };
            } else if (result = rmozilla.exec(ua)) {
                MySDK.runtime = {
                    name: "FireFox",
                    version: result[1]
                };
            } else if (result = rTrendit.exec(ua)) {
                MySDK.runtime = {
                    name: "Edge",
                    version: result[1]
                };
            } else {
                MySDK.runtime = {
                    name: "Unknown",
                    version: "Unknown"
                };
            }

            var rWindows = /Windows NT ([0-9\.]+)/;
            var rOSX = /Intel Mac OS X ([0-9_\.]+)/;
            var rIOS = /iPhone OS ([0-9_\.]+)/;
            var rLinux = /X11; Linux/;
            var rAndroid = /Android( ([0-9\.]+))?/;
            return (result = rWindows.exec(ua)) ? MySDK.os = {
                name: "Windows NT",
                version: result[1]
            } : (result = rOSX.exec(ua)) ? MySDK.os = {
                name: "Mac OS X",
                version: result[1].replace(/_/g, ".")
            } : (result = rIOS.exec(ua)) ? MySDK.os = {
                name: "iPhone OS",
                version: result[1].replace(/_/g, ".")
            } : (result = rLinux.exec(ua)) ? MySDK.os = {
                name: "Linux",
                version: "Unknown"
            } : (result = rAndroid.exec(ua)) ? MySDK.os = {
                name: "Android",
                version: result[1] || "Unknown"
            } : MySDK.os = {
                name: "Unknown",
                version: "Unknown"
            }, MySDK;
        };

        return {
            parseStats: getStatus,
            setPreferredCodec: setCodec,
            setPreferredBitrate: setBitrate,
            sysInfo: getPlatform
        };
    }();
    // end common

    // Logger log to console
    var Log = {};
    Log.Logger = function () {
        var DEBUG = 0;
        var TRACE = 1;
        var INFO = 2;
        var WARNING = 3;
        var ERROR = 4;
        var NONE = 5;
        var noop = function () { };
        var self = {
            DEBUG: DEBUG,
            TRACE: TRACE,
            INFO: INFO,
            WARNING: WARNING,
            ERROR: ERROR,
            NONE: NONE
        };
        self.log = global.console.log.bind(global.console);
        var log = function (type) { return "function" == typeof global.console[type] ? global.console[type].bind(global.console) : global.console.log.bind(global.console); };
        var Logger = function (callback) {
            self.debug = (callback <= DEBUG) ? log("debug") : noop;
            self.trace = (callback <= TRACE) ? log("trace") : noop;
            self.info = (callback <= INFO) ? log("info") : noop;
            self.warning = (callback <= WARNING) ? log("warn") : noop;
            self.error = (callback <= ERROR) ? log("error") : noop;
        };
        Logger(DEBUG);
        self.setLogLevel = Logger;
        return self;
    }();
    // end log

    // webrtc stream info
    (function () {
        function baseStream(data) {
            this.mediaStream = data.mediaStream;
            data.attributes = data.attributes || {};
            this.url = function () {
                if ("string" == typeof data.url && "" !== data.url)
                    return data.url;
            };
            this.hasVideo = function () { return !!data.video; };
            this.hasAudio = function () { return !!data.audio; };
            this.attributes = function () { return data.attributes; };
            this.attr = function (name, val) { return arguments.length > 1 && (data.attributes[name] = val), data.attributes[name]; };
            this.id = function () { return data.id || null; };
            this.isScreen = function () { return !!data.video && "screen" === data.video.device; };
            this.toJson = function () {
                return {
                    id: this.id(),
                    audio: !!this.hasAudio() && data.audio,
                    video: !!this.hasVideo() && data.video,
                    attributes: data.attributes
                };
            };
            this.bitRate = { maxVideoBW: void 0, maxAudioBW: void 0 };
        }
        function localStream(streamInfo) {
            baseStream.call(this, streamInfo);
            this.hasAudio = function () { return this.mediaStream ? !!this.mediaStream.getAudioTracks().length : !!streamInfo.hasAudio; };
            this.hasVideo = function () { return this.mediaStream ? !!this.mediaStream.getVideoTracks().length : !!streamInfo.hasVideo; };
        }
        function isElectron() {
            return null != global.navigator.userAgent.match("Electron");
        }
        function isChrome() {
            return !(isElectron()) && (null !== global.navigator.appVersion.match(/Chrome\/([\w\W]*?)\./) && global.navigator.appVersion.match(/Chrome\/([\w\W]*?)\./)[1] >= 35);
        }
        function checkBrowser() {
            return isElectron() || isChrome();
        }
        function setSize(rwidth, rheight) {
            return { width: rwidth, height: rheight };
        }
        function createLocalStream(streamInfo, callback) {
            var streamIndex = arguments[3];
            if (void 0 === streamIndex) {
                streamIndex = 2;
            }
            var hints = {};
            if (null !== streamInfo && "object" == typeof streamInfo) {
                if (!streamInfo.audio && !streamInfo.video) {
                    return void ("function" == typeof callback && callback({ code: 1107, msg: "At least one of audio and video must be requested." }));
                }
                if (streamInfo.video) {
                    if ("object" != typeof streamInfo.video && (streamInfo.video && (streamInfo.video = Object.create({}))),
                        "string" != typeof streamInfo.video.device && (streamInfo.video.device = "camera"),
                        "screen" === streamInfo.video.device && (!checkBrowser() && "function" == typeof callback)) {
                        return void callback({ code: 1103, msg: "browser screen sharing not supported" });
                    }
                    if ("object" == typeof streamInfo.video.resolution && (void 0 !== streamInfo.video.resolution.width && void 0 !== streamInfo.video.resolution.height)) {
                        hints.video = JSON.parse(JSON.stringify(setSize(streamInfo.video.resolution.width, streamInfo.video.resolution.height)));
                    } else {
                        hints.video = JSON.parse(JSON.stringify(resolutions[streamInfo.video.resolution] || resolutions.unspeficed));
                    }
                    if ("string" == typeof streamInfo.video.deviceId) {
                        hints.video.deviceId = streamInfo.video.deviceId;
                    }

                    if (isChrome()) {
                        if (streamInfo.video.frameRate instanceof Array && streamInfo.video.frameRate.length >= 2) {
                            hints.video.frameRate = { min: streamInfo.video.frameRate[0], max: streamInfo.video.frameRate[1] };
                        } else if ("number" == typeof streamInfo.video.frameRate) {
                            hints.video.frameRate = streamInfo.video.frameRate;
                        } else {
                            Log.Logger.warning((new Date()).toLocaleTimeString() + " : " + "Invalid frame rate value, ignored.");
                        }
                    }
                }
                if ("object" == typeof streamInfo.audio) {
                    hints.audio = streamInfo.audio;
                } else if (streamInfo.audio) {
                    hints.audio = true;
                }
            } else if ("function" == typeof callback) {
                return void callback({ code: 1107, msg: "USER_INPUT_INVALID" });
            }

            var success = function (stream) {
                if (("object" != typeof streamInfo.video || "screen" !== streamInfo.video.device) && (streamInfo.video && 0 === stream.getVideoTracks().length)) {
                    for (var i = 0; i < stream.getTracks().length; i++) {
                        stream.getTracks()[i].stop();
                    }
                    var err = { code: 1104, msg: "Not all device requests are satisfied." };
                    return void callback(err);
                }
                streamInfo.mediaStream = stream;
                streamInfo.id = stream.id;
                var streamLocal = new Wrapper.LocalStream(streamInfo);
                if (streamInfo.video && "screen" === streamInfo.video.device) {
                    var track = stream.getVideoTracks();
                    if (track.length > 0) {
                        track[0].onended = function () {
                            streamLocal.close();
                            Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "screen stream closed by Chrome low level.");
                        };
                    }
                }
                streamLocal.bitRate.maxVideoBW = 4096;
                streamLocal.bitRate.maxAudioBW = 1024;
                if ("function" == typeof callback)
                    callback(null, streamLocal);
            };
            var error = function (stream) {
                var err = { code: 1100, msg: stream.name || stream };
                switch (err.msg) {
                    case "Starting video failed":
                    case "TrackStartError":
                        streamInfo.video = { device: streamInfo.video.device, extensionId: streamInfo.video.extensionId };
                        if (streamIndex > 0) {
                            return void setTimeout(function () { create(streamInfo, callback, streamIndex - 1); }, 1);
                        }
                        err.msg = "MEDIA_OPTION_INVALID";
                        err.code = 1104;
                        break;
                    case "DevicesNotFoundError":
                        err.msg = "DEVICES_NOT_FOUND";
                        err.code = 1102;
                        break;
                    case "NotSupportedError":
                        err.msg = "NOT_SUPPORTED";
                        err.code = 1105;
                        break;
                    case "PermissionDeniedError":
                        err.msg = "PERMISSION_DENIED";
                        err.code = 1101;
                        break;
                    case "PERMISSION_DENIED":
                        err.code = 1101;
                        break;
                    case "ConstraintNotSatisfiedError":
                        err.msg = "CONSTRAINT_NOT_SATISFIED";
                        err.code = 1106;
                        break;
                    default:
                        if (!err.msg)
                            err.msg = "UNDEFINED";
                        break;
                }
                if ("function" == typeof callback)
                    callback(err);
            };

            if (streamInfo.video && "screen" === streamInfo.video.device) {
                if (isElectron()) {
                    if (streamInfo.audio) {
                        hints = {
                            audio: { mandatory: { chromeMediaSource: 'desktop' } },
                            video: { mandatory: { chromeMediaSource: 'desktop' } }
                        };
                    } else {
                        hints = {
                            audio: false,
                            video: {
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: streamInfo.video.windowId,
                                    minWidth: 1280,
                                    maxWidth: 1920,
                                    minHeight: 720,
                                    maxHeight: 1080
                                }
                            }
                        };
                    }
                    navigator.getUserMedia.apply(navigator, [hints, success, error]);
                } else if (isChrome()) {
                    var ex = streamInfo.video.extensionId || "nkjcmioaadihbfdialblelclkllieokp";
                    var typeElements = ["screen", "window", "tab"];
                    if (streamInfo.audio)
                        typeElements.push("audio");
                    try {
                        chrome.runtime.sendMessage(ex, { getStream: typeElements }, function (snap) {
                            if (void 0 === snap) {
                                if ("function" === typeof callback)
                                    callback({ code: 1103, msg: "screen share plugin inaccessible" });
                            } else {
                                hints.audio = { mandatory: { chromeMediaSource: "desktop", chromeMediaSourceId: snap.streamId } };
                                hints.video.mandatory = hints.video.mandatory || {};
                                hints.video.mandatory.chromeMediaSource = "desktop";
                                hints.video.mandatory.chromeMediaSourceId = snap.streamId;
                                if (hints.video.width) {
                                    hints.video.mandatory.maxWidth = hints.video.width;
                                    hints.video.mandatory.minWidth = 1280;
                                    delete hints.video.width;
                                }
                                if (hints.video.height) {
                                    hints.video.mandatory.maxHeight = hints.video.height;
                                    hints.video.mandatory.minHeight = 720;
                                    delete hints.video.height;
                                }
                                if (hints.video.frameRate) {
                                    if ("object" == typeof hints.video.frameRate) {
                                        hints.video.mandatory.minFrameRate = hints.video.frameRate.min;
                                        hints.video.mandatory.maxFrameRate = hints.video.frameRate.max;
                                    } else if ("number" == typeof hints.video.frameRate) {
                                        hints.video.mandatory.minFrameRate = hints.video.mandatory.maxFrameRate = hints.video.frameRate;
                                    } else {
                                        Log.Logger.warning((new Date()).toLocaleTimeString() + " : " + "Invalid frame rate value for screen share.");
                                    }
                                    delete hints.video.frameRate;
                                }
                                userMedia.apply(navigator, [hints, success, error]);
                            }
                        });
                    } catch (e) {
                        if ("function" == typeof callback)
                            callback({ code: 1103, msg: "screen share plugin inaccessible", err: e });
                    }
                }
            } else {
                userMedia.apply(navigator, [hints, success, error]);
            }
        }

        baseStream.prototype.close = function () {
            if ("function" == typeof this.hide)
                this.hide();
            if (this.mediaStream) {
                this.mediaStream.getTracks().map(function (event) {
                    if ("function" == typeof event.stop)
                        event.stop();
                });
            }
            this.mediaStream = null;
            if ("function" == typeof this.unpublish)
                this.unpublish();
            if (this.channel && ("function" == typeof this.channel.close))
                this.channel.close();
        };
        localStream.prototype = Object.create(baseStream.prototype);
        localStream.prototype.constructor = localStream;
        var userMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        var resolutions = {
            unspeficed: {},
            hd720p: setSize(1280, 720),
            hd1080p: setSize(1920, 1080),
            hd1600p: setSize(2560, 1600)
        };
        localStream.create = function () { createLocalStream.apply(this, arguments); };
        Wrapper.Stream = baseStream;
        Wrapper.LocalStream = localStream;
    })();
    // end stream info

    // p2p error code
    Wrapper.Error = {
        P2P_CONN_CLIENT_NOT_INITIALIZED: {
            code: 2401,
            message: "Connection is not initialized."
        },
        P2P_CLIENT_ILLEGAL_ARGUMENT: {
            code: 2402,
            message: "Illegal argument."
        },
        P2P_CLIENT_INVALID_STATE: {
            code: 2403,
            message: "Invalid peer state."
        },
        getErrorByCode: function (attribute) {
            var bools = {
                2401: Wrapper.Error.P2P_CONN_CLIENT_NOT_INITIALIZED,
                2402: Wrapper.Error.P2P_CLIENT_ILLEGAL_ARGUMENT,
                2403: Wrapper.Error.P2P_CLIENT_INVALID_STATE
            };
            return bools[attribute];
        }
    };
    Wrapper = Wrapper || {};

    // webrtc client for peer to peer
    Wrapper.PeerClient = function (configuration) {
        var SIGNAL_CONNECT_STATE = {
            READY: 1,
            CONNECTING: 2,
            CONNECTED: 3
        };
        var PEER_CONNECT_STATE = {
            READY: 1,
            MATCHED: 2,
            OFFERED: 3,
            PENDING: 4,
            CONNECTING: 5,
            CONNECTED: 6,
            ERROR: 9
        };
        var INVITIE_STATE = {
            READY: 1,
            REQUESTED: 2,
            ACCEPTED: 3,
            NEGOTIATING: 4
        };
        var ITEM_TYPE = {
            MESSAGE: "message",
            FILE: "file"
        };
        var signalClient = null;
        var maxTimeout = 15000;
        var peersInfo = {};
        var myID = null;
        var streamList = {};
        var iceServers = null;
        if (configuration) { iceServers = { iceServers: configuration.iceServers }; }

        var eventManager = Wrapper.EventDispatcher({});
        var signalConnectStatus = SIGNAL_CONNECT_STATE.READY;
        var connectOptions = configuration;
        var platformInfo = Wrapper.Common.sysInfo();
        var optionalArgument = { optional: [{ DtlsSrtpKeyAgreement: "true" }] };
        var mediaConstraints = { offerToReceiveAudio: true, offerToReceiveVideo: true };

        var isArray = function (input) { return "[object Array]" === Object.prototype.toString.call(input); };
        var setStatus = function (peer, state) { peer.negotiationState = state; };
        var _index = function (list, value) {
            for (var i = 0; i < list.length; i++) {
                if (list[i] === value)
                    return i;
            }
            return -1;
        };
        var addCandidateSuccess = function () { Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Add ice candidate success."); };
        var addCandidateFailed = function (errMsg) { Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Add ice candidate failed. Error: " + errMsg); };
        var parseMessage = function (self, message) {
            Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Server->Client: " + JSON.stringify(message));
            if ("answer" === message.type) {
                saveAnswer(self, { message: message });
            } else if ("candidates" === message.type) {
                savePeerCandiate(self, { message: message });
            }
        };

        // Communicate with signal server, callbacks
        var setSignalConnected = function () { signalConnectStatus = SIGNAL_CONNECT_STATE.CONNECTED; };
        var setSignalDisconnect = function () { signalConnectStatus = SIGNAL_CONNECT_STATE.READY; };
        var callStopped = function (peerId) {
            Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Received chat stopped.");
            var peer = peersInfo[peerId];
            if (peer && peer.connection)
                closePeerConnection(peer, peerId);
            delete peersInfo[peerId];
        };
        var callAccepted = function (peerId, data) {
            Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Received chat accepted.");
            var peer = peersInfo[peerId];
            if (peer) {
                peer.state = PEER_CONNECT_STATE.MATCHED;
                initRemoteSupports(peer);
                createPeerConnection(peer);
                peer.state = PEER_CONNECT_STATE.CONNECTING;
                createMessageChannel(peer.id);
                eventManager.dispatchEvent(new Wrapper.ChatEvent({
                    type: "chat-accepted",
                    senderId: peerId
                }));
            }
        };
        var callSignal = function (message, peerId) {
            var peer = peersInfo[peerId];
            if (peer && peer.state === PEER_CONNECT_STATE.CONNECTING && !peer.connection)
                createPeerConnection(peer);
            parseMessage(peer, message);
        };
        var authenticated = function (peerId) { myID = peerId; };
        var createMessageChannel = function (peerId, msgType) {
            if (!msgType)
                msgType = ITEM_TYPE.MESSAGE;
            var peer = peersInfo[peerId];
            if (peer && !peer.dataChannels[msgType]) {
                Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Create data channel.");
                try {
                    var set = null;
                    var all = peer.connection.createDataChannel(msgType, set);
                    peer.dataChannels[ITEM_TYPE.MESSAGE] = all;
                } catch (ex) {
                    Log.Logger.error((new Date()).toLocaleTimeString() + " : " + "Failed to create SendDataChannel, exception: " + ex.message);
                }
            }
        };
        //

        // PeerConnection
        var initPeerConnection = function (conn) {
            conn.onicecandidate = void 0;
            conn.onaddstream = void 0;
            conn.onremovestream = void 0;
            conn.oniceconnectionstatechange = void 0;
            conn.onnegotiationneeded = void 0;
            conn.onsignalingstatechange = void 0;
        };
        var createPeerConnection = function (self) {
            if (!self || self.connection)
                return true;
            try {
                self.connection = new RTCPeerConnection(iceServers, optionalArgument);
                self.connection.onicecandidate = function (event) { onIceCandidate(self, event); };
                self.connection.onaddstream = function (event) { };
                self.connection.onremovestream = function (event) { };
                self.connection.oniceconnectionstatechange = function (event) { iceConnectionChanged(self); };
                self.connection.onnegotiationneeded = function () { needNegotiation(peersInfo[self.id]); };
                self.connection.onsignalingstatechange = function () { signalStateChanged(self); };
                self.connection.ondatachannel = function (event) {
                    if (!self.dataChannels[event.channel.label])
                        self.dataChannels[event.channel.label] = event.channel;
                };
            } catch (ex) {
                Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Failed to create PeerConnection, exception: " + ex.message);
                return false;
            }
            return true;
        };
        var closePeerConnection = function (peer, peerId) {
            if (peer.state === PEER_CONNECT_STATE.CONNECTED || peer.state === PEER_CONNECT_STATE.CONNECTING) {
                if (peer.sendDataChannel)
                    peer.sendDataChannel.close();
                if (peer.receiveDataChannel)
                    peer.receiveDataChannel.close();

                if (peer.connection && "closed" !== peer.connection.iceConnectionState)
                    peer.connection.close();
                if (peer.state !== PEER_CONNECT_STATE.READY) {
                    peer.state = PEER_CONNECT_STATE.READY;
                    eventManager.dispatchEvent(new Wrapper.ChatEvent({
                        type: "chat-stopped",
                        peerId: peer.id,
                        senderId: peerId
                    }));
                }
                initPeerConnection(peer.connection);
            }
        };
        //
        var createPeerInfo = function (peerId) {
            if (!peersInfo[peerId]) {
                peersInfo[peerId] = {
                    state: PEER_CONNECT_STATE.READY,
                    id: peerId,
                    pendingStreams: [],
                    pendingUnpublishStreams: [],
                    remoteIceCandidates: [],
                    dataChannels: {},
                    pendingMessages: [],
                    negotiationState: INVITIE_STATE.READY,
                    lastDisconnect: (new Date("2099/12/31")).getTime(),
                    publishedStreams: [],
                    isCaller: true,
                    remoteSideSupportsRemoveStream: false,
                    remoteSideSupportsPlanB: false,
                    remoteSideSupportsUnifiedPlan: false
                };
            }
            return peersInfo[peerId];
        };
        var initRemoteSupports = function (peer) {
            peer.remoteSideSupportsRemoveStream = true;
            peer.remoteSideSupportsPlanB = true;
            peer.remoteSideSupportsUnifiedPlan = false;
        };
        var onIceCandidate = function (peer, data) {
            if (data.candidate && signalClient) {
                signalClient.sendSignalMessage(peer.id, {
                    type: "candidates",
                    candidate: data.candidate.candidate,
                    sdpMid: data.candidate.sdpMid,
                    sdpMLineIndex: data.candidate.sdpMLineIndex
                });
            }
        };
        var savePeerCandiate = function (peer, data) {
            Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "On remote ice candidate from peer " + peer.id);
            if (peer && (peer.state === PEER_CONNECT_STATE.OFFERED || (peer.state === PEER_CONNECT_STATE.CONNECTING || peer.state === PEER_CONNECT_STATE.CONNECTED))) {
                var candidate = new RTCIceCandidate({
                    candidate: data.message.candidate,
                    sdpMid: data.message.sdpMid,
                    sdpMLineIndex: data.message.sdpMLineIndex
                });
                if (peer.connection) {
                    peer.connection.addIceCandidate(candidate, addCandidateSuccess, addCandidateFailed);
                } else {
                    Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Cache remote ice candidates.");
                    if (!peer.remoteIceCandidates)
                        peer.remoteIceCandidates = [];
                    peer.remoteIceCandidates.push(candidate);
                }
            }
        };
        var getCandidate = function (peer) {
            if (peer && peer.connection && peer.remoteIceCandidates && 0 !== peer.remoteIceCandidates.length) {
                for (var i = 0; i < peer.remoteIceCandidates.length; i++) {
                    if (peer.state === PEER_CONNECT_STATE.CONNECTED || peer.state === PEER_CONNECT_STATE.CONNECTING)
                        peer.connection.addIceCandidate(remoteIceCandidates[i], addCandidateSuccess, addCandidateFailed);
                    Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "remoteIce, length:" + remoteIceCandidates.length + ", current:" + i);
                }
                peer.remoteIceCandidates = [];
            }
        };

        // Caller
        var sendOffer = function (peer) {
            if (!peer.connection) {
                Log.Logger.error((new Date()).toLocaleTimeString() + " : " + "Peer connection have not been created.");
                return;
            }
            if ("stable" !== peer.connection.signalingState) {
                setStatus(peer, INVITIE_STATE.NEGOTIATING);
            } else {
                drainStream(peer);
                peer.isNegotiationNeeded = false;
                peer.connection.createOffer(function (response) {
                    if (connectOptions)
                        response.sdp = setCodecToSDP(response.sdp, peer);
                    peer.connection.setLocalDescription(response, function () {
                        Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Set local descripiton successfully.");
                        if (signalClient)
                            signalClient.sendSignalMessage(peer.id, response);
                    }, function (generatedLine) {
                        Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Set local description failed. Message: " + JSON.stringify(generatedLine));
                    });
                }, function (generatedLine) {
                    Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Create offer failed. Error info: " + JSON.stringify(generatedLine));
                }, mediaConstraints);
            }
        };
        var saveAnswer = function (self, config) {
            if (self && (self.state === PEER_CONNECT_STATE.CONNECTING || self.state === PEER_CONNECT_STATE.CONNECTED)) {
                Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "About to set remote description. Signaling state: " + self.connection.signalingState);
                var sdp = new RTCSessionDescription(config.message);
                if (connectOptions)
                    sdp.sdp = setBitrateToSDP(sdp.sdp);
                self.connection.setRemoteDescription(new RTCSessionDescription(sdp), function () {
                    Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Set remote descripiton successfully.");
                    getCandidate(self);
                    drainMessage(self);
                }, function (err) {
                    Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Set remote description failed. Message: " + err);
                });
            }
        };
        var sendStream = function (stream, peerId, succCB, failCB) {
            Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Publish to: " + peerId);
            if (!peerId) {
                if (failCB)
                    failCB(Wrapper.Error.P2P_CLIENT_ILLEGAL_ARGUMENT);
                return;
            }
            if (!peersInfo[peerId])
                createPeerInfo(peerId);

            var peer = peersInfo[peerId];
            switch (peer.state) {
                case PEER_CONNECT_STATE.OFFERED:
                case PEER_CONNECT_STATE.MATCHED:
                case PEER_CONNECT_STATE.CONNECTING:
                case PEER_CONNECT_STATE.CONNECTED:
                    break;
                default:
                    Log.Logger.warning((new Date()).toLocaleTimeString() + " : " + "Cannot publish stream in this state: " + peer.state);
                    if (failCB)
                        failCB(Wrapper.Error.P2P_CLIENT_INVALID_STATE);
                    return;
            }
            if (_index(peer.publishedStreams, stream) > -1) {
                return void (failCB && failCB((new Date()).toLocaleTimeString() + " : " + "The stream has been published."));
            }

            switch (peer.publishedStreams.push(stream), isArray(stream) ? peer.pendingStreams = peer.pendingStreams.concat(stream) : stream && peer.pendingStreams.push(stream), peer.state) {
                case PEER_CONNECT_STATE.CONNECTING:
                case PEER_CONNECT_STATE.CONNECTED:
                    if (peer.pendingStreams.length > 0)
                        drainStream(peer);
                    break;
                default:
                    Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Unexpected peer state: " + peer.state)
                    return void (failCB && failCB(Wrapper.Error.P2P_CLIENT_INVALID_STATE));
            }
            if (succCB)
                succCB();
        };
        var stopStream = function (stream) {
            var localStreams = streamList[stream.getID()];
            if (localStreams) {
                for (var i = 0; i < localStreams.length; i++)
                    unpublishToPeer(stream, localStreams[i]);
            }
        };
        var renegotiate = function (peer) {
            setStatus(peer, INVITIE_STATE.NEGOTIATING);
            sendOffer(peer);
        };
        var needNegotiation = function (peer) {
            if (!peer) return;
            Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "On negotiation needed. Peer id: " + peer.id);
            if (peer.isCaller && ("stable" === peer.connection.signalingState && peer.negotiationState === INVITIE_STATE.READY)) {
                renegotiate(peer);
            } else {
                peer.isNegotiationNeeded = true;
            }
        };
        //
        var drainStream = function (peer) {
            if (peer.connection) {
                for (var s = 0; s < peer.pendingStreams.length; s++) {
                    var stream = peer.pendingStreams[s];
                    peer.pendingStreams.shift();

                    if (stream.mediaStream) {
                        addStreamToList(stream, peer);
                        if (!stream.onClose) {
                            stream.onClose = function () { stopStream(stream); };
                        }
                        peer.connection.addStream(stream.mediaStream);
                        streamTypeToSignalSvr(stream, peer);
                        Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Added stream to peer connection.");
                    }
                }
                peer.pendingStreams = [];
                for (var i = 0; i < peer.pendingUnpublishStreams.length; i++) {
                    if (peer.pendingUnpublishStreams[i].mediaStream) {
                        peer.connection.removeStream(peer.pendingUnpublishStreams[i].mediaStream);
                        Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Remove stream.");
                    }
                }
                peer.pendingUnpublishStreams = [];
            }
        };
        var drainMessage = function (peer) {
            var connection = peer.dataChannels[ITEM_TYPE.MESSAGE];
            if (connection && "closed" !== connection.readyState) {
                for (var i = 0; i < peer.pendingMessages.length; i++)
                    connection.send(peer.pendingMessages[i]);
                peer.pendingMessages = [];
            }
        };
        var addStreamToList = function (stream, peer) {
            var streamId = stream.id();
            if (!streamList[streamId])
                streamList[streamId] = [];
            streamList[streamId].push(peer.id);
        };
        var streamTypeToSignalSvr = function (stream, peer) {
            if (null !== stream) {
                var type = "audio";
                if (stream.isScreen()) {
                    type = "screen";
                    stream.hide = function () {
                        Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Unpublish screen sharing.");
                        unpublishToPeer(stream, peer.id);
                        eventManager.dispatchEvent(new Wrapper.ChatEvent({
                            type: "stream-closed",
                            senderId: peer.id
                        }));
                    };
                } else if (stream.hasVideo()) {
                    type = "video";
                }
                if (signalClient) {
                    Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "sendStreamType to Signal Server.");
                    signalClient.sendStreamType(peer.id, {
                        streamId: stream.mediaStream.id,
                        type: type
                    });
                }
            }
        };
        var iceConnectionChanged = function (peer) {
            if (peer) {
                Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Ice connection state changed. State: " + peer.connection.iceConnectionState);
                if ("closed" === peer.connection.iceConnectionState) {
                    if (peer.state === PEER_CONNECT_STATE.CONNECTED) {
                        closePeerConnection(peer, peer.id);
                        if (signalClient)
                            signalClient.sendCallStopped(peer.id);
                        delete peersInfo[peer.id];
                    }
                } else if ("connected" === peer.connection.iceConnectionState || "completed" === peer.connection.iceConnectionState) {
                    peer.lastDisconnect = (new Date("2099/12/31")).getTime();
                    if (peer.state !== PEER_CONNECT_STATE.CONNECTED) {
                        peer.state = PEER_CONNECT_STATE.CONNECTED;
                        eventManager.dispatchEvent(new Wrapper.ChatEvent({
                            type: "chat-started",
                            peerId: peer.id
                        }));
                    }
                } else if ("checking" === peer.connection.iceConnectionState) {
                    peer.lastDisconnect = (new Date("2099/12/31")).getTime();
                } else if ("disconnected" === peer.connection.iceConnectionState) {
                    peer.lastDisconnect = (new Date).getTime();
                    setTimeout(function () {
                        if ((new Date).getTime() - peer.lastDisconnect >= maxTimeout) {
                            closePeerConnection(peer, peer.id);
                            if (peer === peersInfo[peer.id])
                                delete peersInfo[peer.id];
                        }
                    }, maxTimeout);
                } else if ("failed" === peer.connection.iceConnectionState) {
                    if (peer.state === PEER_CONNECT_STATE.CONNECTED) {
                    } else if (peer.state === PEER_CONNECT_STATE.CONNECTING) {
                        eventManager.dispatchEvent(new Wrapper.ChatEvent({
                            type: "chat-failed",
                            peerId: peer.id
                        }));
                    }
                }
            }
        };
        var signalStateChanged = function (peer) {
            Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Signaling state changed: " + peer.connection.signalingState);
            if ("closed" === peer.connection.signalingState) {
                closePeerConnection(peer, peer.id);
                delete peersInfo[peer.id];
            } else if ("stable" === peer.connection.signalingState) {
                setStatus(peer, INVITIE_STATE.READY);
                if (peer.isCaller && (peer.isNegotiationNeeded && signalClient)) {
                    renegotiate(peer);
                } else {
                    drainStream(peer);
                }
            }
        };
        //
        // Accomplish interface for high level
        var connectToSignalSvr = function (server, succCB, failCB) {
            if (signalConnectStatus !== SIGNAL_CONNECT_STATE.READY) {
                Log.Logger.warning((new Date()).toLocaleTimeString() + " : " + "Another peer has already connected");
                if (failCB)
                    failCB(Wrapper.Error.P2P_CLIENT_INVALID_STATE);
            } else {
                signalConnectStatus = SIGNAL_CONNECT_STATE.CONNECTING;
                signalClient = new onMessage(),
                    signalClient.onConnected = setSignalConnected,
                    signalClient.onDisconnected = setSignalDisconnect,
                    signalClient.onCallStopped = callStopped,
                    signalClient.onCallAccepted = callAccepted,
                    signalClient.onCallSignal = callSignal,
                    signalClient.onAuthenticated = authenticated,
                    signalClient.connect(server, succCB, failCB);
            }
        };
        var disconnectToSignalSvr = function (succCB, failCB) {
            if (signalConnectStatus === SIGNAL_CONNECT_STATE.CONNECTED) {
                sendStopToSignalSvr();
                if (signalClient) {
                    signalClient.disconnect();
                    signalClient = null;
                }
                if (succCB)
                    succCB();
            } else if (failCB)
                failCB(Wrapper.Error.P2P_CLIENT_INVALID_STATE);
        };
        var sendInviteToSignalSvr = function (peerId, succCB, failCB) {
            if (!signalClient)
                return void (failCB && failCB(Wrapper.Error.P2P_CONN_CLIENT_NOT_INITIALIZED));
            if (peerId === myID)
                return void (failCB && failCB(Wrapper.Error.P2P_CLIENT_ILLEGAL_ARGUMENT));
            if (!peersInfo[peerId])
                createPeerInfo(peerId);

            var peer = peersInfo[peerId];
            if (peer.state === PEER_CONNECT_STATE.READY || peer.state === PEER_CONNECT_STATE.OFFERED) {
                Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Send invitation to " + peerId);
                peer.state = PEER_CONNECT_STATE.OFFERED;
                signalClient.sendCallInvitation(peerId, platformInfo, function () {
                    if (succCB)
                        succCB();
                }, function (prop) {
                    peer.state = PEER_CONNECT_STATE.READY;
                    if (failCB)
                        failCB(Wrapper.Error.getErrorByCode(prop));
                });
            } else {
                Log.Logger.debug((new Date()).toLocaleTimeString() + " : " + "Invalid state. Will not send invitation.");
                if (failCB)
                    failCB(Wrapper.Error.P2P_CLIENT_INVALID_STATE);
            }
        };
        var sendStopToSignalSvr = function (peerId, succCB, failCB) {
            if (!signalClient)
                return void (failCB && failCB(Wrapper.Error.P2P_CONN_CLIENT_NOT_INITIALIZED));

            if (peerId) {
                var peer = peersInfo[peerId];
                if (!peer) {
                    Log.Logger.warning((new Date()).toLocaleTimeString() + " : " + "Invalid target ID for stopping chat.");
                    return void (failCB && failCB(Wrapper.Error.P2P_CLIENT_ILLEGAL_ARGUMENT));
                }
                signalClient.sendCallStopped(peer.id);
                closePeerConnection(peer, myID);
                delete peersInfo[peerId];
            } else {
                var res = true;
                for (var i in peersInfo) {
                    res = false;
                    var peer = peersInfo[i];
                    signalClient.sendCallStopped(peer.id);
                    closePeerConnection(peer, myID);
                    delete peersInfo[peer.id];
                }
                if (res) {
                    Log.Logger.warning((new Date()).toLocaleTimeString() + " : " + "No active connections can be stopped.");
                    return void (failCB && failCB(Wrapper.Error.P2P_CLIENT_INVALID_STATE));
                }
            }
            if (succCB)
                succCB();
        };
        var getConnectionStats = function (peerId, succCB, failCB) {
            var peer = peersInfo[peerId];
            if (peer && peer.connection && peer.state === PEER_CONNECT_STATE.CONNECTED) {
                peer.connection.getStats(null, function (ps) {
                    succCB(Wrapper.Common.parseStats(ps));
                }, function (err) {
                    if (failCB)
                        failCB(err);
                });
            } else if (failCB) {
                failCB("failed to get peerconnection statistics");
            }
        };
        var publishToPeer = function (stream, peerId, succCB, failCB) {
            if (stream instanceof Wrapper.LocalStream && (stream.mediaStream && peerId))
                sendStream(stream, peerId, succCB, failCB);
            else if (failCB)
                failCB(Wrapper.Error.P2P_CLIENT_ILLEGAL_ARGUMENT);
        };
        var unpublishToPeer = function (stream, peerId, succCB, failCB) {
            if (!(stream instanceof Wrapper.LocalStream)) {
                Log.Logger.warning((new Date()).toLocaleTimeString() + " : " + "Invalid argument stream");
                return void (failCB && failCB(Wrapper.Error.P2P_CLIENT_ILLEGAL_ARGUMENT));
            }
            if (!peerId) {
                Log.Logger.warning((new Date()).toLocaleTimeString() + " : " + "Invalid argument targetId");
                return void (failCB && failCB(Wrapper.Error.P2P_CLIENT_ILLEGAL_ARGUMENT));
            }
            if (!peersInfo[peerId] || _index(peersInfo[peerId].publishedStreams, stream) < 0) {
                return void (failCB && failCB(Wrapper.Error.P2P_CLIENT_ILLEGAL_ARGUMENT));
            }
            var peer = peersInfo[peerId];
            var tabIndex = _index(peer.publishedStreams, stream);
            peer.publishedStreams.splice(tabIndex, 1);
            peer.pendingUnpublishStreams.push(stream);
            if (peer.state === PEER_CONNECT_STATE.CONNECTED)
                drainStream(peer);
            if (succCB)
                succCB();
        };

        // SDP
        var setBitrateToSDP = function (sdp) {
            sdp = setVideoBitrate(sdp);
            return setAudioBitrate(sdp);
        };
        var setVideoBitrate = function (value) {
            if (connectOptions.bandWidth && connectOptions.bandWidth.maxVideoBW)
                return Wrapper.Common.setPreferredBitrate(value, "video", connectOptions.bandWidth.maxVideoBW);
            else
                return value;
        };
        var setAudioBitrate = function (value) {
            if (connectOptions.bandWidth && connectOptions.bandWidth.maxAudioBW)
                return Wrapper.Common.setPreferredBitrate(value, "audio", connectOptions.bandWidth.maxAudioBW);
            else
                return value;
        };
        var setCodecToSDP = function (sdp, peer) {
            sdp = setVideoCodec(sdp, peer);
            return setAudioCodec(sdp);
        };
        var setVideoCodec = function (value, peer) {
            var codecType = "vp8";
            if (peer && peer.preferredVideoCodec) {
                codecType = peer.preferredVideoCodec;
            } else if (connectOptions.videoCodec) {
                codecType = connectOptions.videoCodec;
            } else {
                codecType = "h264";
            }
            return Wrapper.Common.setPreferredCodec(value, "video", codecType);
        };
        var setAudioCodec = function (value) {
            if (!connectOptions.audioCodec)
                return Wrapper.Common.setPreferredCodec(value, "audio", connectOptions.audioCodec);
            else
                return value;
        };
        //

        return eventManager.connect = connectToSignalSvr,
            eventManager.disconnect = disconnectToSignalSvr,
            eventManager.invite = sendInviteToSignalSvr,
            eventManager.publish = publishToPeer,
            eventManager.unpublish = unpublishToPeer,
            eventManager.stop = sendStopToSignalSvr,
            eventManager.getConnectionStats = getConnectionStats,
            eventManager;
    };
    // end peer client
    global.JSClient = Wrapper;
    global.Logging = Log;
}(window);
