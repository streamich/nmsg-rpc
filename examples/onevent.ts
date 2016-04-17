import {srouter, crouter} from './create_mock_sockets';


srouter.onevent = (event, args) => {
    console.log('onevent', event, args);
};

crouter.emit('event1', 'data1', 1, 2, 3);
crouter.emit('event2', 'data2');
