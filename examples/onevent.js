"use strict";
var create_mock_sockets_1 = require('./create_mock_sockets');
create_mock_sockets_1.srouter.onevent = function (event, args) {
    console.log('onevent', event, args);
};
create_mock_sockets_1.crouter.emit('event1', 'data1', 1, 2, 3);
create_mock_sockets_1.crouter.emit('event2', 'data2');
