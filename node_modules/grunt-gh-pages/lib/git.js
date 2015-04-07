var cp = require('child_process');
var path = require('path');
var util = require('util');

var Q = require('q');
var fs = require('q-io/fs');

var git = 'git';



/**
 * @constructor
 * @param {number} code Error code.
 * @param {string} message Error message.
 */
function ProcessError(code, message) {
  var callee = arguments.callee;
  Error.apply(this, [message]);
  Error.captureStackTrace(this, callee);
  this.code = code;
  this.message = message;
  this.name = callee.name;
}
util.inherits(ProcessError, Error);


/**
 * Execute a git command.
 * @param {Array.<string>} args Arguments (e.g. ['remote', 'update']).
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.  The promise will be resolved with the exit code
 *     or rejected with an error.  To get stdout, use a progress listener (e.g.
 *     `promise.progress(function(chunk) {console.log(String(chunk);}))`).
 */
exports = module.exports = function(args, cwd) {
  return spawn(git, args, cwd);
};


/**
 * Set the Git executable to be used by exported methods (defaults to 'git').
 * @param {string} exe Git executable (full path if not already on path).
 */
exports.exe = function(exe) {
  git = exe;
};


/**
 * Util function for handling spawned processes as promises.
 * @param {string} exe Executable.
 * @param {Array.<string>} args Arguments.
 * @param {string} cwd Working directory.
 * @return {Promise} A promise.
 */
function spawn(exe, args, cwd) {
  var deferred = Q.defer();
  var child = cp.spawn(exe, args, {cwd: cwd || process.cwd()});
  var buffer = [];
  child.stderr.on('data', function(chunk) {
    buffer.push(chunk.toString());
  });
  child.stdout.on('data', function(chunk) {
    deferred.notify(chunk);
  });
  child.on('close', function(code) {
    if (code) {
      var msg = buffer.join('') || 'Process failed: ' + code;
      deferred.reject(new ProcessError(code, msg));
    } else {
      deferred.resolve(code);
    }
  });
  return deferred.promise;
}


/**
 * Initialize repository.
 * @param {string} cwd Repository directory.
 * @return {ChildProcess} Child process.
 */
exports.init = function init(cwd) {
  return spawn(git, ['init'], cwd);
};


/**
 * Clone a repo into the given dir if it doesn't already exist.
 * @param {string} repo Repository URL.
 * @param {string} dir Target directory.
 * @param {string} branch Branch name.
 * @param {options} options All options.
 * @return {Promise} A promise.
 */
exports.clone = function clone(repo, dir, branch, options) {
  return fs.exists(dir).then(function(exists) {
    if (exists) {
      return Q.resolve();
    } else {
      return fs.makeTree(path.dirname(path.resolve(dir))).then(function() {
        var args = ['clone', repo, dir, '--branch', branch, '--single-branch'];
        if (options.depth) {
          args.push('--depth', options.depth);
        }
        return spawn(git, args).fail(function(err) {
          // try again without banch options
          return spawn(git, ['clone', repo, dir]);
        });
      });
    }
  });
};


/**
 * Clean up unversioned files.
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.
 */
var clean = exports.clean = function clean(cwd) {
  return spawn(git, ['clean', '-f', '-d'], cwd);
};


/**
 * Hard reset to remote/branch
 * @param {string} remote Remote alias.
 * @param {string} branch Branch name.
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.
 */
var reset = exports.reset = function reset(remote, branch, cwd) {
  return spawn(git, ['reset', '--hard', remote + '/' + branch], cwd);
};


/**
 * Fetch from a remote.
 * @param {string} remote Remote alias.
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.
 */
exports.fetch = function fetch(remote, cwd) {
  return spawn(git, ['fetch', remote], cwd);
};


/**
 * Checkout a branch (create an orphan if it doesn't exist on the remote).
 * @param {string} remote Remote alias.
 * @param {string} branch Branch name.
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.
 */
exports.checkout = function checkout(remote, branch, cwd) {
  var treeish = remote + '/' + branch;
  return spawn(git, ['ls-remote', '--exit-code', '.', treeish], cwd)
      .then(function() {
        // branch exists on remote, hard reset
        return spawn(git, ['checkout', branch], cwd)
            .then(function() {
              return clean(cwd);
            })
            .then(function() {
              return reset(remote, branch, cwd);
            });
      }, function(error) {
        if (error instanceof ProcessError && error.code === 2) {
          // branch doesn't exist, create an orphan
          return spawn(git, ['checkout', '--orphan', branch], cwd);
        } else {
          // unhandled error
          return Q.reject(error);
        }
      });
};


/**
 * Remove all unversioned files.
 * @param {string} files Files argument.
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.
 */
exports.rm = function rm(files, cwd) {
  return spawn(git, ['rm', '--ignore-unmatch', '-r', '-f', files], cwd);
};


/**
 * Add files.
 * @param {string} files Files argument.
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.
 */
exports.add = function add(files, cwd) {
  return spawn(git, ['add', files], cwd);
};


/**
 * Commit.
 * @param {string} message Commit message.
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.
 */
exports.commit = function commit(message, cwd) {
  return spawn(git, ['diff-index', '--quiet', 'HEAD', '.'], cwd)
      .then(function() {
        // nothing to commit
        return Q.resolve();
      })
      .fail(function() {
        return spawn(git, ['commit', '-m', message], cwd);
      });
};


/**
 * Add tag
 * @param {string} tag Name of tag.
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.
 */
exports.tag = function tag(tag, cwd) {
  return spawn(git, ['tag', tag], cwd);
};


/**
 * Push a branch.
 * @param {string} remote Remote alias.
 * @param {string} branch Branch name.
 * @param {string} cwd Repository directory.
 * @return {Promise} A promise.
 */
exports.push = function push(remote, branch, cwd) {
  return spawn(git, ['push', '--tags', remote, branch], cwd);
};
