// Create the `rpc.Router`.
var router = new nmsg.rpc.Router;

// Send router frames using `window.localStorage` facility.
router.send = function(obj) {
    // The `storage` event on `Window` is fired only when contents of a key changes,
    // so we make sure our key is `''` empty first.
    window.localStorage.removeItem('intercom', '');
    window.localStorage.setItem('intercom', JSON.stringify(obj));
};

// Receive messages using `storage` event listener,
// which is fired every time `window.localStorage` is modified.
window.addEventListener('storage', function (event) {
    if((event.key == 'intercom') && (event.type == 'storage') && event.newValue) {
        var obj = JSON.parse(event.newValue);
        // HACK: add an extra argument to our listeners containing the `storage` event.
        obj.a.push(event);
        router.onmessage(obj);
    }
});
