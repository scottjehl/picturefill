
var Q = require("q");
var Boot = require("./fs-boot");
var RootFs = require("./fs-root");
var MockFs = require("./fs-mock");

// TODO patternToRegExp
// TODO glob
// TODO match

var concat = function (arrays) {
    return Array.prototype.concat.apply([], arrays);
};

exports.update = function (exports, workingDirectory) {

    for (var name in Boot) {
        exports[name] = Boot[name];
    }

    /**
     * Read a complete file.
     * @param {String} path    Path to the file.
     * @param {Object} [options]   An object with options.
     * @param {String} [options.flags]  The mode to open the file with.
     * @param {String} [options.charset]  The charset to open the file with.
     * second argument.
     * @returns {Promise * (String || Buffer)}
     */
    exports.read = function (path, flags, charset, options) {
        if (typeof flags == "object") {
            options = flags;
        } else {
            options = options || {};
            options.flags = flags;
            options.charset = charset;
        }
        options.flags = "r" + (options.flags || "").replace(/r/g, "");
        return Q.when(this.open(path, options), function (stream) {
            return stream.read();
        }, function (error) {
            error.message = "Can't read " + path + " because " + error.message;
            error.path = path;
            error.flags = flags;
            error.charset = charset;
            throw error;
        });
    };

    /**
     * Write content to a file, overwriting the existing content.
     * @param {String} path    Path to the file.
     * @param {String || Buffer} content
     * @param {Object} [options]   An object with options.
     * @param {String} [options.flags]  The mode to open the file with.
     * @param {String} [options.charset]  The charset to open the file with.
     * @returns {Promise * Undefined} a promise that resolves
     * when the writing is complete.
     */
    exports.write = function (path, content, flags, charset, options) {
        var self = this;
        if (typeof flags == "object") {
            options = flags;
        } else {
            options = options || {};
            options.flags = flags;
            options.charset = charset;
        }
        flags = "w" + (options.flags || "").replace(/[w]/g, "");
        if (flags.indexOf("b") !== -1) {
            if (!(content instanceof Buffer)) {
                content = new Buffer(content);
            }
        } else if (content instanceof Buffer) {
            flags += "b";
        }
        options.flags = flags;
        return Q.when(self.open(path, options), function (stream) {
            return Q.when(stream.write(content), function () {
                return stream.close();
            });
        });
    };

    /**
     * Append content to the end of a file.
     * @param {String} path    Path to the file.
     * @param {String || Buffer} content
     * @param {Object} [options]   An object with options.
     * @param {String} [options.flags]  The mode to open the file with.
     * @param {String} [options.charset]  The charset to open the file with.
     * @returns {Promise * Undefined} a promise that resolves
     * when the writing is complete.
     */
    exports.append = function (path, content, flags, charset, options) {
        var self = this;
        if (typeof flags == "object") {
            options = flags;
        } else {
            options = options || {};
            options.flags = flags;
            options.charset = charset;
        }
        flags = "w+" + (options.flags || "").replace(/[w\+]/g, "");
        if (content instanceof Buffer) {
            flags += "b";
        }
        options.flags = flags;
        return Q.when(self.open(path, options), function (stream) {
            return Q.when(stream.write(content), function () {
                return stream.close();
            });
        });
    };

    exports.copy = function (source, target) {
        var self = this;
        return Q.spread([
            self.open(source, {flags: "rb"}),
            self.open(target, {flags: "wb"})
        ], function (reader, writer) {
            return Q.when(reader.forEach(function (block) {
                return writer.write(block);
            }), function () {
                return Q.all([
                    reader.close(),
                    writer.close()
                ]);
            });
        });
    };

    exports.copyTree = function (source, target) {
        var self = this;
        return Q.when(self.stat(source), function (stat) {
            if (stat.isFile()) {
                return self.copy(source, target);
            } else if (stat.isDirectory()) {
                return Q.when(self.makeDirectory(target), function () {
                    return Q.when(self.list(source), function (list) {
                        return Q.all(list.map(function (child) {
                            return self.copyTree(
                                self.join(source, child),
                                self.join(target, child)
                            );
                        }));
                    });
                });
            } else if (stat.isSymbolicLink()) {
                // TODO copy the link and type with readPath (but what about
                // Windows junction type?)
                return self.symbolicCopy(source, target);
            }
        });
    };

    exports.listTree = function (basePath, guard) {
        var self = this;
        basePath = String(basePath || '');
        if (!basePath)
            basePath = ".";
        guard = guard || function () {
            return true;
        };
        var stat = self.stat(basePath);
        return Q.when(stat, function (stat) {
            var paths = [];
            var mode; // true:include, false:exclude, null:no-recur
            try {
                var include = guard(basePath, stat);
            } catch (exception) {
                return Q.reject(exception);
            }
            return Q.when(include, function (include) {
                if (include) {
                    paths.push([basePath]);
                }
                if (include !== null && stat.isDirectory()) {
                    return Q.when(self.list(basePath), function (children) {
                        paths.push.apply(paths, children.map(function (child) {
                            var path = self.join(basePath, child);
                            return self.listTree(path, guard);
                        }));
                        return paths;
                    });
                } else {
                    return paths;
                }
            });
        }, function noSuchFile(reason) {
            return [];
        }).then(Q.all).then(concat);
    };

    exports.listDirectoryTree = function (path) {
        return this.listTree(path, function (path, stat) {
            return stat.isDirectory();
        });
    };

    exports.makeTree = function (path, mode) {
        var self = this;
        var parts = self.split(path);
        var at = [];
        if (self.isAbsolute(path)) {
            // On Windows use the root drive (e.g. "C:"), on *nix the first
            // part is the falsey "", and so use the ROOT ("/")
            at.push(parts.shift() || self.ROOT);
        }
        return parts.reduce(function (parent, part) {
            return Q.when(parent, function () {
                at.push(part);
                var parts = self.join(at);
                var made = self.makeDirectory(parts, mode);
                return Q.when(made, null, function rejected(error) {
                    // throw away errors for already made directories
                    if (error.exists) {
                        return;
                    } else {
                        throw error;
                    }
                });
            });
        }, undefined);
    };

    exports.removeTree = function (path) {
        var self = this;
        return Q.when(self.stat(path), function (stat) {
            if (stat.isSymbolicLink()) {
                return self.remove(path);
            } else if (stat.isDirectory()) {
                return self.list(path)
                .then(function (list) {
                    // asynchronously remove every subtree
                    return Q.all(list.map(function (name) {
                        return self.removeTree(self.join(path, name));
                    }))
                    .then(function () {
                        return self.removeDirectory(path);
                    });
                });
            } else {
                return self.remove(path);
            }
        });
    };

    exports.symbolicCopy = function (source, target, type) {
        var self = this;
        return Q.when(self.relative(target, source), function (relative) {
            return self.symbolicLink(target, relative, type || "file");
        });
    };

    exports.exists = function (path) {
        return Q.when(this.stat(path), function () {
            return true;
        }, function () {
            return false;
        });
    };

    exports.isFile = function (path) {
        return Q.when(this.stat(path), function (stat) {
            return stat.isFile();
        }, function (reason) {
            return false;
        });
    };

    exports.isDirectory = function (path) {
        return Q.when(this.stat(path), function (stat) {
            return stat.isDirectory();
        }, function (reason) {
            return false;
        });
    };

    exports.isSymbolicLink = function (path) {
        return Q.when(this.statLink(path), function (stat) {
            return stat.isSymbolicLink();
        }, function (reason) {
            return false;
        });
    };

    exports.lastModified = function (path) {
        var self = this;
        return self.stat(path).invoke('lastModified');
    };

    exports.lastAccessed = function (path) {
        var self = this;
        return self.stat(path).invoke('lastAccessed');
    };

    exports.absolute = function (path) {
        if (this.isAbsolute(path))
            return this.normal(path);
        return this.join(workingDirectory(), path);
    };

    exports.relative = function (source, target) {
        var self = this;
        return Q.when(this.isDirectory(source), function (isDirectory) {
            if (isDirectory) {
                return self.relativeFromDirectory(source, target);
            } else {
                return self.relativeFromFile(source, target);
            }
        });
    };

    exports.relativeFromFile = function (source, target) {
        var self = this;
        source = self.absolute(source);
        target = self.absolute(target);
        source = source.split(self.SEPARATORS_RE());
        target = target.split(self.SEPARATORS_RE());
        source.pop();
        while (
            source.length &&
            target.length &&
            target[0] == source[0]
        ) {
            source.shift();
            target.shift();
        }
        while (source.length) {
            source.shift();
            target.unshift("..");
        }
        return target.join(self.SEPARATOR);
    };

    exports.relativeFromDirectory = function (source, target) {
        if (!target) {
            target = source;
            source = workingDirectory();
        }
        source = this.absolute(source);
        target = this.absolute(target);
        source = source.split(this.SEPARATORS_RE());
        target = target.split(this.SEPARATORS_RE());
        if (source.length === 2 && source[1] === "")
            source.pop();
        while (
            source.length &&
            target.length &&
            target[0] == source[0]
        ) {
            source.shift();
            target.shift();
        }
        while (source.length) {
            source.shift();
            target.unshift("..");
        }
        return target.join(this.SEPARATOR);
    };

    exports.contains = function (parent, child) {
        var i, ii;
        parent = this.absolute(parent);
        child = this.absolute(child);
        parent = parent.split(this.SEPARATORS_RE());
        child = child.split(this.SEPARATORS_RE());
        if (parent.length === 2 && parent[1] === "")
            parent.pop();
        if (parent.length > child.length)
            return false;
        for (i = 0, ii = parent.length; i < ii; i++) {
            if (parent[i] !== child[i])
                break;
        }
        return i == ii;
    };

    exports.reroot = reroot;
    function reroot(path) {
        var self = this;
        path = path || this.ROOT;
        return Q.when(this.list(path), function (list) {
            if (list.length !== 1)
                return RootFs(self, path);
            var nextPath = self.join(path, list[0]);
            return Q.when(self.stat(nextPath), function (stat) {
                if (stat.isDirectory()) {
                    return reroot(nextPath);
                } else {
                    return RootFs(self, path);
                }
            });
        });
    }

    exports.toObject = function (path) {
        var self = this;
        var list = self.listTree(path || "", function (path, stat) {
            return stat.isFile();
        });
        return Q.when(list, function (list) {
            var tree = {};
            return Q.all(list.map(function (path) {
                return Q.when(self.read(path, "rb"), function (content) {
                    tree[path] = content;
                });
            })).then(function () {
                return tree;
            });
        });
    };

    exports.merge = function (fss) {
        var tree = {};
        var done;
        fss.forEach(function (fs) {
            done = Q.when(done, function () {
                return fs.listTree("", function (path, stat) {
                    return stat.isFile();
                })
                .then(function (list) {
                    return Q.all(list.map(function (path) {
                        return Q.when(fs.read(path, "rb"), function (content) {
                            tree[path] = content;
                        });
                    }));
                });
            });
        })
        return Q.when(done, function () {
            return MockFs(tree);
        });
    };

}

