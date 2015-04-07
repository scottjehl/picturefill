/*
 * grunt-lib-phantomjs
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'lib/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    test: {
      basic: {
        options: {
          url: 'test/fixtures/basic.html',
          expected: [1, 2, 3, 4, 5, 6],
          test: function test(a, b, c) {
            if (!test.actual) { test.actual = []; }
            test.actual.push(a, b, c);
          }
        }
      },
      inject: {
        options: {
          url: 'test/fixtures/inject.html',
          inject: require('path').resolve('test/fixtures/inject.js'),
          expected: 'injected',
          test: function test(msg) {
            test.actual = msg;
          }
        }
      },
    },
  });

  // The most basic of tests. Not even remotely comprehensive.
  grunt.registerMultiTask('test', 'A test, of sorts.', function() {
    var options = this.options();
    var phantomjs = require('./lib/phantomjs').init(grunt);

    // Do something.
    phantomjs.on('test', options.test);
    phantomjs.on('done', phantomjs.halt);

    // Built-in error handlers.
    phantomjs.on('fail.load', function(url) {
      phantomjs.halt();
      grunt.verbose.write('Running PhantomJS...').or.write('...');
      grunt.log.error();
      grunt.warn('PhantomJS unable to load "' + url + '" URI.');
    });

    phantomjs.on('fail.timeout', function() {
      phantomjs.halt();
      grunt.log.writeln();
      grunt.warn('PhantomJS timed out.');
    });

    // This task is async.
    var done = this.async();

    // Spawn phantomjs
    phantomjs.spawn(options.url, {
      // Additional PhantomJS options.
      options: options,
      // Complete the task when done.
      done: function(err) {
        if (err) { done(err); return; }
        var assert = require('assert');
        var difflet = require('difflet')({indent: 2, comment: true});
        try {
          assert.deepEqual(options.test.actual, options.expected, 'Actual should match expected.');
          grunt.log.writeln('Test passed.');
          done();
        } catch (err) {
          grunt.log.subhead('Assertion Failure');
          console.log(difflet.compare(err.expected, err.actual));
          done(err);
        }
      }
    });
  });

  // The jshint plugin is used for linting.
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // By default, lint library.
  grunt.registerTask('default', ['jshint', 'test']);

};
