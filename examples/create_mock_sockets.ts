import * as rpc from '../src/rpc';

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
