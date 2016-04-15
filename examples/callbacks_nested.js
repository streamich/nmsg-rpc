"use strict";
var create_mock_sockets_1 = require('./create_mock_sockets');
create_mock_sockets_1.srouter.on('pick-hand', function (callback) {
    callback(function (cb) { cb('white'); }, function (cb) { cb('black'); });
});
create_mock_sockets_1.crouter.emit('pick-hand', function (left, right) {
    right(function (color) {
        console.log(color);
    });
});
