import * as rpc from '../src/rpc';
import {server, client} from './create_mock_sockets';

var srouter = new rpc.Router(server);
var crouter = new rpc.Router(client);

srouter.on('*', (event, arg) => {
    console.log({event: event, arg: arg});
});

crouter.emit('event1', 'data1');
crouter.emit('event2', 'data2');
