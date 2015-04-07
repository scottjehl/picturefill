var fs = require('fs');
var path = require('path');

var helper = require('./helper');

var assert = helper.assert;

describe('dotfiles-option', function() {
  var fixture, repo;

  before(function(done) {
    this.timeout(3000);
    helper.buildFixture('dotfiles-option', function(error, dir) {
      if (error) {
        return done(error);
      }
      fixture = dir;
      repo = path.join(fixture, '.grunt/grunt-gh-pages/gh-pages/src');
      done();
    });
  });

  after(function(done) {
    helper.afterFixture(fixture, done);
  });

  it('creates .grunt/grunt-gh-pages/gh-pages/src directory', function(done) {
    fs.stat(repo, function(error, stats) {
      assert.isTrue(!error, 'no error');
      assert.isTrue(stats.isDirectory(), 'directory');
      done(error);
    });
  });

  it('creates a gh-pages branch', function(done) {
    var branch;
    helper.git(['rev-parse', '--abbrev-ref', 'HEAD'], repo)
        .progress(function(chunk) {
          branch = String(chunk);
        })
        .then(function() {
          assert.strictEqual(branch, 'gh-pages\n', 'branch created');
          done();
        })
        .fail(done);
  });

  it('pushes the gh-pages branch to remote', function(done) {
    helper.git(['ls-remote', '--exit-code', '.', 'origin/gh-pages'], repo)
        .then(function() {
          done();
        })
        .fail(done);
  });

  it('copies files with dots', function(done) {
    fs.exists(path.join(repo, '.one'), function(exists) {
      if (!exists) {
        done(new Error('Failed to find ".one" in repo: ') + repo);
      } else {
        done();
      }
    });
  });

  it('copies files in directories with dots', function(done) {
    fs.exists(path.join(repo, 'foo', '.bar', 'two'), function(exists) {
      if (!exists) {
        done(new Error('Failed to find "foo/.bar/two" in repo: ') + repo);
      } else {
        done();
      }
    });
  });

});
