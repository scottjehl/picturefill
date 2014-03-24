/*global module:true*/
(function(){
  'use strict';

  module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      // Metadata.
      pkg: grunt.file.readJSON('picturefill.json'),
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
      // Task configuration.
      clean: {
        files: ['dist']
      },
      concat: {
        options: {
          banner: '<%= banner %>',
          stripBanners: true
        },
        dist: {
          src: ['src/external/matchmedia.js', 'src/picturefill.js'],
          dest: 'dist/picturefill.js'
        }
      },
      uglify: {
        options: {
          banner: '<%= banner %>'
        },
        dist: {
          src: ['<%= concat.dist.src %>'],
          dest: 'dist/picturefill.min.js'
        }
      },
      qunit: {
        files: ['tests/**/*.html']
      },
      jshint: {
        all: {
          options: {
              "curly": true,
              "eqeqeq": true,
              "immed": true,
              "latedef": true,
              "newcap": true,
              "noarg": true,
              "sub": true,
              "undef": true,
              "unused": true,
              "boss": true,
              "eqnull": true,
              "node": true
          },
          src: ['Gruntfile.js', 'src/*.js']
        }
      },
      watch: {
        gruntfile: {
          files: '<%= jshint.gruntfile.src %>',
          tasks: ['jshint:gruntfile']
        },
        src: {
          files: '<%= jshint.src.src %>',
          tasks: ['jshint:src', 'qunit']
        },
        test: {
          files: '<%= jshint.test.src %>',
          tasks: ['jshint:test', 'qunit']
        }
      }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task.
    grunt.registerTask('default', ['jshint', 'qunit', 'clean', 'concat', 'uglify']);

  };
})();