
var URL = require("url");

// Node’s URL parse produces:
// http://user:password@foo.com:8080/path/to/foo/bar?a=10&c=20&d=30#hash
// ^   ^^^^- auth ----^ ^-----^    |^- pathname----^^- search-----^^   ^
// |   |||              hostname   |                 ^- query ----^|   |
// proto||              |       ^--^^- path ----------------------^|   |
// |    slashes         |       port                               hash^
// |                    ^- host ---^                                   |
// ^- href ------------------------------------------------------------^

// Node's URL format uses:
//  protocol: gets a colon added if it doesn't have one yet
//  slashes: used
//  auth: used
//  hostname: used if there's no host
//  port: used if there's no host
//  path: NOT USED AT ALL EVER
//  pathname: used
//  search: used
//  query: used if object and no search
//  hash: used

exports.resolve = URL.resolve;
exports.resolveObject = URL.resolveObject;

exports.parse = parse;
function parse(url) {
    var object = URL.parse(url);
    object.pathname = object.pathname || "";
    object.root = !!object.pathname.length && object.pathname[0] === "/";
    if (object.root) {
        object.relative = object.pathname.slice(1);
    } else {
        object.relative = object.pathname;
    }
    if (object.relative.length) {
        object.directories = object.relative.split("/");
        object.file = object.directories.pop();
    } else {
        object.directories = [];
        object.file = null;
    }
    return object;
}

exports.format = format;
function format(object) {

    if ("file" in object) {
        object.directories.push(object.file);
        delete object.file;
    }

    if ("directories" in object) {
        object.relative = object.directories.join("/");
        delete object.directories;
    }

    if ("relative" in object) {
        if (object.root) {
            object.pathname = "/" + object.relative;
        } else {
            object.pathname = object.relative;
        }
        delete object.relative;
    }

    if (object.path != null) {
        var index = object.path.indexOf("?");
        if (index == -1) {
            object.pathname = object.path;
            object.search = "";
        } else {
            object.pathname = object.path.slice(0, index);
            object.search = object.path.slice(index);
        }
    }

    return URL.format(object);
}

exports.relativeObject = relativeObject;
function relativeObject(source, target) {
    source = parse(source);
    target = parse(target);

    delete target.href;

    if (
        target.protocol === source.protocol &&
        target.slashes === source.slashes &&
        target.auth === source.auth &&
        target.host === source.host
    ) {
        delete target.protocol;
        delete target.slashes;
        delete target.auth;
        delete target.hostname;
        delete target.port;
        delete target.host;

        if (
            !!target.root == !!source.root && !(
                target.root &&
                target.directories[0] != source.directories[0]
            )
        ) {
            delete target.path;
            delete target.root;
            while (
                source.directories.length &&
                target.directories.length &&
                target.directories[0] == source.directories[0]
            ) {
                target.directories.shift();
                source.directories.shift();
            }
            while (source.directories.length) {
                source.directories.shift();
                target.directories.unshift('..');
            }

            if (
                !target.root &&
                !target.directories.length &&
                !target.file && source.file
            ) {
                target.directories.push('.');
            }

            if (
                target.directories.length === 0 &&
                target.file === null &&
                source.search
            ) {
                target.search = source.search;
            }

        }
    }

    return target;
}

exports.relative = relative;
function relative(source, target) {
    return format(relativeObject(source, target));
}

