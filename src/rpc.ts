import {extend} from './util';


export interface ISocket {
    onmessage: (msg: any) => void;
    send(msg: any);
}


export type TeventCallback = (...args: any[]) => void;
export type TeventCallbackList = TeventCallback[];

export interface IFrameData {
    i: number;      // Frame ID.
    a?: any[];      // Data sent in function call where functions are removed.
    c?: number[];   // List of positions where functions in arguments where removed.
    t?: number;     // Timeout in seconds for how long to wait for function execution.
}

export interface IFrameDataInitiation extends IFrameData {
    e: string;      // Event name or API method name.
}

export interface IFrameDataResponse extends IFrameData {
    r: number;      // Response ID, i.e. ID of the frame to which this is a response.
    f: number;      // Callback pos, index of the callback which was called.
}

export type FrameList = (IFrameDataInitiation | IFrameDataResponse)[];

export interface IFrameDataBuffered {
    b: FrameList; // B for bulk.
}


export abstract class Frame {

    static id = 0;

    static getNextId(): number {
        return Frame.id = (Frame.id % 1000000000) + 1; // Always greater than 0.
    }

    static timeout = 5000; // Default timeout (in milliseconds), so that we don't send timeout value with every request.

    data: IFrameDataInitiation | IFrameDataResponse = null;

    id = 0;

    event = '';

    args = [];

    callbacks: ((...args: any[]) => void)[] = [];

    rid = 0; // Response ID.

    func = 0; // Response callback position.

    timeout = Frame.timeout; // Timeout in seconds for how long to wait for callbacks.

    hasCallbacks(): boolean {
        for(var arg of this.args) if(typeof arg === 'function') return true;
        return false;
    }

    isResponse(): boolean {
        return !!this.rid;
    }
}


export class FrameOutgoing extends Frame {

    static createResponse(request: Frame, cb_pos: number, args: any[]) {
        var response = new FrameOutgoing(args);
        response.rid = request.id;
        response.func = cb_pos;
        return response;
    }

    constructor(args: any[] = [], event: string = '') {
        super();
        this.id = Frame.getNextId();
        this.event = event;
        this.args = args;
    }

    // When a response to some callback is received.
    processResponse(response: FrameIncoming) {
        var pos = response.func;
        var callback = this.args[pos];
        if(typeof callback !== 'function') return; // Invalid response or function already called.
        this.args[pos] = null; // Remove the function as, we will call it now.
        callback.apply(null, response.args);
    }

    serialize() {
        var data: any = {
            i: this.id,
            e: this.event,
        };

        if(this.args.length) {
            data.a = [];
            var cbs = [];
            for(var i = 0; i < this.args.length; i++) {
                var arg = this.args[i];
                if(typeof arg === 'function') {
                    // data.args.push(0);  // Just fill function spots with 0, they will be ignored anyways.
                    cbs.push(i);
                    this.callbacks.push(arg);
                } else {
                    data.a.push(arg);
                    if(Frame.timeout != this.timeout) data.t = this.timeout / 1000;
                }
            }

            if(cbs.length) { // We have functions that can be potentially called.
                data.c = cbs;
            }
        }

        // IFrameDataResponse
        if(this.rid) {
            data.r = this.rid;
            data.f = this.func;
        }

        this.data = data;
        return this.data;
    }
}


export class FrameIncoming extends Frame {

    unserialize(data, onCallback) {
        this.data = data;

        // IFrameData
        if(typeof data.i === 'number') this.id = data.i;
        else throw Error('Error parsing id');

        if(data.t) {
            if(typeof data.t == 'number') this.timeout = data.t;
            else throw Error('Error parsing timeout');
        } else this.timeout = Frame.timeout;

        this.args = [];
        if(data.a) {
            if(data.a instanceof Array) {
                for(var arg of data.a) this.args.push(arg);
            }
            else throw Error('Error parsing arguments');
        } else data.a = [];

        this.callbacks = [];
        if(data.c) {
            if(!(data.c instanceof Array)) throw Error('Error parsing callbacks');
            for(var pos of data.c) {
                var callback = onCallback(this, pos);
                this.callbacks.push(callback);
                this.args.splice(pos, 0, callback);
            }
        }

        this.event = '';
        this.rid = 0;
        this.func = 0;

        if(data.e) {

            // IFrameDataInitiation
            if(typeof data.e === 'string') this.event = data.e;
            else throw Error('Error parsing event');

        } else if(data.r) {

            // IFrameDataResponse
            if(typeof data.r === 'number') this.rid = data.r;
            else throw Error('Error parsing resposne id');

            if(typeof data.f === 'number') this.func = data.f;
            else throw Error('Error parsing reponse position');
        }
    }
}


export class Router {

