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
      copy: {
        plugins: {
          files: [
              {
                expand: true,
                cwd: "src/plugins/",
                src: [ "**", "!gecko-picture/*" ],
                dest: "dist/plugins/",
                filter: "isFile"
              }
          ],
        },
      },
      concat: {

        dist: {
          options: {
            banner: "<%= banner %>",
            stripBanners: true
          },
          src: [ "src/plugins/gecko-picture/pf.gecko-picture.js", "src/picturefill.js" ],
          dest: "dist/picturefill.js"
        }
      },
      uglify: {
        options: {
          banner: "<%= banner %>"
        },
        dist: {
          files: [
              {
              expand: true,
              cwd: "dist/",
              src: [ "**/*.js", "!*.min.js", "!**/*.min.js" ],
              dest: "dist/",
              ext: ".min.js",
              extDot: "last"
            }
          ]
        }
      },

      qunit: {
        files: [ "tests/*.html" ]
      },
      jshint: {
        all: {
          options: {
            jshintrc: true
          },
          src: [ "Gruntfile.js", "src/**/*.js" ]
        }
      },
      jscs: {
        all: {
          src: "<%= jshint.all.src %>"
        }
      },
      "gh-pages": {
        options: {
          base: "."
        },
        src: [ "**/*", "!node_modules/**/*", "!test/**/*", "!src/**/*" ]
      },
      release: {
        options: {
          commitMessage: "Picturefill <%= version %>",
          tagMessage: "Picturefill <%= version %>",
          afterRelease: [ "gh-pages" ]
        }
      },
      watch: {
        gruntfile: {
          files: [ "Gruntfile.js", "src/*.js", "src/includes/*.js", "tests/*.js" ],
          tasks: [ "default" ],
          options: {
            spawn: false
          }
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
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-jscs-checker");
    grunt.loadNpmTasks("grunt-gh-pages");
    grunt.loadNpmTasks("grunt-release");

	// Default task.
    grunt.registerTask("default", [ "jscs", "test", "clean", "concat", "copy", "uglify" ]);
    grunt.registerTask("test", [ "jscs", "jshint", "qunit" ]);
    grunt.registerTask("publish", [ "gh-pages" ]);
  };
})();
