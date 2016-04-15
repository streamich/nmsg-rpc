var http = require('http');
var sockjs = require('sockjs');
var rpc = require('../../src/rpc');

var ws = sockjs.createServer();
ws.on('connection', function(conn) {

    // Wrap SockJS into our router.
    var router = new rpc.Router;
    conn.on('data', function(message) { router.onmessage(JSON.parse(message)); });
    router.send = function(obj) { conn.write(JSON.stringify(obj)); };

    // Create an echo method.
    router.on('echo', function(msg, callback) {
        callback(msg);
    });
});

var server = http.createServer();
ws.installHandlers(server, {prefix: '/ws'});
server.listen(9999, '127.0.0.1');
