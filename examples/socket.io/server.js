var io = require('socket.io')();
var rpc = require('../../rpc');

// Create API only once, instead of attaching gazillion `.on` events to EACH new socket.
var api = new rpc.Api;
api.add({
    echo: function(msg, callback) {
        callback(msg);
    }
});

io.on('connection', function(socket){
    // Create router we will use instead of `socket.io`'s built-in one.
    var router = new rpc.Router;

    // Tell the router to use API we created only ONCE for all sockets.
    router.setApi(api);

    // Proxy messages using `proxy` event to our new router.
    router.send = function(obj) { socket.emit('proxy', obj); };
    socket.on('proxy', function(obj) { router.onmessage(obj); });
});
io.listen(9999);
