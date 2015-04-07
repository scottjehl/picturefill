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

    'should make directory' : function(test) {
        var dir = path.join(TEST_DIR, 'a');
        vfs.makeDir(dir)
            .then(
                function() {
                    return vfs.exists(dir);
                },
                function() {
                    test.ok(false);
                })
            .always(function(promise) {
                test.ok(promise.valueOf());
                test.ok(fs.statSync(dir).isDirectory());
                fs.rmdirSync(dir);
                test.done();
            });
    },

    'should make directory if exists' :  function(test) {
        var dir = path.join(TEST_DIR, 'a');
        fs.mkdirSync(dir);
        vfs.makeDir(dir)
            .then(
                function() {
                    return vfs.exists(dir);
                },
                function() {
                    test.ok(false);
                })
            .always(function(promise) {
                test.ok(promise.valueOf());
                test.ok(fs.statSync(dir).isDirectory());
                fs.rmdirSync(dir);
                test.done();
            });
    },

    'should be failed if directory exists' : function(test) {
        var dir = path.join(TEST_DIR, 'a');
        fs.mkdirSync(dir);
        vfs.makeDir(dir, true)
            .then(
                function() {
                    test.ok(false);
                },
                function() {
                    test.ok(true);
                })
            .always(function() {
                fs.rmdirSync(dir);
                test.done();
            });
    },

    'should be failed if file with same name exists' : function(test) {
        var dir = path.join(TEST_DIR, 'test-file');
        fs.writeFileSync(dir, 'test');
        vfs.makeDir(dir)
            .then(
                function() {
                    test.ok(false);
                },
                function() {
                    test.ok(true);
                })
            .always(function() {
                fs.unlinkSync(path.join(TEST_DIR, 'test-file'));
                test.done();
            });
    },

    'should make directory tree' : function(test) {
        var dir = path.join(TEST_DIR, 'a/b/c');
        vfs.makeDir(dir)
            .then(
                function() {
                    return vfs.exists(dir);
                },
                function() {
                    test.ok(false);
                })
            .always(function(promise) {
                test.ok(promise.valueOf());
                test.ok(fs.statSync(dir).isDirectory());
                fs.rmdirSync(path.join(TEST_DIR, 'a/b/c'));
                fs.rmdirSync(path.join(TEST_DIR, 'a/b'));
                fs.rmdirSync(path.join(TEST_DIR, 'a'));
                test.done();
            });
    },

    'should make directory tree if exists' : function(test) {
        var dir = path.join(TEST_DIR, 'a/b/c');
        fs.mkdirSync(path.join(TEST_DIR, 'a'));
        fs.mkdirSync(path.join(TEST_DIR, 'a', 'b'));
        fs.mkdirSync(dir);
        vfs.makeDir(dir)
            .then(
                function() {
                    test.ok(true);
                },
                function() {
                    test.ok(false);
                })
            .always(function() {
                fs.rmdirSync(path.join(TEST_DIR, 'a/b/c'));
                fs.rmdirSync(path.join(TEST_DIR, 'a/b'));
                fs.rmdirSync(path.join(TEST_DIR, 'a'));
                test.done();
            });
    }
};