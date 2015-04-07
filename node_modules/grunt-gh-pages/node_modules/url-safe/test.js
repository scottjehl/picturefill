'use strict'

var test = require('tape')
var s = require('./')

test('returns safe url', function (t) {
  t.plan(7)

  t.equal(
    s('https://foo:bar@example.com'),
    'https://example.com'
  )

  t.equal(
    s('http://foo@example.com'),
    'http://example.com'
  )

  t.equal(
    s('http://example.com'),
    'http://example.com'
  )

  t.equal(
    s('example'),
    'example'
  )

  t.equal(
    s('http://test@example.com/test@123'),
    'http://example.com/test@123'
  )

  t.throws(s)

  t.throws(s.bind(null, {}))
})

test('replaces auth with string', function (t) {
  t.plan(2)

  t.equal(
    s('https://foo:bar@example.com', '***'),
    'https://***@example.com'
  )

  t.equal(
    s('https://http@example.com', '***'),
    'https://***@example.com'
  )
})
