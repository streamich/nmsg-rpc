var rpc = require('../../src/rpc');

module.exports = function worker() {
    var router = new rpc.Router;
    router.send = process.send.bind(process);
    process.on('message', function (obj) { router.onmessage(obj); });

    router.on('still alive?', function(callback) {
        callback('Yes!');
    });
};
