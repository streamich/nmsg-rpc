var root = this;
if (typeof window !== 'undefined')
    root = window;
if (typeof self !== 'undefined')
    root = self; // Global scope in web Worker.
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    }
    else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    }
    // Browser globals (root is window)
    root.nmsg = root.nmsg || {};
    root.nmsg.rpc = factory();
}(root, function () {
    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return require('./rpc');
}));
