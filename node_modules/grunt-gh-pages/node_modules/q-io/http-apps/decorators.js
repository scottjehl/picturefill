
var Q = require("q");
var HTTP = require("../http");
var RouteApps = require("./route");
var StatusApps = require("./status");

exports.Normalize = function (app) {
    return function (request, response) {
        var request = HTTP.normalizeRequest(request);
        return Q.when(app(request, response), function (response) {
            return HTTP.normalizeResponse(response);
        });
    };
};

exports.Date = function (app, present) {
    present = present || function () {
        return new Date();
    };
    return RouteApps.Trap(app, function (response, request) {
        response.headers["date"] = "" + present();
    });
};

/**
 * Decorates a JSGI application such that rejected response promises
 * get translated into `500` server error responses with no content.
 *
 * @param {App} app
 * @returns {App}
 */
exports.Error = function (app, debug) {
    return function (request, response) {
        return Q.when(app(request, response), null, function (error) {
            if (!debug)
                error = undefined;
            return StatusApps.responseForStatus(request, 500, error && error.stack || error);
        });
    };
};

exports.Debug = function (app) {
    return exports.Error(app, true);
};

/**
 * Decorates a Q-JSGI application such that all requests and responses
 * are logged.
 *
 * @param {App} app
 * @returns {App}
 */
exports.Log = function (app, log, stamp) {
    log = log || console.log;
    stamp = stamp || function (message) {
        return new Date().toISOString() + " " + message;
    };
    return function (request, response) {
        var remoteHost =
            request.remoteHost + ":" +
            request.remotePort;
        var requestLine =
            request.method + " " +
            request.path + " " +
            "HTTP/" + request.version.join(".");
        log(stamp(
            remoteHost + " " +
            "-->     " +
            requestLine
        ));
        return Q.when(app(request, response), function (response) {
            if (response) {
                log(stamp(
                    remoteHost + " " +
                    "<== " +
                    response.status + " " +
                    requestLine + " " +
                    (response.headers["content-length"] || "-")
                ));
            } else {
                log(stamp(
                    remoteHost + " " +
                    "... " +
                    "... " +
                    requestLine + " (response undefined / presumed streaming)"
                ));
            }
            return response;
        }, function (reason) {
            log(stamp(
                remoteHost + " " +
                "!!!     " +
                requestLine + " " +
                (reason && reason.message || reason)
            ));
            return Q.reject(reason);
        });
    };
};

/**
 * Decorates a Q-JSGI application such that all responses have an
 * X-Response-Time header with the time between the request and the
 * response in milliseconds, not including any time needed to stream
 * the body to the client.
 *
 * @param {App} app
 * @returns {App}
 */
exports.Time = function (app) {
    return function (request, response) {
        var start = new Date();
        return Q.when(app(request, response), function (response) {
            var stop = new Date();
            if (response && response.headers) {
                response.headers["x-response-time"] = "" + (stop - start);
            }
            return response;
        });
    };
};

/**
 * Decorates a Q-JSGI application such that all responses have the
 * given additional headers.  These headers do not override the
 * application's given response headers.
 *
 * @param {Object} headers
 * @param {App} app decorated application.
 */
exports.Headers = function (app, headers) {
    return function (request, response) {
        return Q.when(app(request, response), function (response) {
            if (response && response.headers) {
                Object.keys(headers).forEach(function (key) {
                    if (!(key in response.headers)) {
                        response.headers[key] = headers[key];
                    }
                });
            }
            return response;
        });
    };
};

var farFuture =
    1000 * // ms
    60 * // s
    60 * // m
    24 * // h
    365 * // d
    10; // years
exports.Permanent = function (app, future) {
    future = future || function () {
        return new Date(new Date().getTime() + farFuture);
    };
    app = RouteApps.Tap(app, function (request, response) {
        request.permanent = future;
    });
    app = RouteApps.Trap(app, function (response, request) {
        response.headers["expires"] = "" + future();
    });
    return app;
};

/**
 * Wraps a Q-JSGI application in a sequence of decorators.
 * @param {Array * Decorator} decorators
 * @param {App} app
 * @returns {App}
 */
exports.Decorators = function (decorators, app) {
    decorators.reversed().forEach(function (Middleware) {
        app = Middleware(app);
    });
    return app;
};

