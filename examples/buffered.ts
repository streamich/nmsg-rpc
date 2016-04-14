import * as rpc from '../src/rpc';
import {server, client} from './create_mock_sockets';


new rpc.Router.Buffered(server).on('ping', () => {
    console.log('ping');
});

new rpc.Router.Buffered(client).emit('ping');
