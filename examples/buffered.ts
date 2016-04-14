import * as rpc from '../src/rpc';
import {server, client} from './create_mock_sockets';


new rpc.RouterBuffered(server).on('ping', () => {
    console.log('ping');
});

new rpc.RouterBuffered(client).emit('ping');
