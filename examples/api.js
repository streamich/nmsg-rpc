"use strict";
var rpc = require('../src/rpc');
var create_mock_sockets_1 = require('./create_mock_sockets');
var api = new rpc.Api()
    .add({
    test: function () {
        console.log('test');
    },
    more: function () {
        console.log('more');
    }
})
    .add({
    trololo: function () {
        console.log('trololo');
    }
});
var srouter = new rpc.Router(create_mock_sockets_1.server);
var crouter = new rpc.Router(create_mock_sockets_1.client);
srouter.setApi(api);
crouter.emit('test');
crouter.emit('more');
crouter.emit('trololo');
