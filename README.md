# RPC (Remote Procedure Calls) for Node.js Messengers

This module has been extracted from [nmsg](http://npmjs.com/packages/nmsg)
as a generic RPC router for any bi-directional messenger to create event-based routing.

Supports sending multiple callbacks as arguments, where callbacks can be
nested arbitrarily deep.

Use with your `SockJS`, `socket.io` and other bi-directional messaging 
sockets to create event based routing. This package has no dependencies.

Can be used with any socket that implements bi-directional communication like:

```ts
interface ISocket {
    onmessage: (msg: any) => void;
    send(msg: any);
}
```

Below is an example, let's say you have a server and a client that both have
`.send(msg: any)` method and `.onmessage: (msg: any) => void` event callback property,
that you can use to communicate like follows:

```ts
class Socket implements ISocket {
    connectedToSocket: Socket = null;
    onmessage: (msg: any) => void;
    send(msg: any) {
        this.connectedToSocket.onmessage(msg);
    }
}

var server = new Socket;
var client = new Socket;
server.connectedToSocket = client;
client.connectedToSocket = server;

client.onmessage = (msg) => {
    console.log('Client received:', msg)
};
server.send('Simple message');
// Client received: Simple message
```

Now you can wrap those into `rpc.Router` to create event-based API and add
ability to send *callbacks* as arguments:

```ts
import * as rpc from 'nmsg-rpc';

var server_router = new rpc.Router(server);
var client_router = new rpc.Router(client);

server_router
    .on('hello', () => {
        console.log('Hello World');
    })
    .on('ping', (callback) => {
        callback('pong');
    });

client_router.emit('hello');
client_router.emit('ping', (result) => {
    console.log(`ping > ${result}`);
});
// Hello World
// ping > pong
```

Creating a router:

```ts
var router = new rpc.RouterBuffered; // or rpc.Router
router.send = (msg) => { socket.send(msg); }
socket.onmessage = (msg) => { router.onmessage(msg); };

// Or simply:
var router = new rpc.RouterBuffered(socket);
```

## `rpc.RouterBuffered`

`rpc.RouterBuffered` is almost the same as `rpc.Router` except it buffers all outgoing `.emit()` calls
for 5 milliseconds and then combines them into one bulk request and flushes it, thus combining many small calls into one bigger request.

## `rpc.Api`

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
    
var router = new rpc.Router(socket);
router.setApi(api);
```

*TypeScript* type definitions available in [./nmsg-rpc.d.ts](./nmsg-rpc.d.ts).

## Examples

At only 344 lines of code (as of this writing) and no external dependencies, `nmsg-rpc` is lightweight
enough for you to use in almost any project.

Originally, `nmsg-rpc` is part of the [`nmsg`](http://npmjs.com/package/nmsg) project but it is so useful
on its own that we have carved it out into a standalone package.

Below we will take a look how `nmsg-rpc` can be used to improve communication
for the following JS services:

 - Talking with web `Worker`
 - Talking with `<iframe/>` or other windows using `.postMessage()`
 - `window.localStorage` as communication channel between browser tabs
 - SockJS
 - `process.send()`
 - socket.io
 - Websocket
 
 See [./examples](./examples) folder for all the examples.
 
 
### Talking with web `Worker`

Web [`Worker`](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker) allows you
to do computations in browser on a separate thread. It exposes `.postMessage()` method
and `.onmessage` function property you can use to communicate with your `Worker`.

Here we use those to create `rpc.Router` for bi-directional event-based communication with callbacks.

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
way your messages are sent out of order and you have to keep track of the somehow to, for example,
create a request/response functionality, we use `rpc.Router` to solve this for use.

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

Note that this is just an example for illustration purposes, as there are plenty of 
other things to consider with `<iframe>`s. For example, all windows can send messages
to all other, so the example will work if you have only those two windows. Also, when dealing
`window.postMessage()` you must check the origin of the messages for security purposes, as any
window can send messages to your script. See the [this example](./examples/iframe).

### Intercom for browser tabs using `window.localStorage`

This is not a working solution, just a sample to show the general idea.

```js
var router = new nmsg.rpc.Router;
router.send = function(obj) { localStorage.tab2 = JSON.stringify(obj); };

setInterval(function() {
    var obj = localStorage.tab1;
    if(obj) router.onmessage(JSON.parse(obj));
}, 100);

router.emit('Hello there', function(response) {
    console.log(response); // Hello back
});
```


## Developing

Getting started:

    npm run start

Testing:

    npm run test
    
Generate `nmsg-rpc.d.ts` typing file:

    npm run typing
    
Publishing:
    
    npm publish
    
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
