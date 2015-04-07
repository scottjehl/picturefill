/**
 * An asynchronous local file system API, based on a subset
 * of the `narwhal/fs` API and the `narwhal/promise` API,
 * such that the method names are the same but some return
 * values are promises instead of fully resolved values.
 * @module
 */

/*whatsupdoc*/

var FS = require("fs"); // node
var Q = require("q");
var Reader = require("./reader");
var Writer = require("./writer");
var Common = require("./fs-common");
var Mock = require("./fs-mock");
var Root = require("./fs-root");

Common.update(exports, process.cwd);
exports.Mock = Mock;
exports.Root = Root;

// facilitates AIMD (additive increase, multiplicative decrease) for backing off
var backOffDelay = 0;
var backOffFactor = 1.0001;
function dampen(wrapped, thisp) {
    var retry = function () {
        var args = arguments;
        var ready = backOffDelay ? Q.delay(backOffDelay) : Q.resolve();
        return ready.then(function () {
            return Q.when(wrapped.apply(thisp, args), function (stream) {
                backOffDelay = Math.max(0, backOffDelay - 1);
                return stream;
            }, function (error) {
                if (error.code === "EMFILE") {
                    backOffDelay = (backOffDelay + 1) * backOffFactor;
                    return retry.apply(null, args);
                } else {
                    throw error;
                }
            });
        });
    };
    return retry;
}

/**
 * @param {String} path
 * @param {Object} options (flags, mode, bufferSize, charset, begin, end)
 * @returns {Promise * Stream} a stream from the `q-io` module.
 */
exports.open = dampen(function (path, flags, charset, options) {
    var self = this;
    if (typeof flags == "object") {
        options = flags;
        flags = options.flags;
        charset = options.charset;
    }
    options = options || {};
    flags = flags || "r";
    var nodeOptions = {
        "flags": flags.replace(/b/g, "")
    };
    if ("bufferSize" in options) {
        nodeOptions.bufferSize = options.bufferSize;
    }
    if ("mode" in options) {
        nodeOptions.mode = options.mode;
    }
    if ("begin" in options) {
        nodeOptions.start = options.begin;
        nodeOptions.end = options.end - 1;
    }
    if (flags.indexOf("b") >= 0) {
        if (charset) {
            throw new Error("Can't open a binary file with a charset: " + charset);
        }
    } else {
        charset = charset || 'utf-8';
    }
    if (flags.indexOf("w") >= 0) {
        var stream = FS.createWriteStream(String(path), nodeOptions);
        return Writer(stream, charset);
    } else {
        var stream = FS.createReadStream(String(path), nodeOptions);
        return Reader(stream, charset);
    }
});

exports.remove = function (path) {
    path = String(path);
    var done = Q.defer();
    FS.unlink(path, function (error) {
        if (error) {
            error.message = "Can't remove " + JSON.stringify(path) + ": " + error.message;
            done.reject(error);
        } else {
            done.resolve();
        }
    });
    return done.promise;
};

exports.move = function (source, target) {
    source = String(source);
    target = String(target);
    return exports.exists(target)
    .then(function (exists) {
        if (exists) {
            var error = new Error("Can't move over existing entry " + target);
            error.code = "EEXISTS";
            throw error;
        }
        return Q.ninvoke(FS, "rename", source, target)
        .fail(function (error) {
            error.message = (
                "Can't move " + JSON.stringify(source) + " to " +
                JSON.stringify(target) + " because " + error.message
            );
            throw error;
        });
    });
};

exports.makeDirectory = function (path, mode) {
    path = String(path);
    var done = Q.defer();
    if (typeof mode === "string") {
        mode = parseInt(mode, 8);
    } else if (mode === void 0) {
        mode = parseInt('755', 8);
    }
    FS.mkdir(path, mode, function (error) {
        if (error) {
            error.message = "Can't makeDirectory " + JSON.stringify(path) + " with mode " + mode + ": " + error.message;
            if (error.code === "EISDIR") {
                error.exists = true;
                error.isDirectory = true;
            }
            if (error.code === "EEXIST") {
                error.exists = true;
            }
            done.reject(error);
        } else {
            done.resolve();
        }
    });
    return done.promise;
};

exports.removeDirectory = function (path) {
    path = String(path);
    var done = Q.defer();
    FS.rmdir(path, function (error) {
        if (error) {
            error.message = "Can't removeDirectory " + JSON.stringify(path) + ": " + error.message;
            done.reject(error);
        } else {
            done.resolve();
        }
    });
    return done.promise;
};

/**
 */
exports.list = dampen(function (path) {
    path = String(path);
    var result = Q.defer();
    FS.readdir(path, function (error, list) {
        if (error) {
            error.message = "Can't list " + JSON.stringify(path) + ": " + error.message;
            return result.reject(error);
        } else {
            result.resolve(list);
        }
    });
    return result.promise;
});

/**
 * @param {String} path
 * @returns {Promise * Stat}
 */
