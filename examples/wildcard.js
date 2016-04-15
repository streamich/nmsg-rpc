"use strict";
var create_mock_sockets_1 = require('./create_mock_sockets');
create_mock_sockets_1.srouter.on('*', function (event, arg) {
    console.log({ event: event, arg: arg });
});
create_mock_sockets_1.crouter.emit('event1', 'data1');
create_mock_sockets_1.crouter.emit('event2', 'data2');
