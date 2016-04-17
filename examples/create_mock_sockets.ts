import * as rpc from '../rpc';

class Socket implements rpc.ISocket {
    connectedToSocket: Socket = null;
    onmessage: (msg: any) => void;
    send(msg: any) {
        this.connectedToSocket.onmessage(msg);
    }
}

export var server = new Socket;
export var client = new Socket;
server.connectedToSocket = client;
client.connectedToSocket = server;


export var srouter = new rpc.Router;
export var crouter = new rpc.Router;

server.onmessage = (obj) => { srouter.onmessage(obj); };
client.onmessage = (obj) => { crouter.onmessage(obj); };

srouter.send = (obj) => { server.send(obj); };
crouter.send = (obj) => { client.send(obj); };
