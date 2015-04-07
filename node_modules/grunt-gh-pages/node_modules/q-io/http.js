/**
 * A promise-based Q-JSGI server and client API.
 * @module
 */

/*whatsupdoc*/

var HTTP = require("http"); // node
var HTTPS = require("https"); // node
var URL = require("url2"); // node
var Q = require("q");
var Reader = require("./reader");

/**
 * @param {respond(request Request)} respond a JSGI responder function that
 * receives a Request object as its argument.  The JSGI responder promises to
 * return an object of the form `{status, headers, body}`.  The status and
 * headers must be fully resolved, but the body may be a promise for an object
 * with a `forEach(write(chunk String))` method, albeit an array of strings.
 * The `forEach` method may promise to resolve when all chunks have been
 * written.
 * @returns a Node Server object.
 */
exports.Server = function (respond) {
    var self = Object.create(exports.Server.prototype);

    var server = HTTP.createServer(function (_request, _response) {
        var request = exports.ServerRequest(_request);
        var response = exports.ServerResponse(_response);

        var closed = Q.defer();
        _request.on("end", function (error, value) {
            if (error) {
                closed.reject(error);
            } else {
                closed.resolve(value);
            }
        });

        Q.when(request, function (request) {
            return Q.when(respond(request, response), function (response) {
                if (!response)
                    return;

                _response.writeHead(response.status, response.headers);

                if (response.onclose || response.onClose)
                    Q.when(closed, response.onclose || response.onClose);

                return Q.when(response.body, function (body) {
                    var length;
                    if (
                        Array.isArray(body) &&
                        (length = body.length) &&
                        body.every(function (chunk) {
                            return typeof chunk === "string"
                        })
                    ) {
                        body.forEach(function (chunk, i) {
                            if (i < length - 1) {
                                _response.write(chunk, response.charset);
                            } else {
                                _response.end(chunk, response.charset);
                            }
                        });
                    } else if (body) {
                        var end;
                        var done = body.forEach(function (chunk) {
                            end = Q.when(end, function () {
                                return Q.when(chunk, function (chunk) {
                                    _response.write(chunk, response.charset);
                                });
                            });
                        });
                        return Q.when(done, function () {
                            return Q.when(end, function () {
                                _response.end();
                            });
                        });
                    } else {
                        _response.end();
                    }
                });

            })
        })
        .done(); // should be .fail(self.emitter("error"))

    });

    var stopped = Q.defer();
    server.on("close", function (err) {
        if (err) {
            stopped.reject(err);
        } else {
            stopped.resolve();
        }
    });

    /***
     * Stops the server.
     * @returns {Promise * Undefined} a promise that will
     * resolve when the server is stopped.
     */
    self.stop = function () {
        server.close();
        listening = undefined;
        return stopped.promise;
    };

    var listening = Q.defer();
    server.on("listening", function (err) {
        if (err) {
            listening.reject(err);
        } else {
            listening.resolve(self);
        }
    });

    /***
     * Starts the server, listening on the given port
     * @param {Number} port
     * @returns {Promise * Undefined} a promise that will
     * resolve when the server is ready to receive
     * connections
     */
    self.listen = function (/*...args*/) {
        if (typeof server.port !== "undefined")
            return Q.reject(new Error("A server cannot be restarted or " +
            "started on a new port"));
        server.listen.apply(server, arguments);
        return listening.promise;
    };

    self.stopped = stopped.promise;

    self.node = server;
    self.nodeServer = server; // Deprecated
    self.address = server.address.bind(server);

    return self;
};

Object.defineProperties(exports.Server, {

    port: {
        get: function () {
            return this.node.port;
        }
    },

    host: {
        get: function () {
            return this.node.host;
        }
    }

});

/**
 * A wrapper for a Node HTTP Request, as received by
 * the Q HTTP Server, suitable for use by the Q HTTP Client.
 */
