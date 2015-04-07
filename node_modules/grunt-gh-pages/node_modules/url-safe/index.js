'use strict'

var url = require('url')

module.exports = function(input, replace) {
  var auth = url.parse(input).auth
  if (!auth) return input
  if (replace) return input.replace(auth+'@', replace+'@')
  return input.replace(auth+'@', '')
}
