/*global module:true*/
(function() {
  "use strict";

  var pkg;

  module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      // Metadata.
      pkg: pkg = grunt.file.readJSON("picturefill.json"),
      banner: "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " +
        "<%= grunt.template.today('yyyy-mm-dd') %>\n" +
        "<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>" +
        "* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>;" +
        " Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n",
      // Task configuration.
      clean: {
        files: [ "dist" ]
      },
      concat: {
        options: {
          banner: "<%= banner %>",
          stripBanners: true
        },
        dist: {
          src: [ "src/external/matchmedia.js", "src/picturefill.js" ],
          dest: "dist/picturefill.js"
        }
      },
      uglify: {
        options: {
          banner: "<%= banner %>"
        },
        dist: {
          src: [ "<%= concat.dist.src %>" ],
          dest: "dist/picturefill.min.js"
        }
      },
      qunit: {
        files: [ "tests/**/*.html" ]
      },
      jshint: {
        all: {
          options: {
            jshintrc: true
          },
          src: [ "Gruntfile.js", "src/*.js", "tests/*.js" ]
        }
      },
      jscs: {
        all: {
          src: "<%= jshint.all.src %>"
        }
      },
      watch: {
        gruntfile: {
          files: [ "Gruntfile.js", "src/*.js", "tests/*.js" ],
          tasks: [ "default" ]
        }
      }
    });

    // because the compress plugin is insane
    grunt.task.registerTask( "compress", "compress the dist folder", function() {
      var childProc = require("child_process");
      var done = this.async();

      childProc.exec( "zip -r dist-" + pkg.version + ".zip dist", function() {
        done();
      });
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-jscs-checker");

    // Default task.
    grunt.registerTask("default", [ "test", "clean", "concat", "uglify" ]);
    grunt.registerTask("test", [ "jscs", "jshint", "qunit" ]);
  };
})();