    latency = 500; // Client to server latency in milliseconds, expected.

    // List of frames (by ID) which had callbacks, we keep track of them to send back responses to callbacks, if received.
    protected frame: {[id: number]: FrameOutgoing} = {};
    protected timer: {[id: number]: any} = {};

    // This function is overwritten by the user.
    send: (data) => void;

    onerror: (err) => void = () => {};

    api: Api = null;

    // List of subscriber functions .on()


    // TODO:
    // TODO:
    // TODO:
    // TODO: This actually cannot be a list, only one callback per event!


    protected subs: {[event: string]: TeventCallbackList} = {};


    protected genCallack(frame: FrameIncoming, pos: number) {
        var called = false;
        return (...args: any[]): void => {
            if(!called) {
                called = true;
                this.dispatch(FrameOutgoing.createResponse(frame, pos, args));
            }
            else throw Error(`Already called: .on("${frame.event}") ${pos}th arg`);
        };
    }

    protected getSubList(event: string): TeventCallbackList {
        if(!this.subs[event]) this.subs[event] = [];
        return this.subs[event];
    }

    protected pub(frame: Frame) {
        var event = frame.event;
        if(!event) return;
        var args = frame.args;

        var method;
        if(this.api) method = this.api.get(event);

        if(method) { // API methods have precedence.
            method.apply(this, args); // Set this to this Router, in case it has not been bound, so method could use `this.emit(...);`
        } else { // Else call .on() callbacks.
            var list = this.getSubList(event);
            for(var sub of list) sub.apply(null, args);

            list = this.getSubList('*');
            for(var sub of list) sub.apply(null, [event, ...args]);
        }
    }

    protected sendData(data) {
        this.send(data);
    }

    protected dispatch(frame: FrameOutgoing) {
        if(frame.hasCallbacks()) {
            this.frame[frame.id] = frame;

            // Remove this frame after some timeout, if callbacks not called.
            this.timer[frame.id] = setTimeout(() => { delete this.frame[frame.id]; }, frame.timeout + this.latency);
        }

        var data = frame.serialize();
        // console.log('dispatch', data);
        this.sendData(data);
    }

    protected processResponse(frame: FrameIncoming) {
        var request = this.frame[frame.rid];
        if(!request) return; // Cannot find the original request.
        request.processResponse(frame);

        // Remove the original request frame, if all callbacks processed.
        if(!request.hasCallbacks()) {
            var id = request.id;
            delete this.frame[id];
            var timer = this.timer[id];
            if(timer) clearTimeout(timer);
            delete this.timer[id];
        }
    }

    constructor(socket?: ISocket) {
        if(socket) {
            this.send = socket.send.bind(socket);
            socket.onmessage = (msg) => { this.onmessage(msg); };
        }
    }

    setApi(api: Api): this {
        this.api = api;
        return this;
    }

    // This function is called by user.
    onmessage(msg) {
        var frame = new FrameIncoming;
        try {
            frame.unserialize(msg, this.genCallack.bind(this));
        } catch(e) {
            this.onerror(e);
            return;
        }

        if(frame.isResponse()) this.processResponse(frame);
        else this.pub(frame);
    }

    on(event: string, callback: TeventCallback): this {
        var list: TeventCallbackList = this.getSubList(event);
        list.push(callback);
        return this;
    }

    emit(event: string, ...args: any[]): this {
        var frame = new FrameOutgoing(args, event);
        this.dispatch(frame);
        return this;
    }
}


// Same as `Router`, but buffers all frames for 5 milliseconds and then sends a list of all frames at once.
export class RouterBuffered extends Router {

    cycle = 5; // Milliseconds for how long to buffer requests.

    protected timer: any = 0;

    protected buffer: FrameList = [];

    protected flush() {
        var data: IFrameDataBuffered = {b: this.buffer};
        this.send(data);
        this.buffer = [];
    }

    protected sendData(data) {
        this.buffer.push(data);
        this.startTimer();
    }

    protected startTimer() {
        if(!this.timer) {
            this.timer = setTimeout(() => {
                this.timer = 0;
                this.flush();
            }, this.cycle);
        }
    }

    onmessage(msg) {
        // console.log('msg', msg);
        if(typeof msg != 'object') return;
        if(msg.b) { // Buffered bulk request.
            if(!(msg.b instanceof Array)) return;
            for(var fmsg of msg.b) super.onmessage(fmsg);
        } else super.onmessage(msg);
    }
}


export type TApiList = {[method: string]: (...args: any[]) => void};


// A collection of API functions.
export class Api {

    protected methods: TApiList = {};

    add(list: TApiList): this {
        this.methods = extend(this.methods, list);
        return this;
    }

    get(method: string) {
        return this.methods[method];
    }
}
