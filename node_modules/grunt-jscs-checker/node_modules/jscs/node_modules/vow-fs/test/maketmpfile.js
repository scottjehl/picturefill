var fs = require('fs'),
    path = require('path'),
    os = require('os'),
    vfs = require('../lib/fs'),
    tmpDir = os.tmpdir || os.tmpDir || function() { return '/tmp'; },
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

    'should make temporary file with default options' : function(test) {
        var filePath;
        vfs.makeTmpFile()
            .then(
                function(_filePath) {
                    return vfs.exists(filePath = _filePath);
                },
                function() {
                    test.ok(false);
                    throw Error();
                })
            .then(function(exists) {
                fs.unlinkSync(filePath);
                test.strictEqual(path.dirname(filePath), path.resolve(tmpDir()));
                test.strictEqual(path.extname(filePath), '.tmp');
                test.ok(exists);
            })
            .always(function() {
                test.done();
            });
    },

    'should make temporary file in custom directory' : function(test) {
        var filePath;
        vfs.makeTmpFile({ dir : TEST_DIR })
            .then(
                function(_filePath) {
                    return vfs.exists(filePath = _filePath);
                },
                function() {
                    test.ok(false);
                    throw Error();
                })
            .then(function(exists) {
                fs.unlinkSync(filePath);
                test.ok(exists);
                test.strictEqual(path.dirname(filePath), TEST_DIR);
            })
            .always(function() {
                test.done();
            })
    },

    'should make temporary file with custom prefix' : function(test) {
        var filePath;
        vfs.makeTmpFile({ prefix : '__prefix' })
            .then(
                function(_filePath) {
                    return vfs.exists(filePath = _filePath);
                },
                function() {
                    test.ok(false);
                    throw Error();
                })
            .then(function(exists) {
                fs.unlinkSync(filePath);
                test.ok(exists);
                test.ok(filePath.indexOf('__prefix') > -1);
            })
            .always(function() {
                test.done();
            })
    },

    'should make temporary file with custom extension' : function(test) {
        var filePath;
        vfs.makeTmpFile({ ext : '.css' })
            .then(
                function(_filePath) {
                    return vfs.exists(filePath = _filePath);
                },
                function() {
                    test.ok(false);
                    throw Error();
                })
            .then(function(exists) {
                fs.unlinkSync(filePath);
                test.ok(exists);
                test.strictEqual(path.extname(filePath), '.css');
            })
            .always(function() {
                test.done();
            })
    }
};