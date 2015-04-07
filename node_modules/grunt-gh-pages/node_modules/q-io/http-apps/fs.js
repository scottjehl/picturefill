
var Q = require("q");
var URL = require("url2");
var MimeTypes = require("mime");
var FS = require("../fs");
var StatusApps = require("./status");
var RedirectApps = require("./redirect");
var Negotiation = require("./negotiate");
var HtmlApps = require("./html");

/**
 * @param {String} path
 * @param {String} contentType
 * @returns {App}
 */
exports.File = function (path, contentType) {
    return function (request, response) {
        return exports.file(request, String(path), contentType);
    };
};

/**
 * @param {String} path
 * @param {{
       notFound,
       file,
       directory,
       contentType,
       redirectSymbolicLinks:Boolean,
       redirect:Function(location),
       permanent:Boolean
 * }} options
 * @returns {App}
 */
exports.FileTree = function (root, options) {
    if (!options)
        options = {};
    options.notFound = options.notFound || StatusApps.notFound;
    options.file = options.file || exports.file;
    options.directory = options.directory || exports.directory;
    options.fs = options.fs || FS;
    var fs = options.fs;
    root = fs.canonical(root);
    return function (request, response) {
        var location = URL.parse(request.url);
        request.fs = fs;
        var redirect = options.redirect || (
            request.permanent || options.permanent ?
            RedirectApps.permanentRedirect :
            RedirectApps.temporaryRedirect
        );
        return Q.when(root, function (root) {
            var path = fs.join(root, request.pathInfo.slice(1));
            return Q.when(fs.canonical(path), function (canonical) {
                if (!fs.contains(root, canonical))
                    return options.notFound(request, response);
                if (path !== canonical && options.redirectSymbolicLinks)
                    return redirect(request, fs.relativeFromFile(path, canonical));
                // TODO: relativeFromFile should be designed for URL’s, not generalized paths.
                // HTTP.relative(pathToDirectoryLocation(path), pathToFile/DirectoryLocation(canonical))
                return Q.when(fs.stat(canonical), function (stat) {
                    if (stat.isFile()) {
                        return options.file(request, canonical, options.contentType, fs);
                    } else if (stat.isDirectory()) {
                        return options.directory(request, canonical, options.contentType);
                    } else {
                        return options.notFound(request, response);
                    }
                });
            }, function (reason) {
                return options.notFound(request, response);
            });
        });
    };
};

exports.file = function (request, path, contentType, fs) {
    fs = fs || FS;
    // TODO last-modified header
    contentType = contentType || MimeTypes.lookup(path);
    return Q.when(fs.stat(path), function (stat) {
        var etag = exports.etag(stat);
        var options = {
            flags: "rb"
        };
        var range;
        var status = 200;
        var headers = {
            "content-type": contentType,
            etag: etag
        };

        // Partial range requests
        if ("range" in request.headers) {
            // Invalid cache
            if (
                "if-range" in request.headers &&
                etag != request.headers["if-range"]
            ) {
                // Normal 200 for entire, altered content
            } else {
                // Truncate to the first requested continuous range
                range = interpretFirstRange(request.headers["range"]);
                // Like Apache, ignore the range header if it is invalid
                if (range) {
                    if (range.end > stat.size)
                        return StatusApps.responseForStatus(request, 416); // not satisfiable
                    status = 206; // partial content
                    headers["content-range"] = (
                        "bytes " +
                        range.begin + "-" + (range.end - 1) +
                        "/" + stat.size
                    );
                    headers["content-length"] = "" + (range.end - range.begin);
                }
                options.begin = range.begin;
                options.end = range.end;
            }
        // Full requests
        } else {
            // Cached
            // We do not use date-based caching
            // TODO consider if-match?
            if (etag == request.headers["if-none-match"])
                return StatusApps.responseForStatus(request, 304);
            headers["content-length"] = "" + stat.size;
        }

        // TODO sendfile
        return {
            status: status,
            headers: headers,
            body: fs.open(path, options),
            file: path,
            range: range
        };
    });
};

var rangesExpression = /^\s*bytes\s*=\s*(\d*\s*-\s*\d*\s*(?:,\s*\d*\s*-\s*\d*\s*)*)$/;
var rangeExpression = /^\s*(\d*)\s*-\s*(\d*)\s*$/;

var interpretRange = function (text, size) {
    var match = rangeExpression.exec(text);
    if (!match)
        return;
    if (match[1] == "" && match[2] == "")
        return;
    var begin, end;
    if (match[1] == "") {
        begin = size - match[2];
        end = size;
    } else if (match[2] == "") {
        begin = +match[1];
        end = size;
    } else {
        begin = +match[1];
        end = +match[2] + 1;
    }
    return {
        begin: begin,
        end: end
    };
};

var interpretFirstRange = exports.interpretFirstRange = function (text, size) {
    var match = rangesExpression.exec(text);
    if (!match)
        return;
    var texts = match[1].split(/\s*,\s*/);
    var range = interpretRange(texts[0], size);
    for (var i = 0, ii = texts.length; i < ii; i++) {
        var next = interpretRange(texts[i], size);
        if (!next)
            break;
        if (next.begin <= range.end) {
            range.end = next.end;
        } else {
            break;
        }
    }
    return range;
};

/**
 * @param {Stat}
 * @returns {String}
 */
exports.etag = function (stat) {
    return [
        stat.node.ino,
        stat.size,
        stat.lastModified().getTime()
    ].join("-");
};

