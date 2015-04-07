
var Q = require("q");
var Boot = require("./fs-boot");
var Common = require("./fs-common");
var BufferStream = require("./buffer-stream");
var Reader = require("./reader");
var Set = require("collections/set");

module.exports = MockFs;

function MockFs(files, workingDirectory) {
    if (!(this instanceof MockFs)) {
        return new MockFs(files, workingDirectory);
    }
    this._root = new DirectoryNode(this, "/");

    function init() {
        // construct a file tree
    }

    Common.update(this, function () {
        return workingDirectory;
    });

    workingDirectory = workingDirectory || this.ROOT;
    if (files) {
        this._init(files);
    }
}

MockFs.prototype = Object.create(Boot);

MockFs.prototype._init = function (files, tree) {
    tree = tree || this.ROOT;
    Object.keys(files).forEach(function (path) {
        var content = files[path];
        path = this.join(tree, path);
        var directory = this.directory(path);
        var base = this.base(path);
        var directoryNode = this._root._walk(directory, true);
        var fileNode = new FileNode(this);
        if (!(content instanceof Buffer)) {
            if (typeof content === "object") {
                // make directory
                this._root._walk(path, true);
                // make content
                this._init(content, path);
                return;
            } else {
                content = new Buffer(String(content), "utf-8");
            }
        }
        directoryNode._entries[base] = fileNode;
        fileNode._chunks = [content];
    }, this);
};

MockFs.prototype.list = function (path) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        var node = self._root._walk(path)._follow(path);
        if (!node.isDirectory()) {
            new Error("Can't list non-directory: " + JSON.stringify(path));
        }
        return Object.keys(node._entries).sort();
    });
};

MockFs.prototype.open = function (path, flags, charset, options) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        var directory = self.directory(path);
        var base = self.base(path);
        var node = self._root._walk(directory);
        if (!node.isDirectory()) {
            throw new Error("Can't find " + path + " because " + directory + " is not a directory");
        }
        if (typeof flags == "object") {
            options = flags;
            flags = options.flags;
            charset = options.charset;
        } else {
            options = options || {};
        }
        flags = flags || "r";
        var binary = flags.indexOf("b") >= 0;
        var write = flags.indexOf("w") >= 0;
        if (!binary) {
            charset = charset || "utf-8";
        }
        if (write) {
            if (!node._entries[base]) {
                node._entries[base] = new FileNode(this);
            }
            var fileNode = node._entries[base]._follow(path);
            if (!fileNode.isFile()) {
                throw new Error("Can't write non-file " + path);
            }
            fileNode._lastModified = new Date();
            fileNode._lastAccessed = new Date();
            return new BufferStream(fileNode._chunks, charset);
        } else { // read
            if (!node._entries[base]) {
                throw new Error("Can't read non-existant " + path);
            }
            var fileNode = node._entries[base]._follow(path);
            if (!fileNode.isFile()) {
                throw new Error("Can't read non-file " + path);
            }
            fileNode._lastAccessed = new Date();
            if ("begin" in options && "end" in options) {
                return new BufferStream(
                    [
                        Reader.join(fileNode._chunks)
                        .slice(options.begin, options.end)
                    ],
                    charset
                );
            } else {
                return new BufferStream(fileNode._chunks, charset);
            }
        }
    });
};

MockFs.prototype.remove = function (path) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        var directory = self.directory(path);
        var name = self.base(path);
        var node = self._root._walk(directory);
        if (!node.isDirectory()) {
            throw new Error("Can't remove file from non-directory: " + path);
        }
        if (!node._entries[name]) {
            throw new Error("Can't remove non-existant file: " + path);
        }
        if (node._entries[name].isDirectory()) {
            throw new Error("Can't remove directory. Use removeDirectory: " + path);
        }
        delete node._entries[name];
    });
};

MockFs.prototype.makeDirectory = function (path) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        var directory = self.directory(path);
        var name = self.base(path);
        var node = self._root._walk(directory);
        if (!node.isDirectory()) {
            var error =  new Error("Can't make directory in non-directory: " + path);
            error.code = "EEXISTS";
            error.exists = true;
            throw error;
        }
        if (node._entries[name]) {
            var error = new Error("Can't make directory. Entry exists: " + path);
            error.code = "EISDIR";
            error.exists = true;
            error.isDirectory = true;
            throw error;
        }
        node._entries[name] = new DirectoryNode(self);
    });
};

