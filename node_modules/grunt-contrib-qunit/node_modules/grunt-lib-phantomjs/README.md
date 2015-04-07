# grunt-lib-phantomjs

> Grunt and PhantomJS, sitting in a tree.

## Usage

The best way to understand how this lib should be used is by looking at the [grunt-contrib-qunit](https://github.com/gruntjs/grunt-contrib-qunit) plugin. Mainly, look at how [the lib is required](https://github.com/gruntjs/grunt-contrib-qunit/blob/master/tasks/qunit.js#L17), how [event handlers are bound](https://github.com/gruntjs/grunt-contrib-qunit/blob/master/tasks/qunit.js#L51-L128) and how [PhantomJS is actually spawned](https://github.com/gruntjs/grunt-contrib-qunit/blob/master/tasks/qunit.js#L160-L173).

Also, in the case of the grunt-contrib-qunit plugin, it's important to know that the page being loaded into PhantomJS *doesn't* know it will be loaded into PhantomJS, and as such doesn't have any PhantomJS->Grunt code in it. That communication code, aka. the ["bridge"](https://github.com/gruntjs/grunt-contrib-qunit/blob/master/phantomjs/bridge.js), is dynamically [injected into the html page](https://github.com/gruntjs/grunt-contrib-qunit/blob/master/tasks/qunit.js#L136).

## An inline example

If a Grunt task looked something like this:

```js
grunt.registerTask('mytask', 'Integrate with phantomjs.', function() {
  var phantomjs = require('grunt-lib-phantomjs').init(grunt);
  var errorCount = 0;

  // Handle any number of namespaced events like so.
  phantomjs.on('mytask.ok', function(msg) {
    grunt.log.writeln(msg);
  });

  phantomjs.on('mytask.error', function(msg) {
    errorCount++;
    grunt.log.error(msg);
  });

  // Create some kind of "all done" event.
  phantomjs.on('mytask.done', function() {
    phantomjs.halt();
  });

  // Built-in error handlers.
  phantomjs.on('fail.load', function(url) {
    phantomjs.halt();
    grunt.warn('PhantomJS unable to load URL.');
  });

  phantomjs.on('fail.timeout', function() {
    phantomjs.halt();
    grunt.warn('PhantomJS timed out.');
  });

  // This task is async.
  var done = this.async();

  // Spawn phantomjs
  phantomjs.spawn('test.html', {
    // Additional PhantomJS options.
    options: {},
    // Complete the task when done.
    done: function(err) {
      done(err || errorCount === 0);
    }
  });

});
```

And `test.html` looked something like this (note the "bridge" is hard-coded into this page and not injected):

```html
<!doctype html>
<html>
<head>
<script>

// Send messages to the parent PhantomJS process via alert! Good times!!
function sendMessage() {
  var args = [].slice.call(arguments);
  alert(JSON.stringify(args));
}

sendMessage('mytask.ok', 'Something worked.');
sendMessage('mytask.error', 'Something failed.');
sendMessage('mytask.done');

</script>
</head>
<body>
</body>
</html>
```

Then running Grunt would behave something like this:

```shell
$ grunt mytask
Running "mytask" task
Something worked.
>> Something failed.
Warning: Task "mytask" failed. Use --force to continue.

Aborted due to warnings.
```

## Release History

* 2013-02-28 - v0.3.0 - Use PhantomJS 1.9.0-1.
* 2013-02-28 - v0.2.0 - Use PhantomJS 1.8.1.
* 2012-12-21 - v0.1.0 - Use PhantomJS 1.7.0.
