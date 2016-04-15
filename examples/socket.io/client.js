var socket = io('http://127.0.0.1:9999');

// Route messages from `socket.io` to our router using arbitrary `proxy` event.
var router = new nmsg.rpc.Router;
router.send = function(obj) { socket.emit('proxy', obj); };
socket.on('proxy', function(obj) { router.onmessage(obj); });

// Get `Hello world` back from the server.
socket.on('connect', function(){
    router.emit('echo', 'Hello world', function(response) {
        console.log(response);
    });
});
