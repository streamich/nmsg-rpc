import * as rpc from '../src/rpc';
import {client, server, srouter, crouter} from './create_mock_sockets';


srouter
    .on('hello', () => {
        console.log('Hello World');
    })
    .on('ping', (callback) => {
        callback('pong');
    });

crouter.emit('hello');
crouter.emit('ping', (result) => {
    console.log(`ping > ${result}`);
});
