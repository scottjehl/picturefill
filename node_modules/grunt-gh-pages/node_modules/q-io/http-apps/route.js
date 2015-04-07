
var Q = require("q");
var StatusApps = require("./status");

/**
 * Makes a  Q-JSGI app that only responds when there is nothing left
 * on the path to route.  If the there is unprocessed data on the
 * path, the returned app either forwards to the `notFound` app or
 * returns a `404 Not Found` response.
 *
 * @param {App} app a Q-JSGI application to
 * respond to this end of the routing chain.
 * @param {App} notFound (optional) defaults
 * to the `notFound` app.
 * @returns {App}
 */
exports.Cap = function (app, notFound) {
    notFound = notFound || StatusApps.notFound;
    return function (request, response) {
        // TODO Distinguish these cases
        if (request.pathInfo === "" || request.pathInfo === "/") {
            return app(request, response);
        } else {
            return notFound(request, response);
        }
    };
};

/**
 * Wraps an app with a function that will observe incoming requests
 * before giving the app an opportunity to respond.  If the "tap"
 * function returns a response, it will be used in lieu of forwarding
 * the request to the wrapped app.
 */
exports.Tap = function (app, tap) {
    return function (request, response) {
        var self = this, args = arguments;
        return Q.when(tap.apply(this, arguments), function (response) {
            if (response) {
                return response;
            } else {
                return app.apply(self, args);
            }
        });
    };
};

/**
 * Wraps an app with a "trap" function that intercepts and may
 * alter or replace the response of the wrapped application.
 */
exports.Trap = function (app, trap) {
    return function (request, response) {
        return Q.when(app.apply(this, arguments), function (response) {
            if (response) {
                response.headers = response.headers || {};
                return trap(response, request) || response;
            }
        });
    };
};

/**
 * Makes a Q-JSGI app that branches requests based on the next
 * unprocessed path component.
 * @param {Object * App} paths a mapping from path components (single
 * file or directory names) to Q-JSGI applications for subsequent
 * routing.  The mapping may be a plain JavaScript `Object` record,
 * which must own the mapping properties, or an object that has
 * `has(key)` and `get(key)` methods in its prototype chain.
 * @param {App} notFound a Q-JSGI application
 * that handles requests for which the next file name does not exist
 * in paths.
 * @returns {App}
 */
exports.Branch = function (paths, notFound) {
    if (!paths)
        paths = {};
    if (!notFound)
        notFound = StatusApps.notFound;
    return function (request, response) {
        if (!/^\//.test(request.pathInfo)) {
            return notFound(request, response);
        }
        var path = request.pathInfo.slice(1);
        var parts = path.split("/");
        var part = decodeURIComponent(parts.shift());
        if (Object.has(paths, part)) {
            request.scriptName = request.scriptName + part + "/";
            request.pathInfo = path.slice(part.length);
            return Object.get(paths, part)(request, response);
        }
        return notFound(request, response);
    };
};

/**
 * Returns the response of the first application that returns a
 * non-404 response status.
 *
 * @param {Array * App} apps a cascade of applications to try
 * successively until one of them returns a non-404 status.
 * @returns {App}
 */
exports.FirstFound = function (cascade) {
    return function (request, response) {
        var i = 0, ii = cascade.length;
        function next() {
            var response = cascade[i++](request, response);
            if (i < ii) {
                return Q.when(response, function (response) {
                    if (response.status === 404) {
                        return next();
                    } else {
                        return response;
                    }
                });
            } else {
                return response;
            }
        }
        return next();
    };
};

