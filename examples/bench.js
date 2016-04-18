

var obj = {
    i: 1,
    e: 'set',
    a: ['some_key', "asdofm very long valdu", {isTTL: true, insert: 'yeah'}],
    c: [3],
    rid: 0
};

var arr = [1, 'set', ['some_key', "asdofm very long valdu", {isTTL: true, insert: 'yeah'}], [3], 0];



var iter = 1000000;


var nobj;
var time = +new Date();
for(var i = 0; i < iter; i++) {
    nobj = {};
    for(var key in obj) nobj[key] = obj[key];
}
console.log(+new Date() - time);



var narr;
time = +new Date();
for(var i = 0; i < iter; i++) {
    narr = [];
    for(var j = 0; j < arr.length; j++) narr.push(arr[j]);
}
console.log(+new Date() - time);

