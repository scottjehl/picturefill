
var Q = require("q");
var MimeParse = require("mimeparse");

exports.negotiate = negotiate;
function negotiate(request, types, header) {
    var keys = Object.keys(types);
    var accept = request.headers[header || "accept"] || "*";
    var best = MimeParse.bestMatch(keys, accept);
    return types[best];
}

/// branch on HTTP method
/**
 * @param {Object * App} methods
 * @param {App} notAllowed (optional)
 * @returns {App}
 */
exports.Method = function (methods, methodNotAllowed) {
    var keys = Object.keys(methods);
    if (!methodNotAllowed)
        methodNotAllowed = exports.methodNotAllowed;
    return function (request, response) {
        var method = request.method;
        if (Object.has(keys, method)) {
            return Object.get(methods, method)(request, response);
        } else {
            return methodNotAllowed(request, response);
        }
    };
};

var Negotiator = function (requestHeader, responseHeader, respond) {
    return function (types, notAcceptable) {
        var keys = Object.keys(types);
        if (!notAcceptable)
            notAcceptable = exports.notAcceptable;
        return function (request, response) {
            var header = requestHeader;
            if (typeof header === "function") {
                header = requestHeader(request);
            }
            var accept = request.headers[requestHeader] || "*";
            var type = MimeParse.bestMatch(keys, accept);
            request.terms = request.terms || {};
            request.terms[responseHeader] = type;
            if (Object.has(keys, type)) {
                return Q.when(types[type](request, response), function (response) {
                    if (
                        respond !== null &&
                        response &&
                        response.status === 200 &&
                        response.headers
                    ) {
                        response.headers[responseHeader] = type;
                    }
                    return response;
                });
            } else {
                return notAcceptable(request, response);
            }
        };
    };
};

/// branch on HTTP content negotiation
/**
 * Routes based on content negotiation, between the request's `accept`
 * header and the application's list of possible content types.
 *
 * @param {Object * App} types mapping content types to apps that can
 * handle them.
 * @param {App} notAcceptable
 * @returns {App}
 */
exports.ContentType = Negotiator("accept", "content-type");
exports.Language = Negotiator("accept-language", "language");
exports.Charset = Negotiator("accept-charset", "charset");
exports.Encoding = Negotiator("accept-encoding", "encoding");
exports.Host = Negotiator(function (request) {
    return (request.headers.host || "*") + ":" + request.port;
}, "host", null);

// Branch on a selector function based on the request
exports.Select = function (select) {
    return function (request, response) {
        return Q.when(select(request, response), function (app) {
            return app(request, response);
        });
    };
};

