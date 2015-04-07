var vowFs = require('vow-fs');
var Vow = require('vow');
var StringChecker = require('./string-checker');
var utils = require('util');
var path = require('path');

var additionalRules = require('./options/additional-rules');
var excludeFiles = require('./options/exclude-files');

/**
 * Starts Code Style checking process.
 *
 * @name StringChecker
 */
var Checker = function() {
    StringChecker.apply(this, arguments);
};

utils.inherits(Checker, StringChecker);

/**
 * Loads configuration from JS Object. Activates and configures required rules.
 *
 * @param {Object} config
 */
Checker.prototype.configure = function(config) {
    var cwd = config.configPath ? path.dirname(config.configPath) : process.cwd();

    excludeFiles(config, this, cwd);
    additionalRules(config, this, cwd);

    StringChecker.prototype.configure.apply(this, arguments);
};

/**
 * Checks single file.
 *
 * @param {String} path
 * @returns {Promise * Errors}
 */
Checker.prototype.checkFile = function(path) {
    var _this = this;
    if (this._shouldProcess(path) && path.match(/\.js$/)) {
        return vowFs.read(path, 'utf8').then(function(data) {
            return _this.checkString(data, path);
        });
    } else {
        return null;
    }
};

/**
 * Checks directory recursively.
 *
 * @param {String} path
 * @returns {Promise * Error[]}
 */
Checker.prototype.checkDirectory = function(path) {
    var _this = this;
    return vowFs.listDir(path).then(function(filenames) {
        return Vow.all(filenames.map(function(filename) {
            var fullname = path + '/' + filename;
            // check for exclude path
            if (_this._shouldProcess(fullname)) {
                return vowFs.stat(fullname).then(function(stat) {
                    if (stat.isDirectory()) {
                        return _this.checkDirectory(fullname);
                    } else if (fullname.match(/\.js$/)) {
                        return Vow.when(_this.checkFile(fullname)).then(function(errors) {
                            if (errors) {
                                return errors;
                            } else {
                                return [];
                            }
                        });
                    } else {
                        return [];
                    }
                });
            } else {
                return [];
            }
        })).then(function(results) {
            return [].concat.apply([], results);
        });
    });
};

/**
 * Checks directory or file.
 *
 * @param {String} path
 * @returns {Error[]}
 */
Checker.prototype.checkPath = function(path) {
    path = path.replace(/\/$/, '');
    var _this = this;
    return vowFs.exists(path).then(function(exists) {
        if (exists) {
            return vowFs.stat(path).then(function(stat) {
                if (stat.isDirectory()) {
                    return _this.checkDirectory(path);
                } else {
                    return Vow.when(_this.checkFile(path)).then(function(errors) {
                        if (errors) {
                            return [errors];
                        } else {
                            return [];
                        }
                    });
                }
            });
        } else {
            throw new Error('Path ' + path + ' was not found.');
        }
    });
};

/**
 * Returns true if specified path is not in exluded list.
 *
 * @returns {Boolean}
 */
Checker.prototype._shouldProcess = function(testPath) {
    testPath = path.resolve(testPath);

    return this._excludes.every(function(exclude) {
        return !exclude.match(testPath);
    });
};

module.exports = Checker;
