
var Q = require("q");
// TODO negotiate text/html vs text/html+fragment (or other mime type)

/**
 * @param {Request} request
 * @param {String} path
 * @param {String} contentType
 * @returns {Response}
 */
exports.HandleHtmlFragmentResponses = function (app, handleHtmlFragmentResponse) {
    handleHtmlFragmentResponse = handleHtmlFragmentResponse || exports.handleHtmlFragmentResponse;
    return function (request) {
        request.handleHtmlFragmentResponse = handleHtmlFragmentResponse;
        return Q.fcall(app, request)
        .then(function (response) {
            if (response.htmlFragment) {
                return Q.fcall(handleHtmlFragmentResponse, response);
            } else {
                return response;
            }
        });
    };
};

exports.handleHtmlFragmentResponse = function (response) {
    var htmlFragment = response.htmlFragment;
    delete response.htmlFragment;
    response.headers["content-type"] = "text/html; charset=utf-8";
    response.body = {
        forEach: function (write) {
            write("<!doctype html>\n");
            write("<html>\n");
            write("    <head>\n");
            if (response.htmlTitle !== void 0) {
                write("        <title>" + escapeHtml(response.htmlTitle) + "</title>\n");
            }
            write("    </head>\n");
            write("    <body>\n");
            htmlFragment.forEach(function (line) {
                write("        " + line);
            });
            write("    </body>\n");
            write("</html>\n");
        }
    };
    return response;
};

exports.escapeHtml = escapeHtml;
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

