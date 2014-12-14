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
							src: [ "**/*.js" ],
							dest: "dist/plugins/"
						}
					]
				}
			},
			uglify: {
				options: {
					banner: "<%= banner %>",
					compress: {
						global_defs: {
							"PFDEBUG": false
						},
						dead_code: true
					}
				},
				distfull: {
					options: {
						beautify: true,
						mangle: false
					},
					src: [ "src/picturefill.js" ],
					dest: "dist/picturefill.js"
				},
				distmin: {
					src: [ "src/picturefill.js" ],
					dest: "dist/picturefill.min.js"
				},
				plugins: {
					files: [ {
						expand: true,
						cwd: "src/plugins/",
						src: [ "**/*.js", "!*.min.js", "!**/*.min.js" ],
						dest: "dist/plugins/",
						ext: ".min.js",
						extDot: "last"
					} ]
				}
			},
			qunit: {
				files: [ "tests/*.html", "!tests/index-functional.html" ]
			},
			jshint: {
				all: {
					options: {
						jshintrc: true
					},
					src: [ "Gruntfile.js", "src/*.js" ]
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
			},
			bytesize: {
				all: {
					src: [ "dist/picturefill.min.js" ]
				}
			},
			maxFilesize: {
				options: {
					// Task-specific options go here.
				},
				minified: {
					options: {
						maxBytes: 10000
					},
					src: [ "src/picturefill.min.js" ]
				}
			}
		});

		// because the compress plugin is insane
		grunt.task.registerTask("compress", "compress the dist folder", function() {
			var childProc = require("child_process");
			var done = this.async();

			childProc.exec("zip -r dist-" + pkg.version + ".zip dist", function() {
				done();
			});
		});

		// These plugins provide necessary tasks.
		grunt.loadNpmTasks("grunt-contrib-clean");
		grunt.loadNpmTasks("grunt-contrib-copy");
		grunt.loadNpmTasks("grunt-contrib-jshint");
		grunt.loadNpmTasks("grunt-contrib-qunit");
		grunt.loadNpmTasks("grunt-contrib-uglify");
		grunt.loadNpmTasks("grunt-contrib-watch");
		grunt.loadNpmTasks("grunt-jscs-checker");
		grunt.loadNpmTasks("grunt-bytesize");
		grunt.loadNpmTasks("grunt-max-filesize");

		// Default task.
		grunt.registerTask("default", [ "test", "clean", "copy", "uglify", "bytesize", "maxFilesize" ]);
		grunt.registerTask("test", [ "jscs", "jshint", "qunit" ]);
	};
})();
