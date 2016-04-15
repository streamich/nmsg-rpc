import {srouter, crouter} from './create_mock_sockets';


srouter.on('*', (event, arg) => {
    console.log({event: event, arg: arg});
});

crouter.emit('event1', 'data1');
crouter.emit('event2', 'data2');