MockFs.prototype.removeDirectory = function (path) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        var directory = self.directory(path);
        var name = self.base(path);
        var node = self._root._walk(directory);
        if (!node.isDirectory()) {
            throw new Error("Can't remove directory from non-directory: " + path);
        }
        if (!node._entries[name]) {
            throw new Error("Can't remove non-existant directory: " + path);
        }
        if (!node._entries[name].isDirectory()) {
            throw new Error("Can't remove non-directory: " + path);
        }
        delete node._entries[name];
    });
};

MockFs.prototype.stat = function (path) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        return self._root._walk(path)._follow(path);
    });
};

MockFs.prototype.statLink = function (path) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        var node = self._root._walk(path);
        if (!node.isSymbolicLink()) {
            throw new Error("Path is not symbolic link: " + JSON.stringify(path));
        }
        return node;
    });
};

MockFs.prototype.link = function (source, target) {
    var self = this;
    return Q.fcall(function () {
        source = self.absolute(source);
        target = self.absolute(target);
        var sourceNode = self._root._walk(source)._follow(source);
        if (!sourceNode.isFile()) {
            throw new Error("Can't link non-file: " + source);
        }
        var directory = self.directory(target);
        var base = self.base(target);
        var targetNode = self._root._walk(directory)._follow(directory);
        if (!targetNode.isDirectory()) {
            throw new Error("Can't create link in non-directory: " + target);
        }
        if (targetNode._entries[base] && targetNode._entries[base].isDirectory()) {
            throw new Error("Can't overwrite existing directory with hard link: " + target);
        }
        targetNode._entries[base] = sourceNode;
    });
};

MockFs.prototype.symbolicLink = function (target, relative, type) {
    var self = this;
    return Q.fcall(function () {
        target = self.absolute(target);
        var directory = self.directory(target);
        var base = self.base(target);
        var node = self._root._walk(directory);
        if (node._entries[base] && node._entries[base].isDirectory()) {
            throw new Error("Can't overwrite existing directory with symbolic link: " + target);
        }
        node._entries[base] = new LinkNode(self, relative);
    });
};

MockFs.prototype.chown = function (path, owner) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        self._root._walk(path)._follow(path)._owner = owner;
    });
};

MockFs.prototype.chmod = function (path, mode) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        self._root._walk(path)._follow(path)._mode = mode;
    });
};

MockFs.prototype.move = function (source, target) {
    var self = this;
    return Q.fcall(function () {
        source = self.absolute(source);
        target = self.absolute(target);

        var sourceDirectory = self.directory(source);
        var sourceDirectoryNode = self._root._walk(sourceDirectory)._follow(sourceDirectory);
        var sourceName = self.base(source);
        var sourceNode = sourceDirectoryNode._entries[sourceName];

        if (!sourceNode) {
            var error = new Error("Can't copy non-existent file: " + source);
            error.code = "ENOENT";
            throw error;
        }

        sourceNode = sourceNode._follow(source);

        // check again after following symbolic links
        if (!sourceNode) {
            var error = new Error("Can't copy non-existent file: " + source);
            error.code = "ENOENT";
            throw error;
        }

        var targetDirectory = self.directory(target);
        var targetDirectoryNode = self._root._walk(targetDirectory)._follow(targetDirectory);
        var targetName = self.base(target);
        var targetNode = targetDirectoryNode._entries[targetName]; // might not exist, not followed

        if (targetNode) {
            targetNode = targetNode._follow(target);
        }

        if (targetNode && targetNode.isDirectory()) {
            var error = new Error("Can't copy over existing directory: " + target);
            error.code = "EISDIR";
            throw error;
        }

        // do not copy over self, even with symbolic links to confuse the issue
        if (targetNode === sourceNode) {
            return;
        }

        targetDirectoryNode._entries[targetName] = sourceNode;
        delete sourceDirectoryNode._entries[sourceName];
    });
};

MockFs.prototype.readLink = function (path) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        var node = self._root._walk(path);
        if (!self.isSymbolicLink()) {
            throw new Error("Can't read non-symbolic link: " + path);
        }
        return node._link;
    });
};

MockFs.prototype.canonical = function (path) {
    var self = this;
    return Q.fcall(function () {
        path = self.absolute(path);
        return self._root._canonical(path);
    });
};

MockFs.mock = mock;
function mock(fs, root) {
    return Q.when(fs.listTree(root), function (list) {
        var tree = {};
        return Q.all(list.map(function (path) {
            var actual = fs.join(root, path);
            var relative = fs.relativeFromDirectory(root, actual);
            return Q.when(fs.stat(actual), function (stat) {
                if (stat.isFile()) {
                    return Q.when(fs.read(path, "rb"), function (content) {
                        tree[relative] = content;
                    });
                }
            });
        })).then(function () {
            return MockFs(tree);
        });
    });
}

