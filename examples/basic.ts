import * as rpc from '../src/rpc';
import {server, client} from './create_mock_sockets';


client.onmessage = (msg) => {
    console.log('Client received:', msg)
};
server.send('Hello World!');


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
