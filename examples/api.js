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
create_mock_sockets_1.srouter.setApi(api);
create_mock_sockets_1.crouter.emit('test');
create_mock_sockets_1.crouter.emit('more');
create_mock_sockets_1.crouter.emit('trololo');
