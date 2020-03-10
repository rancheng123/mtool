/**
 * NOTE: this file is in ES5 style as it will be run inside browser directly
 */

var getmac = require('getmac')
var mqtt = require('mqtt')
var configuration = require('./app/configuration')

var BridgeCls = function() {
    Object.defineProperty(this, 'getmac', {
        enumerable: true,
        get: function() {
            return getmac
        }
    })
    Object.defineProperty(this, 'Janus', {
        enumerable: true,
        get: function() {
            return window.Janus
        }
    })
    Object.defineProperty(this, 'mqtt', {
        enumerable: true,
        get: function() {
            return mqtt
        }
    })
    Object.defineProperty(this, 'configuration', {
        enumerable: true,
        get: function() {
            return configuration
        }
    })
    Object.defineProperty(this, 'attachMediaStream', {
        enumerable: true,
        get: function() {
            return window.attachMediaStream
        }
    })
    Object.defineProperty(this, 'Spinner', {
        enumerable: true,
        get: function() {
            return window.Spinner
        }
    })

}

window.bridge = new BridgeCls()