exports.ServerRequest = function (_request, ssl) {
    var request = Object.create(_request);
    /*** {Array} HTTP version. (JSGI) */
    request.version = _request.httpVersion.split(".").map(Math.floor);
    /*** {String} HTTP method, e.g., `"GET"` (JSGI) */
    request.method = _request.method;
    /*** {String} path, starting with `"/"` */
    request.path = _request.url;
    /*** {String} pathInfo, starting with `"/"`, the
     * portion of the path that has not yet
     * been routed (JSGI) */
    request.pathInfo = URL.parse(_request.url).pathname;
    /*** {String} scriptName, the portion of the path that
     * has already been routed (JSGI) */
    request.scriptName = "";
    /*** {String} (JSGI) */
    request.scheme = "http";

    request.host = _request.headers.host;
    request.port = _request.connection.address().port;

    var socket = _request.socket;
    /*** {String} */
    request.remoteHost = socket.remoteAddress;
    /*** {Number} */
    request.remotePort = socket.remotePort;

    /*** {String} url */
    request.url = URL.format({
        protocol: request.scheme,
        host: _request.headers.host,
        port: request.port === (ssl ? 443 : 80) ? null : request.port,
        path: request.path
    });
    /*** A Q IO asynchronous text reader */
    request.body = Reader(_request);
    /*** {Object} HTTP headers (JSGI)*/
    request.headers = _request.headers;
    /*** The underlying Node request */
    request.node = _request;
    request.nodeRequest = _request; // Deprecated
    /*** The underlying Node TCP connection */
    request.nodeConnection = _request.connection;

    return Q.when(request.body, function (body) {
        request.body = body;
        return request;
    });
};

exports.ServerResponse = function (_response, ssl) {
    var response = Object.create(_response);
    response.ssl = ssl;
    response.node = _response;
    response.nodeResponse = _response; // Deprecated
    return response;
};

exports.normalizeRequest = function (request) {
    if (typeof request === "string") {
        request = {
            url: request
        };
    }
    if (request.url) {
        var url = URL.parse(request.url);
        request.host = url.hostname;
        request.port = url.port;
        request.ssl = url.protocol === "https:";
        request.method = request.method || "GET";
        request.path = (url.pathname || "") + (url.search || "");
        request.headers = request.headers || {};
        request.headers.host = url.hostname; // FIXME name consistency
    }
    return request;
};

exports.normalizeResponse = function (response) {
    if (response === void 0) {
        return;
    }
    if (typeof response == "string") {
        response = [response];
    }
    if (response.forEach) {
        response = {
            status: 200,
            headers: {},
            body: response
        }
    }
    return response;
};

/**
 * Issues an HTTP request.
 *
 * @param {Request {host, port, method, path, headers,
 * body}} request (may be a promise)
 * @returns {Promise * Response} promise for a response
 */
exports.request = function (request) {
    return Q.when(request, function (request) {

        request = exports.normalizeRequest(request);

        var deferred = Q.defer();
        var ssl = request.ssl;
        var http = ssl ? HTTPS : HTTP;

        var headers = request.headers || {};

        headers.host = headers.host || request.host;

        var _request = http.request({
            "host": request.host,
            "port": request.port || (ssl ? 443 : 80),
            "path": request.path || "/",
            "method": request.method || "GET",
            "headers": headers
        }, function (_response) {
            deferred.resolve(exports.ClientResponse(_response, request.charset));
            _response.on("error", function (error) {
                // TODO find a better way to channel
                // this into the response
                console.warn(error && error.stack || error);
                deferred.reject(error);
            });
        });

        _request.on("error", function (error) {
            deferred.reject(error);
        });

        Q.when(request.body, function (body) {
            var end, done;
            if (body) {
                done = body.forEach(function (chunk) {
                    end = Q.when(end, function () {
                        return Q.when(chunk, function (chunk) {
                            _request.write(chunk, request.charset);
                        });
                    });
                });
            }
            return Q.when(end, function () {
                return Q.when(done, function () {
                    _request.end();
                });
            });
        });

        return deferred.promise;
    });
};

/**
 * Issues a GET request to the given URL and returns
 * a promise for a `String` containing the entirety
 * of the response.
 *
 * @param {String} url
 * @returns {Promise * String} or a rejection if the
 * status code is not exactly 200.  The reason for the
 * rejection is the full response object.
 */
exports.read = function (request, qualifier) {
    qualifier = qualifier || function (response) {
        return response.status === 200;
    };
    return Q.when(exports.request(request), function (response) {
        if (!qualifier(response)){
            var error = new Error("HTTP request failed with code " + response.status);
            error.response = response;
            throw error;
        }
        return Q.post(response.body, 'read', []);
    });
};


/**
 * A wrapper for the Node HTTP Response as provided
 * by the Q HTTP Client API, suitable for use by the
 * Q HTTP Server API.
 */
exports.ClientResponse = function (_response, charset) {
    var response = Object.create(exports.ClientResponse.prototype);
    /*** {Number} HTTP status code */
    response.status = _response.statusCode;
    /*** HTTP version */
    response.version = _response.httpVersion;
    /*** {Object} HTTP headers */
    response.headers = _response.headers;
    /***
     * A Q IO asynchronous text reader.
     */
    response.node = _response;
    response.nodeResponse = _response; // Deprecated
    response.nodeConnection = _response.connection; // Deprecated
    return Q.when(Reader(_response, charset), function (body) {
        response.body = body;
        return response;
    });
};

