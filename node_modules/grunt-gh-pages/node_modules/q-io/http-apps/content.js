
var Negotiate = require("./negotiate");
var QS = require("qs");
var URL = require("url2");

/**
 * Makes an app that returns a response with static content
 * from memory.
 * @param {Body} body a Q-JSGI
 * response body
 * @param {String} contentType
 * @param {Number} status
 * @returns {App} a Q-JSGI app
 */
exports.Content = function (body, contentType, status) {
    return function (request, response) {
        return {
            "status": status || 200,
            "headers": {
                "content-type": contentType || "text/plain"
            },
            "body": body || ""
        };
    };
};

/**
 * Returns a Q-JSGI response with the given content.
 * @param {Body} content (optional) defaults to `[""]`
 * @param {String} contentType (optional) defaults to `"text/plain"`
 * @param {Number} status (optional) defaults to `200`
 * @returns {Response}
 */
exports.content =
exports.ok = function (content, contentType, status) {
    status = status || 200;
    content = content || "";
    if (typeof content === "string") {
        content = [content];
    }
    contentType = contentType || "text/plain";
    return {
        "status": status,
        "headers": {
            "content-type": contentType
        },
        "body": content
    };
};

/**
 * Wraps an app such that it expects to receive content
 * in the request body and passes that content as a string
 * to as the second argument to the wrapped JSGI app.
 *
 * @param {Function(Request, Object):Response} app
 * @returns {App}
 */
exports.ContentRequest = function (app) {
    return function (request, response) {
        return Q.when(request.body.read(), function (body) {
            return app(body, request, response);
        });
    };
};

/**
 * @param {Function(Request):Object}
 * @returns {App}
 */
exports.Inspect = function (app) {
    return Negotiate.Method({"GET": function (request, response) {
        return Q.when(app(request, response), function (object) {
            return {
                status: 200,
                headers: {
                    "content-type": "text/plain"
                },
                body: [inspect(object)]
            }
        });
    }});
};

/**
 */
exports.ParseQuery = function (app) {
    return function (request, response) {
        request.query = QS.parse(URL.parse(request.url).query || "");
        return app(request, response);
    };
};

