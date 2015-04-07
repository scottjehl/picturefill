
var Q = require("q");

exports.HandleJsonResponses = function (app, reviver, tab) {
    return function (request) {
        request.handleJsonResponse = exports.handleJsonResponse;
        return Q.fcall(app, request)
        .then(function (response) {
            if (response.data !== void 0) {
                return Q.fcall(exports.handleJsonResponse, response, reviver, tab);
            } else {
                return response;
            }
        });
    };
};

exports.handleJsonResponse = function (response, revivier, tab) {
    response.headers["content-type"] = "application/json";
    response.body = {
        forEach: function (write) {
            write(JSON.stringify(response.data, revivier, tab));
        }
    };
    return response;
};

/**
 * Wraps a Q-JSGI application such that the child application may
 * simply return an object, which will in turn be serialized into a
 * Q-JSGI response.
 *
 * @param {Function(Request):Object} app an application that accepts a
 * request and returns a JSON serializable object.
 * @returns {App}
 */
exports.Json = function (app, reviver, tabs) {
    return function (request, response) {
        return Q.when(app(request, response), function (object) {
            return exports.json(object, reviver, tabs);
        });
    };
};

/**
 * @param {Object} content data to serialize as JSON
 * @param {Function} reviver
 * @param {Number|String} tabs
 * @returns {Response}
 */
exports.json = function (content, reviver, tabs) {
    try {
        var json = JSON.stringify(content, reviver, tabs);
    } catch (exception) {
        return Q.reject(exception);
    }
    return exports.ok([json]);
};

/**
 * @param {Function(Request, Object):Response} app
 * @param {App} badRequest
 * @returns {App}
 */
exports.JsonRequest = function (app, badRequest) {
    if (!badRequest)
        badRequest = exports.badRequest;
    return exports.ContentRequest(function (content, request, response) {
        try {
            var object = JSON.parse(content);
        } catch (error) {
            return badRequest(request, error);
        }
        return app(object, request, response);
    });
};

