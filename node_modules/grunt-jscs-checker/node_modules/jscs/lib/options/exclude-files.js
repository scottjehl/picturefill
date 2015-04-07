var path = require('path');
var minimatch = require('minimatch');

module.exports = function(config, instance, cwd) {
    instance._excludes = (config.excludeFiles || []).map(function(pattern) {
        return new minimatch.Minimatch(path.resolve(cwd, pattern), {
            dot: true
        });
    });

    delete config.excludeFiles;
};
