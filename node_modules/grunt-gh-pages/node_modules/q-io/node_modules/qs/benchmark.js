
var old = require('querystring')
  , qs = require('./')
  , times = 100000;

var start = new Date
  , n = times;

while (n--) old.parse('foo=bar');
console.log('old simple: %dms', new Date - start);

var start = new Date
  , n = times;

while (n--) old.parse('user[name][first]=tj&user[name][last]=holowaychuk');
console.log('old nested: %dms', new Date - start);


console.log();


var start = new Date
  , n = times;

while (n--) qs.parse('foo=bar');
console.log('new simple: %dms', new Date - start);

var start = new Date
  , n = times;

while (n--) qs.parse('user[name][first]=tj&user[name][last]=holowaychuk');
console.log('new nested: %dms', new Date - start);