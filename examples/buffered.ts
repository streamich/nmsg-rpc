import * as rpc from '../rpc';
import {server, client} from './create_mock_sockets';


var bs = new rpc.RouterBuffered;
server.onmessage = (obj) => { bs.onmessage(obj); };
bs.send = (obj) => { server.send(obj); };

var bc = new rpc.RouterBuffered;
client.onmessage = (obj) => { bc.onmessage(obj); };
bc.send = (obj) => { client.send(obj); };

bs.on('ping', () => {
    console.log('ping');
});

bc.emit('ping');
