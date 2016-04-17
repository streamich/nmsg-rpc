var cluster = require('cluster');
var rpc = require('../../rpc');
var worker = require('./worker');

if (cluster.isMaster) {
    // Master code...
    var numCPUs = require('os').cpus().length;
    for (var i = 0; i < numCPUs; i++) {
        (function() {
            // For a new worker.
            var worker = cluster.fork();

            // Create router to talk to each of the workers.
            var router = new rpc.Router;
            router.send = worker.send.bind(worker);
            cluster.on('message', function(obj) { router.onmessage(obj); });

            // Send message to a worker.
            router.emit('still alive?', function(response) {
                console.log(response);
            });
        })();
    }
} else {
    // Worker code...
    worker(); // Here we create new workers.
}
