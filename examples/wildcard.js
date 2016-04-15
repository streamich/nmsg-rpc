"use strict";
var rpc = require('../src/rpc');
var create_mock_sockets_1 = require('./create_mock_sockets');
var srouter = new rpc.Router(create_mock_sockets_1.server);
var crouter = new rpc.Router(create_mock_sockets_1.client);
srouter.on('*', function (event, arg) {
    console.log({ event: event, arg: arg });
});
crouter.emit('event1', 'data1');
crouter.emit('event2', 'data2');
