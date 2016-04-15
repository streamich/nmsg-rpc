"use strict";
var rpc = require('../src/rpc');
var create_mock_sockets_1 = require('./create_mock_sockets');
var bs = new rpc.RouterBuffered;
create_mock_sockets_1.server.onmessage = function (obj) { bs.onmessage(obj); };
bs.send = function (obj) { create_mock_sockets_1.server.send(obj); };
var bc = new rpc.RouterBuffered;
create_mock_sockets_1.client.onmessage = function (obj) { bc.onmessage(obj); };
bc.send = function (obj) { create_mock_sockets_1.client.send(obj); };
bs.on('ping', function () {
    console.log('ping');
});
bc.emit('ping');
