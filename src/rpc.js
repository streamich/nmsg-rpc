"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var util_1 = require('./util');
var Frame = (function () {
    function Frame() {
        this.data = null;
        this.id = 0;
        this.event = '';
        this.args = [];
        this.callbacks = [];
        this.rid = 0; // Response ID.
        this.func = 0; // Response callback position.
        this.timeout = Frame.timeout; // Timeout in seconds for how long to wait for callbacks.
    }
    Frame.getNextId = function () {
        return Frame.id = (Frame.id % 1000000000) + 1; // Always greater than 0.
    };
    Frame.prototype.hasCallbacks = function () {
        for (var _i = 0, _a = this.args; _i < _a.length; _i++) {
            var arg = _a[_i];
            if (typeof arg === 'function')
                return true;
        }
        return false;
    };
    Frame.prototype.isResponse = function () {
        return !!this.rid;
    };
    Frame.id = 0;
    Frame.timeout = 5000; // Default timeout (in milliseconds), so that we don't send timeout value with every request.
    return Frame;
}());
exports.Frame = Frame;
var FrameOutgoing = (function (_super) {
    __extends(FrameOutgoing, _super);
    function FrameOutgoing(args, event) {
        if (args === void 0) { args = []; }
        if (event === void 0) { event = ''; }
        _super.call(this);
        this.id = Frame.getNextId();
        this.event = event;
        this.args = args;
    }
    FrameOutgoing.createResponse = function (request, cb_pos, args) {
        var response = new FrameOutgoing(args);
        response.rid = request.id;
        response.func = cb_pos;
        return response;
    };
    // When a response to some callback is received.
    FrameOutgoing.prototype.processResponse = function (response) {
        var pos = response.func;
        var callback = this.args[pos];
        if (typeof callback !== 'function')
            return; // Invalid response or function already called.
        this.args[pos] = null; // Remove the function as, we will call it now.
        callback.apply(null, response.args);
    };
    FrameOutgoing.prototype.serialize = function () {
        var data = {
            i: this.id,
            e: this.event
        };
        if (this.args.length) {
            data.a = [];
            var cbs = [];
            for (var i = 0; i < this.args.length; i++) {
                var arg = this.args[i];
                if (typeof arg === 'function') {
                    // data.args.push(0);  // Just fill function spots with 0, they will be ignored anyways.
                    cbs.push(i);
                    this.callbacks.push(arg);
                }
                else {
                    data.a.push(arg);
                    if (Frame.timeout != this.timeout)
                        data.t = this.timeout / 1000;
                }
            }
            if (cbs.length) {
                data.c = cbs;
            }
        }
        // IFrameDataResponse
        if (this.rid) {
            data.r = this.rid;
            data.f = this.func;
        }
        this.data = data;
        return this.data;
    };
    return FrameOutgoing;
}(Frame));
exports.FrameOutgoing = FrameOutgoing;
var FrameIncoming = (function (_super) {
    __extends(FrameIncoming, _super);
    function FrameIncoming() {
        _super.apply(this, arguments);
    }
    FrameIncoming.prototype.unserialize = function (data, onCallback) {
        this.data = data;
        // IFrameData
        if (typeof data.i === 'number')
            this.id = data.i;
        else
            throw Error('Error parsing id');
        if (data.t) {
            if (typeof data.t == 'number')
                this.timeout = data.t;
            else
                throw Error('Error parsing timeout');
        }
        else
            this.timeout = Frame.timeout;
        this.args = [];
        if (data.a) {
            if (data.a instanceof Array) {
                for (var _i = 0, _a = data.a; _i < _a.length; _i++) {
                    var arg = _a[_i];
                    this.args.push(arg);
                }
            }
            else
                throw Error('Error parsing arguments');
        }
        else
            data.a = [];
        this.callbacks = [];
        if (data.c) {
            if (!(data.c instanceof Array))
                throw Error('Error parsing callbacks');
            for (var _b = 0, _c = data.c; _b < _c.length; _b++) {
                var pos = _c[_b];
                var callback = onCallback(this, pos);
                this.callbacks.push(callback);
                this.args.splice(pos, 0, callback);
            }
        }
        this.event = '';
        this.rid = 0;
        this.func = 0;
        if (data.e) {
            // IFrameDataInitiation
            if (typeof data.e === 'string')
                this.event = data.e;
            else
                throw Error('Error parsing event');
        }
        else if (data.r) {
            // IFrameDataResponse
            if (typeof data.r === 'number')
                this.rid = data.r;
            else
                throw Error('Error parsing resposne id');
            if (typeof data.f === 'number')
                this.func = data.f;
            else
                throw Error('Error parsing reponse position');
        }
    };
    return FrameIncoming;
}(Frame));
exports.FrameIncoming = FrameIncoming;
var Router = (function () {
    function Router(socket) {
        var _this = this;
        this.latency = 500; // Client to server latency in milliseconds, expected.
        // List of frames (by ID) which had callbacks, we keep track of them to send back responses to callbacks, if received.
        this.frame = {};
        this.timer = {};
        this.api = null;
        // List of subscriber functions .on()
        // TODO:
        // TODO:
        // TODO:
        // TODO: This actually cannot be a list, only one callback per event!
        this.subs = {};
        if (socket) {
            this.send = socket.send.bind(socket);
            socket.onmessage = function (msg) { _this.onmessage(msg); };
        }
    }
    Router.prototype.genCallack = function (frame, pos) {
        var _this = this;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            _this.dispatch(FrameOutgoing.createResponse(frame, pos, args));
        };
    };
    Router.prototype.getSubList = function (event) {
        if (!this.subs[event])
            this.subs[event] = [];
        return this.subs[event];
    };
    Router.prototype.pub = function (frame) {
        var event = frame.event;
        if (!event)
            return;
        var args = frame.args;
        var method;
        if (this.api)
            method = this.api.get(event);
        if (method) {
            method.apply(this, args); // Set this to this Router, in case it has not been bound, so method could use `this.emit(...);`
        }
        else {
            var list = this.getSubList(event);
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var sub = list_1[_i];
                sub.apply(null, args);
            }
            list = this.getSubList('*');
            for (var _a = 0, list_2 = list; _a < list_2.length; _a++) {
                var sub = list_2[_a];
                sub.apply(null, [event].concat(args));
            }
        }
    };
    Router.prototype.sendData = function (data) {
        this.send(data);
    };
    Router.prototype.dispatch = function (frame) {
        var _this = this;
        if (frame.hasCallbacks()) {
            this.frame[frame.id] = frame;
            // Remove this frame after some timeout, if callbacks not called.
            this.timer[frame.id] = setTimeout(function () { delete _this.frame[frame.id]; }, frame.timeout + this.latency);
        }
        var data = frame.serialize();
        // console.log('dispatch', data);
        this.sendData(data);
    };
    Router.prototype.processResponse = function (frame) {
        var request = this.frame[frame.rid];
        if (!request)
            return; // Cannot find the original request.
        request.processResponse(frame);
        // Remove the original request frame, if all callbacks processed.
        if (!request.hasCallbacks()) {
            var id = request.id;
            delete this.frame[id];
            var timer = this.timer[id];
            if (timer)
                clearTimeout(timer);
            delete this.timer[id];
        }
    };
    Router.prototype.setApi = function (api) {
        this.api = api;
        return this;
    };
    // This function is called by user.
    Router.prototype.onmessage = function (msg) {
        var frame = new FrameIncoming;
        frame.unserialize(msg, this.genCallack.bind(this));
        if (frame.isResponse())
            this.processResponse(frame);
        else
            this.pub(frame);
    };
    Router.prototype.on = function (event, callback) {
        var list = this.getSubList(event);
        list.push(callback);
        return this;
    };
    Router.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var frame = new FrameOutgoing(args, event);
        this.dispatch(frame);
        return this;
    };
    return Router;
}());
exports.Router = Router;
// Same as `Router`, but buffers all frames for 5 milliseconds and then sends a list of all frames at once.
var RouterBuffered = (function (_super) {
    __extends(RouterBuffered, _super);
    function RouterBuffered() {
        _super.apply(this, arguments);
        this.cycle = 5; // Milliseconds for how long to buffer requests.
        this.timer = 0;
        this.buffer = [];
    }
    RouterBuffered.prototype.flush = function () {
        var data = { b: this.buffer };
        this.send(data);
        this.buffer = [];
    };
    RouterBuffered.prototype.sendData = function (data) {
        this.buffer.push(data);
        this.startTimer();
    };
    RouterBuffered.prototype.startTimer = function () {
        var _this = this;
        if (!this.timer) {
            this.timer = setTimeout(function () {
                _this.timer = 0;
                _this.flush();
            }, this.cycle);
        }
    };
    RouterBuffered.prototype.onmessage = function (msg) {
        // console.log('msg', msg);
        if (typeof msg != 'object')
            return;
        if (msg.b) {
            if (!(msg.b instanceof Array))
                return;
            for (var _i = 0, _a = msg.b; _i < _a.length; _i++) {
                var fmsg = _a[_i];
                _super.prototype.onmessage.call(this, fmsg);
            }
        }
        else
            _super.prototype.onmessage.call(this, msg);
    };
    return RouterBuffered;
}(Router));
exports.RouterBuffered = RouterBuffered;
// A collection of API functions.
var Api = (function () {
    function Api() {
        this.methods = {};
    }
    Api.prototype.add = function (list) {
        this.methods = util_1.extend(this.methods, list);
        return this;
    };
    Api.prototype.get = function (method) {
        return this.methods[method];
    };
    return Api;
}());
exports.Api = Api;
