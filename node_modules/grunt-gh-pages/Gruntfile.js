

/**
 * @param {Object} grunt Grunt.
 */
module.exports = function(grunt) {

  var tasksSrc = 'tasks/**/*.js';
  var testSrc = 'test/**/*.js';
  var fixturesSrc = 'test/fixtures/**/*.js';

  grunt.initConfig({
    cafemocha: {
      options: {
        reporter: 'spec'
      },
      all: {
        src: testSrc,
        newer: true
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      tasks: {
        src: tasksSrc
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: testSrc,
        newer: true
      },
      fixtures: {
        src: fixturesSrc
      }
    },
    watch: {
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['jshint:gruntfile']
      },
      tasks: {
        files: tasksSrc,
        tasks: ['jshint:tasks', 'cafemocha']
      },
      test: {
        files: testSrc,
        tasks: ['jshint:test', 'cafemocha']
      },
      fixtures: {
        files: fixturesSrc,
        tasks: ['jshint:fixtures', 'cafemocha']
      }
    }
  });

  grunt.loadNpmTasks('grunt-cafe-mocha');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['jshint', 'cafemocha']);

  grunt.registerTask('default', ['test']);

};
