/*global module:true*/
(function() {
  "use strict";

  var pkg, toConcat = [ "src/external/matchmedia.js", "src/picturefill.js" ], supportTypes = "";
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

        dist: {
          options: {
            banner: "<%= banner %>",
            stripBanners: true
          },
          src: toConcat,
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
          src: [ "Gruntfile.js", "src/*.js", "src/includes/*.js", "tests/*.js" ]
        }
      },
      jscs: {
        all: {
          src: "<%= jshint.all.src %>"
        }
      },
      "gh-pages": {
        options: {
          base: '.'
        },
        src: ["**/*", "!node_modules/**/*", "!test/**/*", "!src/**/*"]
      },
      release: {
        options: {
          additionalFiles: ["bower.json"],
          commitMessage: "Picturefill <%= version %>",
          tagMessage: "Picturefill <%= version %>",
          afterRelease: ["gh-pages"]
        }
      },
      watch: {
        gruntfile: {
          files: [ "Gruntfile.js", "src/*.js", "src/includes/*.js", "tests/*.js" ],
          tasks: [ "support-types" +  supportTypes, "default" ],
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
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-jscs-checker");
    grunt.loadNpmTasks("grunt-gh-pages");

    grunt.task.registerTask("support-types", "insert support for image types dev wants to include", function() {
      var supportTypes = "";
      for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];

        switch ( arg ) {
          case "webp":
          case "svg":
          case "jxr":
          case "jp2":
          case "apng":

            toConcat.push("src/includes/" + arg + ".js");
        }

        supportTypes += ":" + arg;

      }

      if (!supportTypes) {
        supportTypes = supportTypes;
      }
      grunt.task.run("default");
      console.log("files to concatenate", toConcat);
    } );

	// Default task.
    grunt.registerTask("default", [ "jscs", "test", "clean", "concat", "uglify" ]);
    grunt.registerTask("test", [ "jscs", "jshint", "qunit" ]);
    grunt.registerTask("publish", [ "gh-pages" ]);
  };
})();