exports.stat = function (path) {
    var self = this;
    path = String(path);
    var done = Q.defer();
    try {
        FS.stat(path, function (error, stat) {
            if (error) {
                error.message = "Can't stat " + JSON.stringify(path) + ": " + error;
                done.reject(error);
            } else {
                done.resolve(new Stats(stat));
            }
        });
    } catch (error) {
        done.reject(error);
    }
    return done.promise;
};

var Stats = function (nodeStat) {
    this.node = nodeStat;
    this.size = nodeStat.size;
};

var stats = [
    "isDirectory",
    "isFile",
    "isBlockDevice",
    "isCharacterDevice",
    "isSymbolicLink",
    "isFIFO",
    "isSocket"
];

stats.forEach(function (name) {
    Stats.prototype[name] = function () {
        return this.node[name]();
    };
});

Stats.prototype.lastModified = function () {
    return new Date(this.node.mtime);
};

Stats.prototype.lastAccessed = function () {
    return new Date(this.node.atime);
};

exports.statLink = function (path) {
    path = String(path);
    var done = Q.defer();
    try {
        FS.lstat(path, function (error, stat) {
            if (error) {
                error.message = "Can't statLink " + JSON.stringify(path) + ": " + error.message;
                done.reject(error);
            } else {
                done.resolve(stat);
            }
        });
    } catch (error) {
        done.reject(error);
    }
    return done.promise;
};

exports.statFd = function (fd) {
    fd = Number(fd);
    var done = Q.defer();
    try {
        FS.fstat(fd, function (error, stat) {
            if (error) {
                error.message = "Can't statFd file descriptor " + JSON.stringify(fd) + ": " + error.message;
                done.reject(error);
            } else {
                done.resolve(stat);
            }
        });
    } catch (error) {
        done.reject(error);
    }
    return done.promise;
};

exports.link = function (source, target) {
    source = String(source);
    target = String(target);
    var done = Q.defer();
    try {
        FS.link(source, target, function (error) {
            if (error) {
                error.message = "Can't link " + JSON.stringify(source) + " to " + JSON.stringify(target) + ": " + error.message;
                done.reject(error);
            } else {
                done.resolve();
            }
        });
    } catch (error) {
        done.reject(error);
    }
    return done.promise;
};

// this lookup table translates the link types that Q-IO accepts (which have
// been normalized to full words to be consistent with the naming convention)
var linkTypes = {
    "file": "file",
    "directory": "dir",
    "junction": "junction"
};

exports.symbolicLink = function (target, relative, type) {
    if (!linkTypes.hasOwnProperty(type)) {
        console.warn(new Error("For Windows compatibility, symbolicLink must be called with a type argument \"file\", \"directory\", or \"junction\""));
    }
    type = linkTypes[type];
    target = String(target);
    relative = String(relative);
    var done = Q.defer();
    try {
        FS.symlink(relative, target, type || 'file', function (error) {
            if (error) {
                error.message = "Can't create symbolicLink " + JSON.stringify(target) + " to relative location " + JSON.stringify(relative) + ": " + error.message;
                done.reject(error);
            } else {
                done.resolve();
            }
        });
    } catch (error) {
        done.reject(error);
    }
    return done.promise;
};

exports.chown = function (path, uid, gid) {
    path = String(path);
    var done = Q.defer();
    try {
        FS.chown(path, uid, gid, function (error) {
            if (error) {
                error.message = "Can't chown (change owner) of " + JSON.stringify(path) + " to user " + JSON.stringify(uid) + " and group " + JSON.stringify(gid) + ": " + error.message;
                done.reject(error);
            } else {
                done.resolve();
            }
        });
    } catch (error) {
        done.reject(error);
    }
    return done.promise;
};

exports.chmod = function (path, mode) {
    path = String(path);
    mode = String(mode);
    var done = Q.defer();
    try {
        FS.chmod(path, mode, function (error) {
            if (error) {
                error.message = "Can't chmod (change permissions mode) of " + JSON.stringify(path) + " to (octal number) " + mode.toString(8) + ": " + error.message;
                done.reject(error);
            } else {
                done.resolve();
            }
        });
    } catch (error) {
        done.reject(error);
    }
    return done.promise;
};

exports.canonical = function (path) {
    var result = Q.defer();
    FS.realpath(path, function (error, canonicalPath) {
        if (error) {
            error.message = "Can't get canonical path of " + JSON.stringify(path) + " by way of C realpath: " + error.message;
            result.reject(error);
        } else {
            result.resolve(canonicalPath);
        }
    });
    return result.promise;
};

exports.readLink = function (path) {
    var result = Q.defer();
    FS.readlink(path, function (error, path) {
        if (error) {
            error.message = "Can't get link from " + JSON.stringify(path) + " by way of C readlink: " + error.message;
            result.reject(error);
        } else {
            result.resolve(path);
        }
    });
    return result.promise;
};

exports.mock = function (path) {
    return Mock.mock(this, path);
};

