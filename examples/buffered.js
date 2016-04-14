"use strict";
var rpc = require('../src/rpc');
var create_mock_sockets_1 = require('./create_mock_sockets');
new rpc.Router.Buffered(create_mock_sockets_1.server).on('ping', function () {
    console.log('ping');
});
new rpc.Router.Buffered(create_mock_sockets_1.client).emit('ping');
