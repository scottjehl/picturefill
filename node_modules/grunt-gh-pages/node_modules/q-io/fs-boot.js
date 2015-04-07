(function (exports) {

// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson TODO

/**
 * Pure JavaScript implementations of file system path
 * manipulation.
 */

// NOTE: this file may be used is the engine bootstrapping
// process, so any "requires" must be accounted for in
// narwhal.js

/*whatsupdoc*/
/*markup markdown*/

var regExpEscape = function (str) {
    return str.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&");
};

var path = require("path");

/**
 * @name ROOT
 * * `/` on Unix
 * * `\` on Windows
 */

/**
 * @name SEPARATOR
 * * `/` on Unix
 * * `\` on Windows
 */

/**
 * @name ALT_SEPARATOR
 * * undefined on Unix
 * * `/` on Windows
 */

exports.ROOT = exports.SEPARATOR = path.sep;
if (path.sep === "\\") {
    exports.ALT_SEPARATOR = "/";
} else {
    exports.ALT_SEPARATOR = undefined;
}

// we need to make sure the separator regex is always in sync with the separators.
// this caches the generated regex and rebuild if either separator changes.
var separatorCached, altSeparatorCached, separatorReCached;
/**
 * @function
 */
exports.SEPARATORS_RE = function () {
    if (
        separatorCached !== exports.SEPARATOR ||
        altSeparatorCached !== exports.ALT_SEPARATOR
    ) {
        separatorCached = exports.SEPARATOR;
        altSeparatorCached = exports.ALT_SEPARATOR;
        separatorReCached = new RegExp("[" +
            (separatorCached || "").replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&") +
            (altSeparatorCached || "").replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&") +
        "]", "g");
    }
    return separatorReCached;
}

/**
 * separates a path into components.  If the path is
 * absolute, the first path component is the root of the
 * file system, indicated by an empty string on Unix, and a
 * drive letter followed by a colon on Windows.
 * @returns {Array * String}
 */
exports.split = function (path) {
    var parts;
    try {
        parts = String(path).split(exports.SEPARATORS_RE());
    } catch (exception) {
        throw new Error("Cannot split " + (typeof path) + ", " + JSON.stringify(path));
    }
    // this special case helps isAbsolute
    // distinguish an empty path from an absolute path
    // "" -> [] NOT [""]
    if (parts.length === 1 && parts[0] === "")
        return [];
    // "a" -> ["a"]
    // "/a" -> ["", "a"]
    return parts;
};

/**
 * Takes file system paths as variadic arguments and treats
 * each as a file or directory path and returns the path
 * arrived by traversing into the those paths.  All
 * arguments except for the last must be paths to
 * directories for the result to be meaningful.
 * @returns {String} path
 */
exports.join = function () {
    if (arguments.length === 1 && Array.isArray(arguments[0]))
        return exports.normal.apply(exports, arguments[0]);
    return exports.normal.apply(exports, arguments);
};

/**
 * Takes file system paths as variadic arguments and treats
 * each path as a location, in the URL sense, resolving each
 * new location based on the previous.  For example, if the
 * first argument is the absolute path of a JSON file, and
 * the second argument is a path mentioned in that JSON
 * file, `resolve` returns the absolute path of the
 * mentioned file.
 * @returns {String} path
 */
exports.resolve = function () {
    var root = "";
    var parents = [];
    var children = [];
    var leaf = "";
    for (var i = 0; i < arguments.length; i++) {
        var path = String(arguments[i]);
        if (path == "")
            continue;
        var parts = path.split(exports.SEPARATORS_RE());
        if (exports.isAbsolute(path)) {
            root = parts.shift() + exports.SEPARATOR;
            parents = [];
            children = [];
        }
        leaf = parts.pop();
        if (leaf == "." || leaf == "..") {
            parts.push(leaf);
            leaf = "";
        }
        for (var j = 0; j < parts.length; j++) {
            var part = parts[j];
            if (part == "." || part == "") {
            } else if (part == "..") {
                if (children.length) {
                    children.pop();
                } else {
                    if (root) {
                    } else {
                        parents.push("..");
                    }
                }
            } else {
                children.push(part);
            }
        };
    }
    path = parents.concat(children).join(exports.SEPARATOR);
    if (path) leaf = exports.SEPARATOR + leaf;
    return root + path + leaf;
};

/**
 * Takes paths as any number of arguments and reduces them
 * into a single path in normal form, removing all "." path
 * components, and reducing ".." path components by removing
 * the previous path component if possible.
 * @returns {String} path
 */
exports.normal = function () {
    var root = "";
    var parents = [];
    var children = [];
    for (var i = 0, ii = arguments.length; i < ii; i++) {
        var path = String(arguments[i]);
        // empty paths have no affect
        if (path === "")
            continue;
        var parts = path.split(exports.SEPARATORS_RE());
        if (exports.isAbsolute(path)) {
            root = parts.shift() + exports.SEPARATOR;
            parents = [];
            children = [];
        }
        for (var j = 0, jj = parts.length; j < jj; j++) {
            var part = parts[j];
            if (part === "." || part === "") {
            } else if (part == "..") {
                if (children.length) {
                    children.pop();
                } else {
                    if (root) {
                    } else {
                        parents.push("..");
                    }
                }
            } else {
                children.push(part);
            }
        }
    }
    path = parents.concat(children).join(exports.SEPARATOR);
    return root + path;
};

/***
 * @returns {Boolean} whether the given path begins at the
 * root of the file system or a drive letter.
 */
exports.isAbsolute = function (path) {
    // for absolute paths on any operating system,
    // the first path component always determines
    // whether it is relative or absolute.  On Unix,
    // it is empty, so ["", "foo"].join("/") == "/foo",
    // "/foo".split("/") == ["", "foo"].
    var parts = exports.split(path);
    // split("") == [].  "" is not absolute.
    // split("/") == ["", ""] is absolute.
    // split(?) == [""] does not occur.
    if (parts.length == 0)
        return false;
    return exports.isRoot(parts[0]);
};

/**
 * @returns {Boolean} whether the given path does not begin
 * at the root of the file system or a drive letter.
 */
exports.isRelative = function (path) {
    return !exports.isAbsolute(path);
};

/**
 * @returns {Boolean} whether the given path component
 * corresponds to the root of the file system or a drive
 * letter, as applicable.
 */
exports.isRoot = function (first) {
    if (exports.SEPARATOR === "\\") {
        return /[a-zA-Z]:$/.test(first);
    } else {
        return first == "";
    }
};

/**
 * @returns {String} the Unix root path or corresponding
 * Windows drive for a given path.
 */
exports.root = function (path) {
    if (!exports.isAbsolute(path))
        path = require("./fs").absolute(path);
    var parts = exports.split(path);
    return exports.join(parts[0], "");
};

/**
 * @returns {String} the parent directory of the given path.
 */
exports.directory = function (path) {
    path = exports.normal(path);
    var absolute = exports.isAbsolute(path);
    var parts = exports.split(path);
    // XXX needs to be sensitive to the root for
    // Windows compatibility
    if (parts.length) {
        if (parts[parts.length - 1] == "..") {
            parts.push("..");
        } else {
            parts.pop();
        }
    } else {
        parts.unshift("..");
    }
    return parts.join(exports.SEPARATOR) || (
        exports.isRelative(path) ?
        "" : exports.ROOT
    );
};

/**
 * @returns {String} the last component of a path, without
 * the given extension if the extension is provided and
 * matches the given file.
 * @param {String} path
 * @param {String} extention an optional extention to detect
 * and remove if it exists.
 */
exports.base = function (path, extension) {
    var base = path.split(exports.SEPARATORS_RE()).pop();
    if (extension)
        base = base.replace(
            new RegExp(regExpEscape(extension) + "$"),
            ""
        );
    return base;
};

/**
 * @returns {String} the extension (e.g., `txt`) of the file
 * at the given path.
 */
exports.extension = function (path) {
    path = exports.base(path);
    path = path.replace(/^\.*/, "");
    var index = path.lastIndexOf(".");
    return index <= 0 ? "" : path.substring(index);
};

})(typeof exports !== "undefined" ? exports : FS_BOOT = {});
