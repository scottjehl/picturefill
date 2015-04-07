/**
 * Command line config file finder for JSCS.
 *
 */

var fs = require('fs');
var path = require('path');
var stripJSONComments = require('strip-json-comments');
var glob = require('glob');

// Configuration sources in priority order.
var configs = ['package.json', '.jscsrc', '.jscs.json'];

// Before, "findup-sync" package was used,
// but it does not provide filter callback
function findup(patterns, options, fn) {
    /* jshint -W083 */

    var lastpath, file;

    options = Object.create(options || {});
    options.maxDepth = 1;
    options.cwd = path.resolve(options.cwd || '.');

    do {
        file = patterns.filter(function(pattern) {
            var configPath = glob.sync(pattern, options)[0];

            if (configPath) {
                return !fn || fn(path.join(options.cwd, configPath));
            }
        })[0];

        if (file) {
            return path.join(options.cwd, file);
        }

        lastpath = options.cwd;
        options.cwd = path.resolve(options.cwd, '..');
    } while (options.cwd !== lastpath);
}

exports.getContent = function(config, directory) {
    if (!config) {
        return;
    }

    var configPath = path.resolve(directory, config);
    var content;

    config = path.basename(config);

    if (fs.existsSync(configPath)) {
        if (config === '.jscsrc') {
            content = JSON.parse(
                stripJSONComments(
                    fs.readFileSync(configPath, 'utf8')
                )
            );
        } else {
            content = require(configPath);
        }

        // Adding property via Object.defineProperty makes it
        // non-enumerable and avoids warning for unsupported rules
        Object.defineProperty(content, 'configPath', {
            value: configPath
        });
    }

    return content && config === 'package.json' ? content.jscsConfig : content;
};

exports.load = function(config, cwd) {
    var content;
    var directory = cwd || process.cwd();

    // If config option is given, attempt to load it
    if (config) {
        return this.getContent(config, directory);
    }

    content = this.getContent(
        findup(configs, { nocase: true, cwd: directory }, function(configPath) {
            if (path.basename(configPath) === 'package.json') {
                return !!this.getContent(configPath);
            }

            return true;
        }.bind(this))
    );

    if (content) {
        return content;
    }

    // Try to load standart configs from home dir
    directory = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    for (var i = 0, len = configs.length; i < len; i++) {
        content = this.getContent(configs[i], directory);

        if (content) {
            return content;
        }
    }
};
