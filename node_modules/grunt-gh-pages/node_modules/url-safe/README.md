# url-safe
[![Build Status](https://travis-ci.org/boennemann/url-safe.svg)](https://travis-ci.org/boennemann/url-safe)
[![Dependency Status](https://david-dm.org/boennemann/url-safe.svg)](https://david-dm.org/boennemann/url-safe)
[![devDependency Status](https://david-dm.org/boennemann/url-safe/dev-status.svg)](https://david-dm.org/boennemann/url-safe#info=devDependencies)
[![npm version](https://badge.fury.io/js/url-safe.svg)](http://badge.fury.io/js/url-safe)

`npm i -S url-safe`

```js
var s = require('url-safe')

console.log(s('http://user:pass@example.com'))
// http://example.com

console.log(s('http://user:pass@example.com'), '***')
// http://***@example.com
```
