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
var router = new rpc.Router.Buffered; // or rpc.Router
router.send = (msg) => { socket.send(msg); }
socket.onmessage = (msg) => { router.onmessage(msg); };

// Or simply:
var router = new rpc.Router.Buffered(socket);
```

## `rpc.Router.Buffered`

`rpc.Router.Buffered` is almost the same as `rpc.Router` except it buffers all outgoing `.emit()` calls
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

See [./examples](./examples) folder.

## Developing

Getting started:

    npm run start

Testing

    npm run test
    
Generate `nmsg-rpc.d.ts` typing file:

    npm run typing
    
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