/**
 * @param {Request} request
 * @param {String} path
 * @param {Response}
 */
exports.directory = function (request, path) {
    var response = StatusApps.notFound(request);
    response.directory = path;
    return response;
};

exports.ListDirectories = function (app, listDirectory) {
    listDirectory = listDirectory || exports.listDirectory;
    return function (request) {
        if (request.directoryIndex) {
            throw new Error("DirectoryIndex must be used after ListDirectories");
        }
        request.listDirectories = true;
        return Q.fcall(app, request)
        .then(function (response) {
            if (response.directory !== void 0) {
                return exports.listDirectory(request, response);
            } else {
                return response;
            }
        });
    };
};

exports.listDirectory = function (request, response) {
    // TODO advisory to have JSON or HTML fragment handler.
    request.location = URL.parse(request.path);
    if (request.location.file) {
        return RedirectApps.redirect(request, request.location.file + "/");
    }
    var handlers = {};
    handlers["text/plain"] = exports.listDirectoryText;
    handlers["text/markdown"] = exports.listDirectoryMarkdown;
    if (request.handleHtmlFragmentResponse) {
        handlers["text/html"] = exports.listDirectoryHtmlFragment;
    }
    if (request.handleJsonResponse) {
        handlers["application/json"] = exports.listDirectoryJson;
    }
    var handleResponse = Negotiation.negotiate(request, handlers) || function () {
        return response;
    };
    return handleResponse(request, response);
};

exports.listDirectoryHtmlFragment = function (request, response) {
    return exports.listDirectoryData(request, response)
    .then(function (data) {
        return {
            status: 200,
            headers: {
                "content-type": "text/html"
            },
            htmlTitle: "Directory Index",
            htmlFragment: {
                forEach: function (write) {
                    write("<ul class=\"directory-index\">\n");
                    Object.keys(data).sort().forEach(function (name) {
                        var stat = data[name];
                        var suffix = "";
                        if (stat.type === "directory") {
                            suffix = "/";
                        }
                        write("    <li class=\"entry " + stat.type + "\"><a href=\"" + HtmlApps.escapeHtml(name + suffix) + "\">" + HtmlApps.escapeHtml(name + suffix) + "</a></li>\n");
                    });
                    write("</ul>\n");
                }
            }
        };
    });
};

exports.listDirectoryText = function (request, response) {
    return exports.listDirectoryData(request, response)
    .then(function (data) {
        return {
            status: 200,
            headers: {
                "content-type": "text/plain"
            },
            body: {
                forEach: function (write) {
                    Object.keys(data).sort().forEach(function (name) {
                        var stat = data[name];
                        var suffix = "";
                        if (stat.type === "directory") {
                            suffix = "/";
                        }
                        write(name + suffix + "\n");
                    });
                }
            }
        };
    });
};

exports.listDirectoryMarkdown = function (request, response) {
    return exports.listDirectoryData(request, response)
    .then(function (data) {
        return {
            status: 200,
            headers: {
                "content-type": "text/plain"
            },
            body: {
                forEach: function (write) {
                    write("\n# Directory Index\n\n");
                    Object.keys(data).forEach(function (name) {
                        var stat = data[name];
                        var suffix = "";
                        if (stat.type === "directory") {
                            suffix = "/";
                        }
                        write("-   " + name + suffix + "\n");
                    });
                    write("\n");
                }
            }
        };
    });
};

exports.listDirectoryJson = function (request, response) {
    return exports.listDirectoryData(request, response)
    .then(function (data) {
        return {
            status: 200,
            headers: {},
            data: data
        };
    });
};

exports.listDirectoryData = function (request, response) {
    if (!request.fs) {
        throw new Error("Can't list a directory without a designated file system");
    }
    var fs = request.fs;
    return Q.invoke(fs, "list", response.directory)
    .then(function (list) {
        list.sort();
        return list.map(function (name) {
            return Q.invoke(fs, "stat", fs.join(response.directory, name))
            .then(function (stat) {
                if (stat.isDirectory()) {
                    return {name: name, stat: {
                        type: "directory"
                    }};
                } else if (stat.isFile()) {
                    return {name: name, stat: {
                        type: "file"
                    }};
                }
            }, function () {
                // ignore unstatable entries
            });
        })
    })
    .all()
    .then(function (stats) {
        var data = {};
        stats.forEach(function (entry) {
            if (entry) {
                data[entry.name] = entry.stat;
            }
        });
        return data;
    });
};

exports.DirectoryIndex = function (app, indexFile) {
    indexFile = indexFile || "index.html";
    return function (request) {
        request.directoryIndex = true;
        request.location = URL.parse(request.path);
        // redirect index.html to containing directory
        // TODO worry about whether this file actually exists
        if (request.location.file === indexFile) {
            return RedirectApps.redirect(request, ".");
        } else {
            return Q.fcall(app, request)
            .then(function (response) {
                if (response.directory !== void 0) {
                    if (request.location.file) {
                        return RedirectApps.redirect(request, request.location.file + "/");
                    } else {
                        var index = request.fs.join(response.directory, indexFile);
                        return Q.invoke(request.fs, "isFile", index)
                        .then(function (isFile) {
                            if (isFile) {
                                request.url = URL.resolve(request.url, indexFile);
                                request.pathInfo += indexFile;
                                return app(request);
                            } else {
                                return response;
                            }
                        });
                    }
                } else {
                    return response;
                }
            });
        }
    };
};

