// var rpc = require('../rpc');
var rpc = require('../rpc');


var obj = {
    i: 1,
    e: 'set',
    a: ['some_key', "asdofm very long valdu", {isTTL: true, insert: 'yeah'}],
    c: [3],
    rid: 0
};

var arr = [1, 'set', ['some_key', "asdofm very long valdu", {isTTL: true, insert: 'yeah'}], [3], 0];



var iter = 10000000;


// var nobj;
// var time = +new Date();
// for(var i = 0; i < iter; i++) {
//     nobj = {};
//     for(var key in obj) nobj[key] = obj[key];
// }
// console.log(+new Date() - time);
//
//
// var narr;
// time = +new Date();
// for(var i = 0; i < iter; i++) {
//     narr = [];
//     for(var j = 0; j < arr.length; j++) narr.push(arr[j]);
// }
// console.log(+new Date() - time);



var frame = new rpc.FrameOutgoing;
frame.event = 'testing';
frame.args = ['hello', 12323, 'more stufff', function() {}];

var time = +new Date();
for(var i = 0; i < iter; i++) {
    var s = frame.serialize();
    // console.log(s);
    var f2 = new rpc.FrameIncoming();
    var a = f2.unserialize(s, function() { return function() {}; });
    // console.log(f2);
    // console.log(s);
}
console.log(+new Date() - time);

