var path = require('path');

var tmp = require('tmp');

var git = require('../../../lib/git');


/** @param {Object} grunt Grunt. */
module.exports = function(grunt) {

  grunt.initConfig({
    'gh-pages': {
      options: {
        user: {
          name: 'My Name',
          email: 'mail@example.com'
        }
      },
      first: {
        options: {
          base: 'first'
        },
        src: '**/*'
      },
      // we want this target to add new files and not remove existing ones
      second: {
        options: {
          base: 'second',
          add: true
        },
        src: '**/*'
      }
    }
  });

  grunt.loadTasks('../../../tasks');

  grunt.registerTask('init', function() {
    var done = this.async();
    tmp.dir(function(error, remote) {
      if (error) {
        return done(error);
      }
      git(['init', '--bare'], remote)
          .then(function() {
            return git.init(__dirname);
          })
          .then(function() {
            return git.add('Gruntfile.js', __dirname);
          })
          .then(function() {
            return git(['config', 'user.email', 'mail@example.com'], __dirname);
          })
          .then(function() {
            return git(['config', 'user.name', 'My Name'], __dirname);
          })
          .then(function() {
            return git.commit('Initial commit', __dirname);
          })
          .then(function() {
            return git(['remote', 'add', 'origin', remote], __dirname);
          })
          .then(function() {
            return git(['push', 'origin', 'master'], __dirname);
          })
          .then(done, done);
    });

  });

  grunt.registerTask('default', ['init', 'gh-pages:first', 'gh-pages:second']);

};
