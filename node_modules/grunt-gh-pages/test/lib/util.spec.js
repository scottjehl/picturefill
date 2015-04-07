var path = require('path');

var assert = require('../helper').assert;

var util = require('../../lib/util');

describe('util', function() {

  var files;
  beforeEach(function() {
    files = [
      path.join('a1', 'b1', 'c2', 'd2.txt'),
      path.join('a1', 'b2', 'c2', 'd1.txt'),
      path.join('a2.txt'),
      path.join('a1', 'b1', 'c1', 'd1.txt'),
      path.join('a1', 'b1', 'c2', 'd1.txt'),
      path.join('a1', 'b1.txt'),
      path.join('a2', 'b1', 'c2.txt'),
      path.join('a1', 'b1', 'c2', 'd3.txt'),
      path.join('a1', 'b2', 'c1', 'd1.txt'),
      path.join('a1.txt'),
      path.join('a2', 'b1', 'c1.txt'),
      path.join('a2', 'b1.txt')
    ].slice();
  });

  describe('byShortPath', function() {
    it('sorts an array of filepaths, shortest first', function() {
      files.sort(util.byShortPath);

      var expected = [
        path.join('a1.txt'),
        path.join('a2.txt'),
        path.join('a1', 'b1.txt'),
        path.join('a2', 'b1.txt'),
        path.join('a2', 'b1', 'c1.txt'),
        path.join('a2', 'b1', 'c2.txt'),
        path.join('a1', 'b1', 'c1', 'd1.txt'),
        path.join('a1', 'b1', 'c2', 'd1.txt'),
        path.join('a1', 'b1', 'c2', 'd2.txt'),
        path.join('a1', 'b1', 'c2', 'd3.txt'),
        path.join('a1', 'b2', 'c1', 'd1.txt'),
        path.join('a1', 'b2', 'c2', 'd1.txt')
      ];

      assert.deepEqual(files, expected);
    });
  });

  describe('uniqueDirs', function() {

    it('gets a list of unique directory paths', function() {
      // not comparing order here, so we sort both
      var got = util.uniqueDirs(files).sort();

      var expected = [
        '.',
        'a1',
        'a2',
        path.join('a1', 'b1'),
        path.join('a1', 'b1', 'c1'),
        path.join('a1', 'b1', 'c2'),
        path.join('a1', 'b2'),
        path.join('a1', 'b2', 'c1'),
        path.join('a1', 'b2', 'c2'),
        path.join('a2', 'b1')
      ].sort();

      assert.deepEqual(got, expected);
    });

  });

  describe('dirsToCreate', function() {

    it('gets a sorted list of directories to create', function() {
      var got = util.dirsToCreate(files);

      var expected = [
        '.',
        'a1',
        'a2',
        path.join('a1', 'b1'),
        path.join('a1', 'b2'),
        path.join('a2', 'b1'),
        path.join('a1', 'b1', 'c1'),
        path.join('a1', 'b1', 'c2'),
        path.join('a1', 'b2', 'c1'),
        path.join('a1', 'b2', 'c2')
      ];

      assert.deepEqual(got, expected);
    });

  });

});