function Node(fs) {
    if (!fs)
        throw new Error("FS required argument");
    this._fs = fs;
    this._accessed = this._modified = new Date();
    this._mode = parseInt("0644", 8);
    this._owner = null;
}

Node.prototype._walk = function (path, make, via) {
    var parts = this._fs.split(path);
    if (this._fs.isAbsolute(path)) {
        parts.shift();
        return this._fs._root._walkParts(parts, make, this._fs.ROOT);
    } else {
        return this._walkParts(parts, make, via || this._fs.ROOT);
    }
};

Node.prototype._walkParts = function (parts, make, via) {
    if (parts.length === 0) {
        return this;
    } else {
        var part = parts.shift();
        if (part === "") {
            return this._walkParts(parts, make, this._fs.join(via, part));
        } else {
            throw new Error("Can't find " + JSON.stringify(this._fs.resolve(part, this._fs.join(parts))) + " via " + JSON.stringify(via));
        }
    }
};

Node.prototype._canonical = function (path) {
    if (!this._fs.isAbsolute(path)) {
        throw new Error("Path must be absolute for _canonical: " + path);
    }
    var parts = this._fs.split(path);
    parts.shift();
    var via = this._fs.ROOT;
    return via + this._fs._root._canonicalParts(parts, via);
};

Node.prototype._canonicalParts = function (parts, via) {
    if (parts.length === 0) {
        return via;
    }
    return this._fs.join(via, this._fs.join(parts));
};

Node.prototype._follow = function () {
    return this;
};

Node.prototype._touch = function () {
    this._modified = new Date();
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
    Node.prototype[name] = function () {
        return false;
    };
});

Node.prototype.lastAccessed = function () {
    return this._accessed;
};

Node.prototype.lastModified = function () {
    return this._modified;
};

function FileNode(fs) {
    Node.call(this, fs);
    this._chunks = [];
}

FileNode.prototype = Object.create(Node.prototype);

FileNode.prototype.isFile = function () {
    return true;
};

function DirectoryNode(fs) {
    Node.call(this, fs);
    this._entries = Object.create(null);
    this._mode = parseInt("0755", 8);
}

DirectoryNode.prototype = Object.create(Node.prototype);

DirectoryNode.prototype.isDirectory = function () {
    return true;
};

DirectoryNode.prototype._walkParts = function (parts, make, via) {
    via = via || this._fs.ROOT;
    if (parts.length === 0) {
        return this;
    }
    var part = parts.shift();
    if (part === "") {
        return this._walkParts(parts, make, this._fs.join(via, part));
    }
    if (!this._entries[part]) {
        if (make) {
            this._entries[part] = new DirectoryNode(this._fs);
        } else {
            throw new Error("Can't find " + JSON.stringify(this._fs.join(parts)) + " via " + JSON.stringify(via));
        }
    }
    return this._entries[part]._walkParts(parts, make, this._fs.join(via, part));
};

DirectoryNode.prototype._canonicalParts = function (parts, via) {
    if (parts.length === 0) {
        return via;
    }
    var part = parts.shift();
    if (part === "") {
        return via;
    }
    if (via === this._fs.ROOT) {
        via = "";
    }
    if (!this._entries[part]) {
        return this._fs.join(via, part, this._fs.join(parts));
    }
    return this._entries[part]._canonicalParts(
        parts,
        this._fs.join(via, part)
    );
};

function LinkNode(fs, link) {
    Node.call(this, fs);
    this._link = link;
}

LinkNode.prototype = Object.create(Node.prototype);

LinkNode.prototype.isSymbolicLink = function () {
    return true;
};

LinkNode.prototype._follow = function (via, memo) {
    memo = memo || Set();
    if (memo.has(this)) {
        var error = new Error("Can't follow symbolic link cycle at " + JSON.stringify(via));
        error.code = "ELOOP";
        throw error;
    }
    memo.add(this);
    var link = this._fs.join(via, "..", this._link);
    return this._walk(link, null, "<link>")._follow(link, memo);
};

LinkNode.prototype._canonicalParts = function (parts, via) {
    return this._fs.relativeFromDirectory(this._fs.ROOT,
        this._fs._root._canonical(
            this._fs.absolute(this._fs.join(via, "..", this._link))
        )
    );
};

// cycle breaking
var FS = require("./fs");

