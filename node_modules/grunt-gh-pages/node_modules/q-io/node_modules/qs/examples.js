
/**
 * Module dependencies.
 */

var qs = require('./');

var obj = qs.parse('foo');
require('inspect')(obj)

var obj = qs.parse('foo=bar=baz');
require('inspect')(obj)

var obj = qs.parse('users[]');
require('inspect')(obj)

var obj = qs.parse('name=tj&email=tj@vision-media.ca');
require('inspect')(obj)

var obj = qs.parse('users[]=tj&users[]=tobi&users[]=jane');
require('inspect')(obj)

var obj = qs.parse('user[name][first]=tj&user[name][last]=holowaychuk');
require('inspect')(obj)

var obj = qs.parse('users[][name][first]=tj&users[][name][last]=holowaychuk');
require('inspect')(obj)

var obj = qs.parse('a=a&a=b&a=c');
require('inspect')(obj)

var obj = qs.parse('user[tj]=tj&user[tj]=TJ');
require('inspect')(obj)

var obj = qs.parse('user[names]=tj&user[names]=TJ&user[names]=Tyler');
require('inspect')(obj)

var obj = qs.parse('user[name][first]=tj&user[name][first]=TJ');
require('inspect')(obj)