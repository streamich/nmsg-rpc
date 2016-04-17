# RPC (Remote Procedure Calls) for Node.js Messengers

> **What is `nmsg-rpc`?**

> Let's say you have two connected sockets and all they can do is send and receive
messages from each other out of order, but you want to do request/response
type of communication or use `.on('event', cb)` and `.emit('event', data, cb)`
event-based routing -- that's where `nmsg-rpc` comes in.

This module has been extracted from [nmsg](http://npmjs.com/packages/nmsg)
as a generic RPC router for any bi-directional messenger to create event-based routing.

*Features:*
 - Send multiple callbacks using `.emit('event', cb1, 'data', cb2, cb3)`
 - Callbacks can be [nested arbitrarily deep](./examples/callbacks_nested.ts),
i.e, your response can have callbacks inside them as well, and responses to reponse too, etc...
 - On the server, provides `rpc.Api` class where you define your API only
 once instead of adding events using `.on()` to every new connection.
 - Has no dependencies at ~350 lines of code.
 - See examples below for usage with `SockJS` and `socket.io`
 - Use [nmsg-rpc.js](./dist/nmsg-rpc.js) and [nmsg-rpc.min.js](./dist/nmsg-rpc.min.js) distributions that
 export this library as AMD or Node.js-compatible module and adds a global variable `nmsg.rpc` in your browser.

Can be used with any socket that implements bi-directional communication like:

```ts
interface ISocket {
    onmessage: (msg: any) => void;
    send(msg: any);
}
```

(P.S. [`Websocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) is implemented like that.)

Usage:

```ts
import * as rpc from 'nmsg-rpc'; // var rpc = require('nmsg-rpc');

var socket: ISocket; // Socket that can send messages and receive messages.
var router = new rpc.Router;

// Proxy the messages to your `router`.
router.send = (obj) => { socket.send(obj); };
socket.onmessage = (obj) => { router.onmessage(obj); };
```

You do this for both of your sockets: the server one and the client one. Now,
you can use your newly created `router` like so:

```js
// On server
router.on('ping', function(callback) {
    callback('pong');
});

// On client
router.emit('ping', function(result) {
    console.log(result); // pong
});
```

You can use wildcard `"*"` event to capture all imcoming messages:

```ts
router.on('*', function(event, ...args: any[]) {
    // All incoming messages here.
    // If any callbacks in `args` list, make sure you call it only once
    // as this message will be passed to corresponding event callback as well.
}); 
```

## Reference

### `rpc.Router`

```ts
class Router {
    send: (data) => void;
    onmessage(msg: any): void;
    onerror: (err) => void;
    setApi(api: Api): this;
    on(event: string, callback: TeventCallback): this;
    emit(event: string, ...args: any[]): this;
}
```

 - `.send(data)` -- you have to implement this function.
 - `.onmessage(msg)` -- you have to call this function when new messages arrive.
 - `.on()` and `.emit()` -- use these two methods to do all your communication between the processes.
 - `.onerror(err)` -- you can implement this function to listen for parsing errors.
 - `.onevent(event: string, args: any[])` -- implement this function to wiretap on all incoming events.

### `rpc.RouterBuffered`

`rpc.RouterBuffered` is almost the same as `rpc.Router` except it buffers all outgoing `.emit()` calls
for 10 milliseconds and then combines them into one bulk request and flushes it, thus combining many small
calls into one bigger request.

### `rpc.Api`

On server side you actually don't want to add `.on()` event callbacks for every
socket. Imagine you had 1,000 `.on()` callbacks for each socket and 1,000
live sockets, you would need to create 1,000,000 functions for that.

To avoid that, server-side use `rpc.Api` class to define all your functions
only once like so:

```ts
var api = new rpc.Api()
    .add({
        method1: function() { /*...*/ },
        method2: function() { /*...*/ },
    })
    .add({
        method3: function() { /*...*/ },
    });
    
var router = new rpc.Router;
router.setApi(api);
```

Methods defined in `rpc.Api` will *"overwrite"* equally named events attached using `.on()`.

*TypeScript* type definitions available in [./nmsg-rpc.d.ts](./nmsg-rpc.d.ts).

## Examples

Originally `nmsg-rpc` was part of the [`nmsg`](http://npmjs.com/package/nmsg) project but it is so useful
on its own that we have carved it out into a standalone package. At only 344 lines of code (as of this writing)
and no external dependencies, `nmsg-rpc` is lightweight enough for you to use in almost any project.

Below we will take at the following use cases:

 - Talking with a web `Worker`
 - Talking with `<iframe>` or other windows using `.postMessage()`
 - Using `window.localStorage` as a communication channel between browser tabs
 - Interface for `cluster`'s master thread and forked workers in Node.js
 - Adding event-base routing to `SockJS`
 - Improving routing for `socket.io`

See [./examples](./examples) folder for all the examples.
 
### Talking with a web `Worker`

Web [`Worker`](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker) allows you
to do computations in a browser on a separate thread. It exposes `.postMessage()` method
and `.onmessage` function property which you can use to communicate with your `Worker`.

Here we use those to create `rpc.Router` for bi-directional event-based communication with callbacks between
the main thread and the worker.

Let's start with the [`woker.js`](./examples/webworker/worker.js) script that implements our `Worker`. For your browser projects,
you can use builds of `nmsg-rpc` packaged in [nmsg-rpc.js](./dist/nmsg-rpc.js) and [nmsg-rpc.min.js](./dist/nmsg-rpc.min.js)
from [./dist](./dist) folder.

```js
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
```

Now in the parent thread [`index.html`](./examples/webworker/index.html), we create this web `Worker`
and talk to it using `rpc.Router`:

```js
// Create a web `Worker`.
var worker = new Worker('worker.js');

// Create our `rpc.Router` to talk with the `Worker`.
var router = new nmsg.rpc.Router;
router.send = worker.postMessage.bind(worker);
worker.onmessage = function(e) { router.onmessage(e.data); };

// Send messages to the `Worker`.
router.emit('calculate', '1 + 1', function(result) {
    console.log(result); // 2
});
```

See the [sample files](./examples/webworker).

### `window.postMessage()` for communicating with `<iframe/>`

For security reasons `<iframe/>`s are sandboxed and the only communication
mechanism with them is through `.postMessage()` method, obviously that
way your messages are sent out of order and you have to keep track of them somehow to, for example,
create a request/response functionality, we use `rpc.Router` to solve this.

One thing to remember is that `.postMessage()` method in some browsers can only send `string`
messages, so we use `JSON.stringify` and `JSON.parse` to serialize our objects.

Inside the [iframe.html](./examples/iframe/iframe.html) you can create a `router` object as follows:

```js
// Create our `rpc.Router` using <iframe/>'s `.postMessage()` and `.onmessage` methods.
var router = new nmsg.rpc.Router;
router.send = function(obj) {
    window.top.postMessage(JSON.stringify(obj), '*');
};
window.addEventListener('message', function(event) {
    router.onmessage(JSON.parse(event.data));
});

// Define our API.
router.on('ping', function(callback) {
    callback('pong');
});
```

And in our [parent window](./examples/iframe/index.html) we do:

```js
// Get a reference to your <iframe> somehow.
var iframe = document.getElementById('iframe');
iframe.onload = function() { // Wait until <iframe> loads.
    // Create `rpc.Router`.
    var router = new nmsg.rpc.Router;
    router.send = function(obj) {
        iframe.contentWindow.postMessage(JSON.stringify(obj), '*');
    };
    window.addEventListener('message', function(event) {
        router.onmessage(JSON.parse(event.data));
    });

    // Communicate with your <iframe>.
    router.emit('ping', function(res) {
        console.log('ping > ' + res); // ping > pong
    });
};
```

See the [this example](./examples/iframe).

Note that this is just an example for illustration purposes, as there are plenty of 
other things to consider when communicating with `<iframe>`s. For example, all windows can send messages
to all other windows, so the example will work if you have only two windows. Also, when dealing
`window.postMessage()` you must check the origin of the messages for security purposes, as any
window can send messages to your script.

### Intercom for browser tabs using `window.localStorage`

Here we will create a messaging system between browser tabs, all just in few lines of code.

You can store data which is accessible by all browser tabs in `window.localStorage`,
once a key in `window.localStorage` is modified, `window` fires a `storage` event in 
*all other* tabs with the modified key event.

We use this functionality to send our messages by mutating some key on `localStorage` and
we listen to the `storage` event to capture incoming messages.

This is how we create our router in [router.js](./examples/tabs/router.js):

```js
// Create the `rpc.Router`.
var router = new nmsg.rpc.Router;

// Send router frames using `window.localStorage` facility.
router.send = function(obj) {
    // The `storage` event on `Window` is fired only when contents of a key changes,
    // so we make sure our key is removed at first.
    window.localStorage.removeItem('intercom');
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
```

Now we create a [`tab.html`](./examples/tabs/tab.html) file that will communicate
with other opened tabs by sending a hello message and receiving a response from
other tabs by whichever tab sends the response first:

```js
router.on('Hello, tab, how are you?', function(callback, event) {
    console.log('Event:', event);
    callback('Not bad! How are you?');
});

router.emit('Hello, tab, how are you?', function(response, event) {
    console.log(response, event);
});
```

If you open [`tab.html`](./examples/tabs/tab.html) in one tab you should see nothing
at first. Then you open that same file in one more tab and you should see in console:

    Not bad! How are you? [Storage event object]
    
And now in the first tab this will appear:

    Event: [Storage event object]
    
See the full example [here](./examples/tabs).

### Interface for Node.js `cluster`'s main thread and forked workers 

We can use `rpc.Router` to create a communication interface for Node's
main process and its forked workers.

This is how we create an `rpc.Router` on the master thread:

```js
var router = new rpc.Router;
router.send = worker.send.bind(worker);
cluster.on('message', function(obj) { router.onmessage(obj); });

// Send message to a worker.
router.emit('still alive?', function(response) {
    console.log(response);
});
```

And for forked workers we create a router like so:

```js
var router = new rpc.Router;
router.send = process.send.bind(process);
process.on('message', function (obj) { router.onmessage(obj); });

router.on('still alive?', function(callback) {
    callback('Yes!');
});
```

See full example in [./examples/cluster](./examples/cluster).

### Adding event-base routing to `SockJS`

Out-of-the-box `SockJS` does not provide any sophisticated message routing 
interface, but just `.onmessage` and `.send` methods. Conveniently those methods
are just enough to create an `rpc.Router` wrapper around `SockJS`.

This is how we do it on the server:

```js
var http = require('http');
var sockjs = require('sockjs');
var rpc = require('nmsg-rpc');

var ws = sockjs.createServer();
ws.on('connection', function(conn) {

    // Wrap SockJS into our router.
    var router = new rpc.Router;
    conn.on('data', function(message) { router.onmessage(JSON.parse(message)); });
    router.send = function(obj) { conn.write(JSON.stringify(obj)); };

    // Create an echo method.
    router.on('echo', function(msg, callback) {
        callback(msg);
    });
});

var server = http.createServer();
ws.installHandlers(server, {prefix: '/ws'});
server.listen(9999, '127.0.0.1');
```

And this is how you do it in a browser:

```js
var sock = new SockJS('http://127.0.0.1:9999/ws');

sock.onopen = function() {
    var router = new nmsg.rpc.Router;
    router.send = function(obj) { sock.send(JSON.stringify(obj)); };
    sock.onmessage = function(msg) { router.onmessage(JSON.parse(msg.data)); };

    router.emit('echo', 'Hi server', function(response) {
        console.log(response); // Hi server
    });
};
```

In this example we create an `echo` event that just echoes back the original
text, so in your browser console, `Hi server` will appear. See [here](./examples/sockjs) full example.

### Smart routing for `socket.io`

Well `socket.io` has its own message routing mechanisms built in. However, it's
routing system in one of the most sophisticated and handicapped at the same.

It has advanced routing mechanisms like [Rooms and Namespaces](http://socket.io/docs/rooms-and-namespaces/#), which
not many understand how to use and almost none actually uses.

And at the same time, it does not offer such simple functionality as a wildcard
`"*"` event, for example, to catch all events. Also, it forces you to add
all your event listeners using the `.on()` method to every new socket. So, for example,
if you have 100 different event listeners and 100 sockets concurrently connected to
the sever, you would need to create 10,000 functions, instead of just having a
set of 100 function which are the same for every connection anyways. And, of course,
`socket.io` allows you to send a callback on your `.emit('event', 'data', cb)` call, but it allows
you to send only a single callback and only at the end of the argument list. `rpc.Router`
does not have such limitations, you can have as many callbacks as you wish in any
position of `.emit()` argument list and even arbitrarily deeply nested callbacks in
in your responses.

You can *fix* these limitations of `socket.io` by using it together with `nmsg-rpc`.
In the example below, we proxy messages using `proxy` event in and out of `rpc.Router`,
we also use `rpc.Api` object to define our API functions only once and share that object
with every new router object.

```js
var io = require('socket.io')();
var rpc = require('nmsg-rpc');

// Create API only once, instead of attaching gazillion `.on` events to EACH new socket.
var api = new rpc.Api;
api.add({
    echo: function(msg, callback) {
        callback(msg);
    }
});

io.on('connection', function(socket){
    // Create a router which we will use instead of `socket.io`'s built-in one.
    var router = new rpc.Router;

    // Tell the router to use API we created once for all routers.
    router.setApi(api);

    // Proxy messages using `proxy` event to our new router.
    router.send = function(obj) { socket.emit('proxy', obj); };
    socket.on('proxy', function(obj) { router.onmessage(obj); });
});
io.listen(9999);
```

On the client we just proxy all messages using `proxy` event to `rpc.Router` as well:

```js
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
```

You can find this example [here](./examples/socket.io).

## Developing

Getting started:

    npm run start

Testing:

    npm run test
    
Generate `nmsg-rpc.d.ts` typing file:

    npm run typing
    
Publishing:
    
    npm run mypublish
    
Create a distribution files in [./dist](./dist) folder:

    npm run dist
    
## License

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
