var fs = require('fs'),
    path = require('path');

require('nodeunit').reporters.default.run(
    fs.readdirSync(__dirname)
        .filter(function(file){
            return fs.statSync(path.join(__dirname, file)).isFile() && file !== 'runner.js';
        })
        .map(function(file) {
            return path.join('test', file);
        }),
    null,
    function(err) {
        err && process.exit(1);
    });