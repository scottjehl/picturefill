Changelog
=========

0.3.11
-----
  * Fix bug with inner timer in `delay` method [#45](https://github.com/dfilatov/jspromise/issues/45)

0.3.10
-----
  * Use `setImmediate` instead of `process.nextTick` in Node.js >= 0.10.x [#40](https://github.com/dfilatov/jspromise/issues/40)
  * Up Promises/A+ Compliance Test Suite to 1.3.2

0.3.9
-----
  * Fix for propagation of progress state [#37](https://github.com/dfilatov/jspromise/issues/37)

0.3.8
-----
  * Fix for ignoring callback's context in always method [#35](https://github.com/dfilatov/jspromise/issues/35)
  * Callback in `Vow.invoke` called in global context now
  * bower.json added [#34](https://github.com/dfilatov/jspromise/issues/34)

0.3.7
-----
  * `Vow.allPatiently` method added [#32](https://github.com/dfilatov/jspromise/issues/32)
  
0.3.6
-----
  * Fix for properly work in mocha/phantomjs environment [#31](https://github.com/dfilatov/jspromise/issues/31)

0.3.5
-----
  * Fix for synchronize `onProgress` callback in `promise.sync` method [#30](https://github.com/dfilatov/jspromise/issues/30)

0.3.4
-----
  * Add ability to use multiple modules system simultaneously [#26](https://github.com/dfilatov/jspromise/issues/26)
  * Add callbacks to `promise.done` method [#29](https://github.com/dfilatov/jspromise/issues/29)
  
0.3.3
-----
  * Use `Vow` instead `this` in all static methods
  * Speed up optimizations
  
0.3.2
-----
  * Ability to specify context for callbacks [#28](https://github.com/dfilatov/jspromise/issues/28)

0.3.1
-----
  * Add support for [ym module's system](https://github.com/ymaps/modules) [#24](https://github.com/dfilatov/jspromise/issues/24)
  
0.3.0
-----
  * Add support for `progress/notify` [#23](https://github.com/dfilatov/jspromise/issues/23)

0.2.6
-----
  * `promise.always` doesn't pass the return value of `onResolved` [#19](https://github.com/dfilatov/jspromise/issues/19)
