/**
 * Command line implementation for JSCS.
 *
 * Common usage case is:
 *
 * ./node_modules/.bin/jscs file1 dir1 file2 dir2
 */
var Checker = require('./checker');
var configFile = require('./cli-config');

var Vow = require('vow');

var fs = require('fs');
var path = require('path');

module.exports = function(program) {
    var reporterPath, reporter;
    var promise = Vow.promise();
    var checker = new Checker();
    var config = configFile.load(program.config);
    var args = program.args;

    promise.always(function(status) {
        process.exit(status.valueOf());
    });

    /**
     * Trying to load config.
     * Custom config path can be specified using '-c' option.
     */
    if (!config && !program.preset) {
        if (program.config) {
            console.error('Configuration source', program.config, 'was not found.');
        } else {
            console.error('No configuration found. Add a .jscsrc file to your project root or use the -c option.');
        }

        return promise.reject(1);
    }

    if (args.length === 0) {
        console.error('No input files specified. Try option --help for usage information.');
        return promise.reject(1);
    }

    if (!config) {
        config = {};
    }

    if (program.preset) {
        config.preset = program.preset;
    }

    if (program.reporter) {
        reporterPath = path.resolve(process.cwd(), program.reporter);

        if (!fs.existsSync(reporterPath)) {
            reporterPath = './reporters/' + program.reporter;
        }

    } else {
        reporterPath = './reporters/' + (program.colors ? 'console' : 'text');
    }

    try {
        reporter = require(reporterPath);

    } catch (e) {
        console.error('Reporter "%s" doesn\'t exist.', reporterPath);
        return promise.reject(1);
    }

    checker.registerDefaultRules();
    checker.configure(config);

    /**
     * Processing specified files and dirs.
     */
    Vow.all(args.map(checker.checkPath, checker)).then(function(results) {
        var errorsCollection = [].concat.apply([], results);

        reporter(errorsCollection);

        errorsCollection.forEach(function(errors) {
            if (!errors.isEmpty()) {
                promise.reject(2);
            }
        });

        promise.fulfill(0);
    }).fail(function(e) {
        console.error(e.stack);
        promise.reject(1);
    });

    return {
        checker: checker,
        reporter: reporterPath,
        promise: promise
    };
};
