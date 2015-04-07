var fs = require('fs'),
    path = require('path'),
    vfs = require('../lib/fs'),
    TEST_DIR = path.join(__dirname, 'test-dir');

module.exports = {
    setUp : function(done) {
        fs.mkdirSync(TEST_DIR);
        done();
    },

    tearDown : function(done) {
        fs.rmdirSync(TEST_DIR);
        done();
    },

    'should return true if the file is a symbolic link' : function(test) {
        var sourceFile = path.join(TEST_DIR, 'source-file'),
            targetFile = path.join(TEST_DIR, 'target-file');
        fs.writeFileSync(sourceFile, 'source');
        fs.symlinkSync(sourceFile, targetFile);
        vfs.isSymLink(targetFile)
            .then(function(isSymLink) {
                test.ok(isSymLink);
            })
            .always(function() {
                fs.unlinkSync(sourceFile);
                fs.unlinkSync(targetFile);
                test.done();
            });
    },

    'should return false if the file is not a symbolic link' : function(test) {
        var sourceFile = path.join(TEST_DIR, 'source-file');
        fs.writeFileSync(sourceFile, 'source');
        vfs.isSymLink(sourceFile)
            .then(function(isSymLink) {
                test.ok(!isSymLink);
            })
            .always(function() {
                fs.unlinkSync(sourceFile);
                test.done();
            });
    }
};