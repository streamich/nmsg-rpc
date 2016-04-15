import {srouter, crouter} from './create_mock_sockets';


srouter.on('ping', (callback) => {
    callback('pong');
});

crouter.emit('ping', (res) => {
    console.log(res);
});
