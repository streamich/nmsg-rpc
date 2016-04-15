// We include our library, which will give use a global `nmsg` object.
importScripts('../../dist/nmsg-rpc.min.js');

// Create our router using `Worker`'s `postMessage` and `onmessage` global properties.
var router = new nmsg.rpc.Router();
router.send = postMessage.bind(this);
onmessage = function(e) { router.onmessage(e.data); };

// Now we can use `router.emit()` and `router.on()` functionality to define our API.
router.on('calculate', function(code, callback) {
    callback(eval(code));
});

