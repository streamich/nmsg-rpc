"use strict";
var rpc = require('../src/rpc');
var Socket = (function () {
    function Socket() {
        this.connectedToSocket = null;
    }
    Socket.prototype.send = function (msg) {
        this.connectedToSocket.onmessage(msg);
    };
    return Socket;
}());
exports.server = new Socket;
exports.client = new Socket;
exports.server.connectedToSocket = exports.client;
exports.client.connectedToSocket = exports.server;
exports.srouter = new rpc.Router;
exports.crouter = new rpc.Router;
exports.server.onmessage = function (obj) { exports.srouter.onmessage(obj); };
exports.client.onmessage = function (obj) { exports.crouter.onmessage(obj); };
exports.srouter.send = function (obj) { exports.server.send(obj); };
exports.crouter.send = function (obj) { exports.client.send(obj); };
