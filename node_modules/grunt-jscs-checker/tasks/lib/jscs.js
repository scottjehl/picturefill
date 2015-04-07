"use strict";

var path = require( "path" ),

    Checker = require( "jscs/lib/checker" ),
    jscsConfig = require( "jscs/lib/cli-config" ),

    assign = require( "lodash.assign" ),
    hooker = require( "hooker" );

exports.init = function( grunt ) {

    // Task specific options
    var taskOptions = [ "config", "force", "reporter", "reporterOutput" ];

    /**
     * @see jQuery.isEmptyObject
     * @private
     */
    function isEmptyObject( obj ) {
        var name;

        for ( name in obj ) {
            return false;
        }

        return true;
    }

    /**
     * Default reporter
     * @private
     * @param {errorsCollection} errorsCollection
     */
    function defaultReporter( errorsCollection ) {
        errorsCollection.forEach(function( errors ) {
            if ( !errors.isEmpty() ) {
                errors.getErrorList().forEach(function( error ) {
                    grunt.log.writeln( errors.explainError( error, true ) );
                });
            }
        });
    }

    /**
     * Create new instance of jscs Checker module
     * @constructor
     * @param {Object} options
     * @return {JSCS}
     */
    function JSCS( options ) {
        this.checker = new Checker();
        this.options = options;

        this.checker.registerDefaultRules();
        this.checker.configure( this.getConfig() );

        this._reporter = this.registerReporter( options.reporter );
    }

    /**
     * @see Checker#checkPath
     */
    JSCS.prototype.check = function( path ) {
        var checkPath = this.checker.checkPath( path );

        checkPath.fail(function( error ) {
            grunt.warn( error );
        });

        return checkPath;
    };

    /**
     * Get config
     * @return {Object}
     */
    JSCS.prototype.getConfig = function() {
        var filePath = this.options.config,
            config = this.findConfig(),
            options = this.getOptions();

        assign( config, options );

        if ( isEmptyObject( config ) ) {
            if ( filePath && !grunt.file.exists( filePath ) ) {
                grunt.fatal( "The config file \"" + filePath + "\" was not found" );

            } else if ( filePath ) {
                grunt.fatal( "\"" + filePath + "\" config is empty" );

            } else {
                grunt.fatal( "Nor config file nor inline options weren't found" );
            }
        }

        return config;
    };

    /**
     * Read config file
     * @return {Object}
     */
    JSCS.prototype.findConfig = function() {
        var configPath = this.options && this.options.config || ".jscsrc";

        if ( grunt.file.exists( configPath ) ) {
            return jscsConfig.load( configPath, process.cwd() );
        }

        return {};
    };

    /**
     * Get inline options
     * @return {Object}
     */
    JSCS.prototype.getOptions = function() {
        var option,
            _options = {};

        // Copy options to another object so this method would not be destructive
        for ( option in this.options ) {

            // If to jscs would be given a grunt task option
            // that not defined in jscs it would throw
            if ( !~taskOptions.indexOf( option ) ) {
                _options[ option ] = this.options[ option ];
            }
        }

        return _options;
    };

    /**
     * Register reporter
     * @param {String} name - name or path to the reporter
     * @return {Reporter}
     */
    JSCS.prototype.registerReporter = function( name ) {
        if ( !name ) {
            return defaultReporter;
        }

        var module;

        try {
            module = require( "jscs/lib/reporters/" + name );
        } catch ( _ ) {
            try {
                module = require( path.resolve( process.cwd(), name ) );
            } catch ( _ ) {}
        }

        if ( module ) {
            return module;
        }

        grunt.fatal( "Reporter \"" + name + "\" does not exist" );
    };

    /**
     * Return reporter
     * @return {Reporter}
     */
    JSCS.prototype.getReporter = function() {
        return this._reporter;
    };

    /**
     * Set errors collection as instance property
     * @param {errorsCollection} errorsCollection
     */
    JSCS.prototype.setErrors = function( errorsCollection ) {

        // Filter excluded files ("excludeFiles" option)
        this._errors = errorsCollection.filter(function( errors ) {
            return errors;
        });

        return this;
    };

    /**
     * Return instance errors
     * @return {Array}
     */
    JSCS.prototype.getErrors = function() {
        return this._errors;
    };

    /**
     * Count and return errors
     * @param {errorsCollection} [errorsCollection]
     * @return {Number}
     */
    JSCS.prototype.count = function() {
        var result = 0;

        this._errors.forEach(function( errors ) {
            result += errors.getErrorCount();
        });

        return result;
    };

    /**
     * Send errors to the reporter
     * @return {JSCS}
     */
    JSCS.prototype.report = function() {
        var options = this.options,
            shouldHook = options.reporterOutput,
            content = "";

        if ( shouldHook ) {
            hooker.hook( process.stdout, "write", {
                pre: function( out ) {
                    content += out;

                    return hooker.preempt();
                }
            });
        }

        this._result = this._reporter( this._errors );

        if ( shouldHook ) {
            grunt.file.write( options.reporterOutput, content );
            hooker.unhook( process.stdout, "write" );
        }

        return this;
    };

    /**
     * Print number of found errors
     * @return {JSCS}
     */
    JSCS.prototype.notify = function() {
        var errorCount = this.count();

        if ( errorCount ) {
            grunt.log.error( errorCount + " code style errors found!" );

        } else {
            grunt.log.ok( this._errors.length + " files without code style errors." );
        }

        return this;
    };

    return JSCS;
};
