import {srouter, crouter} from './create_mock_sockets';


srouter.on('pick-hand', (callback) => {
    callback((cb) => {cb('white')}, (cb) => {cb('black')});
});

crouter.emit('pick-hand', (left, right) => {
    right((color) => {
        console.log(color);
    });
});
