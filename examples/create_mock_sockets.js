"use strict";
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
