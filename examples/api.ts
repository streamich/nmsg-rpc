import * as rpc from '../src/rpc';
import {server, client} from './create_mock_sockets';


var api = new rpc.Api()
    .add({
        test: function () {
            console.log('test');
        },
        more: function () {
            console.log('more');
        },
    })
    .add({
        trololo: function () {
            console.log('trololo');
        },
    });

var srouter = new rpc.Router(server);
var crouter = new rpc.Router(client);
srouter.setApi(api);
crouter.emit('test');
crouter.emit('more');
crouter.emit('trololo');
