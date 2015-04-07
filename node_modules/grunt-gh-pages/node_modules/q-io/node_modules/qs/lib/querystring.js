
/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.1.0';

/**
 * Parse the given query `str`, returning an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str) {
  if (str == undefined || str == '') return {};

  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      var pair = decodeURIComponent(pair.replace(/\+/g, ' '))
        , eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length)
        , obj = ret;

      // ?foo
      if ('' == key) key = pair, val = '';

      // nested
      if (~key.indexOf(']')) {
        var parts = key.split('[')
          , len = parts.length
          , last = len - 1;

        function parse(obj, parts, parent, key) {
          var part = parts.shift();

          // end
          if (!part) {
            if (Array.isArray(parent[key])) {
              parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
              parent[key] = val;
            } else {
              parent[key] = [parent[key], val];
            }
          // array
          } else if (']' == part) {
            obj = parent[key] = Array.isArray(parent[key])
              ? parent[key]
              : [];
            if ('' != val) obj.push(val);
          // prop
          } else if (~part.indexOf(']')) {
            part = part.substr(0, part.length - 1);
            parse(obj[part] = obj[part] || {}, parts, obj, part);
          // key
          } else {
            parse(obj[part] = obj[part] || {}, parts, obj, part);
          }
        }

        parse(obj, parts);
      // optimize
      } else {
        set(obj, key, val);
      }

      return ret;
    }, {});
};

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (Array.isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}
