"use strict";
var create_mock_sockets_1 = require('./create_mock_sockets');
create_mock_sockets_1.srouter.on('ping', function (callback) {
    callback('pong');
});
create_mock_sockets_1.crouter.emit('ping', function (res) {
    console.log(res);
});
