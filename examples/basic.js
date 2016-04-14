"use strict";
var rpc = require('../src/rpc');
var create_mock_sockets_1 = require('./create_mock_sockets');
create_mock_sockets_1.client.onmessage = function (msg) {
    console.log('Client received:', msg);
};
create_mock_sockets_1.server.send('Hello World!');
var server_router = new rpc.Router(create_mock_sockets_1.server);
var client_router = new rpc.Router(create_mock_sockets_1.client);
server_router
    .on('hello', function () {
    console.log('Hello World');
})
    .on('ping', function (callback) {
    callback('pong');
});
client_router.emit('hello');
client_router.emit('ping', function (result) {
    console.log("ping > " + result);
});
