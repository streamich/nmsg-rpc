import * as rpc from '../rpc';
import {srouter, crouter} from './create_mock_sockets';


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

srouter.setApi(api);
crouter.emit('test');
crouter.emit('more');
crouter.emit('trololo');
