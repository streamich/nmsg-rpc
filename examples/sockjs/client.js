var sock = new SockJS('http://127.0.0.1:9999/ws');

sock.onopen = function() {
    var router = new nmsg.rpc.Router;
    router.send = function(obj) { sock.send(JSON.stringify(obj)); };
    sock.onmessage = function(msg) { router.onmessage(JSON.parse(msg.data)); };

    router.emit('echo', 'Hi server', function(response) {
        console.log(response); // Hi server
    });
};
