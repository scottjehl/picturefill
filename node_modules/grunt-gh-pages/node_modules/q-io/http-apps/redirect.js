
var Q = require("q");
var URL = require("url2");
var Negotiation = require("./negotiate");
var HtmlApps = require("./html");

/**
 * @param {String} path
 * @param {Number} status (optional) default is `301`
 * @returns {App}
 */
exports.PermanentRedirect = function (location, status, tree) {
    return function (request, response) {
        return exports.permanentRedirect(request, location, status, tree);
    };
};

/**
 * @param {String} path
 * @param {Number} status (optional) default is `301`
 * @returns {App}
 */
exports.PermanentRedirectTree = function (location, status) {
    return function (request, response) {
        return exports.permanentRedirect(request, location, status, true);
    };
};

/**
 * @param {String} path
 * @param {Number} status (optional) default is `307`
 * @returns {App}
 */
exports.TemporaryRedirect = function (location, status, tree) {
    return function (request, response) {
        return exports.temporaryRedirect(request, location, status, tree);
    };
};

/**
 * @param {String} path
 * @param {Number} status (optional) default is `307`
 * @returns {App}
 */
exports.TemporaryRedirectTree = function (location, status) {
    return function (request, response) {
        return exports.temporaryRedirect(request, location, status, true);
    };
};

/**
 * @param {String} path
 * @param {Number} status (optional) default is `307`
 * @returns {App}
 */
exports.Redirect = function (location, status, tree) {
    return function (request, response) {
        return exports.redirect(request, location, status, tree);
    };
};

/**
 * @param {String} path
 * @param {Number} status (optional) default is `307`
 * @returns {App}
 */
exports.RedirectTree = function (location, status) {
    return function (request, response) {
        return exports.redirect(request, location, status, true);
    };
};

exports.permanentRedirect = function (request, location, status) {
    return exports.redirect(request, location, status || 301);
};

exports.permanentRedirectTree = function (request, location, status) {
    return exports.redirect(request, location, status || 301, true);
};

exports.temporaryRedirect = function (request, location, status) {
    return exports.redirect(request, location, status || 307);
};

exports.temporaryRedirectTree = function (request, location, status) {
    return exports.redirect(request, location, status || 307, true);
};

exports.redirectTree = function (request, location, status) {
    return exports.redirect(request, location, status, true);
};

/**
 * @param {String} location
 * @param {Number} status (optional) default is `301`
 * @returns {Response}
 */
exports.redirect = function (request, location, status, tree) {

    // request.permanent gets set by Permanent middleware
    status = status || (request.permanent ? 301 : 307);

    // ascertain that the location is absolute, per spec
    location = URL.resolve(request.url, location);

    // redirect into a subtree with the remaining unrouted
    // portion of the path, if so configured
    if (tree) {
        location = URL.resolve(
            location,
            request.pathInfo.replace(/^\//, "")
        );
    }

    var handlers = {};
    handlers["text/plain"] = exports.redirectText;
    if (request.handleHtmlFragmentResponse) {
        handlers["text/html"] = exports.redirectHtml;
    }
    var handler = Negotiation.negotiate(request, handlers) || exports.redirectText;
    return handler(request, location, status);

};

exports.redirectText = function (request, location, status) {
    var content = (
        (request.permanent ? "Permanent redirect\n" : "Temporary redirect\n") +
        "See: " + location + "\n"
    );
    var contentLength = content.length;
    return {
        status: status,
        headers: {
            location: location,
            "content-type": "text/plain"
        },
        body: [content]
    };
};

exports.redirectHtml = function (request, location, status) {
    var title = request.permanent ? "Permanent redirect" : "Temporary redirect";
    return {
        status: status,
        headers: {
            location: location,
            "content-type": "text/html"
        },
        htmlTitle: title,
        htmlFragment: {
            forEach: function (write) {
                write("<h1>" + HtmlApps.escapeHtml(title) + "</h1>\n");
                write(
                    "<p>See: <a href=\"" + HtmlApps.escapeHtml(location) + "\">" +
                    HtmlApps.escapeHtml(location) +
                    "</a></p>\n"
                );
            }
        }
    };
};

exports.RedirectTrap = function (app, maxRedirects) {
    maxRedirects = maxRedirects || 20;
    return function (request, response) {
        var remaining = maxRedirects;
        var deferred = Q.defer();
        var self = this;
        var args = arguments;

        request = HTTP.normalizeRequest(request);

        // try redirect loop
        function next() {
            Q.fcall(function () {
                return app(request, response);
            })
            .then(function (response) {
                if (exports.isRedirect(response)) {
                    if (remaining--) {
                        request.url = response.headers.location;
                        next();
                    } else {
                        throw new Error("Maximum redirects.");
                    }
                } else {
                    deferred.resolve(response);
                }
            })
            .fail(deferred.reject)
        }
        next();

        return deferred.promise;
    };
};

exports.isRedirect = function (response) {
    return isRedirect[response.status] || false;
};

var isRedirect = {
    301: true,
    302: true,
    303: true,
    307: true
};

