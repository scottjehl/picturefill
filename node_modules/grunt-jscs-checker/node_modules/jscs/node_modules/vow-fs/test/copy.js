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

    'should copy file' : function(test) {
        var sourceFile = path.join(TEST_DIR, 'source-file'),
            targetFile = path.join(TEST_DIR, 'target-file');
        fs.writeFileSync(sourceFile, 'source');
        vfs.copy(sourceFile, targetFile)
            .then(function() {
                test.equal(fs.readFileSync(targetFile, 'utf8'), 'source');
            })
            .always(function() {
                fs.unlinkSync(sourceFile);
                fs.unlinkSync(targetFile);
                test.done();
            });
    },

    'should copy file if target exists' : function(test) {
        var sourceFile = path.join(TEST_DIR, 'source-file'),
            targetFile = path.join(TEST_DIR, 'target-file');
        fs.writeFileSync(sourceFile, 'source');
        fs.writeFileSync(targetFile, 'target');
        vfs.copy(sourceFile, targetFile)
            .then(function() {
                test.equal(fs.readFileSync(targetFile, 'utf8'), 'source');
            })
            .always(function() {
                fs.unlinkSync(sourceFile);
                fs.unlinkSync(targetFile);
                test.done();
            });
    },

    'should not copy file if source is directory' : function(test) {
        var sourceDir = path.join(TEST_DIR, 'source-dir'),
            targetFile = path.join(TEST_DIR, 'target-file');
        fs.mkdirSync(sourceDir);
        vfs.copy(sourceDir, targetFile)
            .then(
                function() {
                    test.ok(false);
                },
                function(err) {
                    test.equal(err.code, 'EISDIR');
                })
            .always(function() {
                fs.rmdirSync(sourceDir);
                test.done();
            });
    },

    'should not copy file if target is directory' : function(test) {
        var sourceFile = path.join(TEST_DIR, 'source-file'),
            targetDir = path.join(TEST_DIR, 'target-dir');
        fs.writeFileSync(sourceFile, 'source');
        fs.mkdirSync(targetDir);
        vfs.copy(sourceFile, targetDir)
            .then(
                function() {
                    test.ok(false);
                },
                function(err) {
                    test.equal(err.code, 'EISDIR');
                })
            .always(function() {
                fs.unlinkSync(sourceFile);
                fs.rmdirSync(targetDir);
                test.done();
            });
    },

    'should not copy if target not exists' : function(test) {
        var sourceFile = path.join(TEST_DIR, 'source-file'),
            targetFile = path.join(TEST_DIR, 'target-file');
        vfs.copy(sourceFile, targetFile)
            .then(
                function() {
                    test.ok(false);
                },
                function(err) {
                    test.equal(err.code, 'ENOENT');
                })
            .always(function() {
                test.done();
            });
    }
};