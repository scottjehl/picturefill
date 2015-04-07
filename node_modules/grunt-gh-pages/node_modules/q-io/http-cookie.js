
/**
 * Provides utilities for reading and writing HTTP cookies.
 * @module
 */

/*whatsupdoc*/

var QS = require("qs");

/**
 * @param {String} cookie
 * @returns {Object}
 */
exports.parse = function (cookie, date) {
    date = date || new Date();
    var parsed = {};
    var terms = cookie.split(/[;,]/g);
    var keyValue = terms.shift().split("=");
    parsed.key = keyValue[0];
    parsed.value = keyValue[1];
    terms.forEach(function (term) {
        var parts = term.split("=").map(function (part) {
            return part.trim();
        });
        var key = parts[0], value = parts[1];
        if (/^domain$/i.test(key)) {
            parsed.domain = value;
        } else if (/^path$/i.test(key)) {
            parsed.path = value;
        } else if (/^expires$/i.test(key)) {
            parsed.expires = new Date(
                +new Date() + // actual now
                (new Date(value) - date) // server offset
            );
        } else if (/^max-age$/i.test(key)) {
            parsed.expires = new Date(
                new Date().getTime() +
                (value * 1000)
            );
        } else if (/^secure$/i.test(key)) {
            parsed.secure = true;
        } else if (/^httponly$/i.test(key)) {
            parsed.httpOnly = true;
        }
    });
    return parsed;
};

/**
 * @param {String} key
 * @param {String} value
 * @param {Object} options (optional)
 * @returns {String} a cookie string
 */
exports.stringify = function (key, value, options) {
    var cookie = (
        encodeURIComponent(key) + "=" +
        encodeURIComponent(value)
    );
    if (options) {
        if (options.domain)
            cookie += "; Domain=" + encodeURIComponent(options.domain);
        if (options.path)
            cookie += "; Path=" + encodeURIComponent(options.path);
        if (options.expires)
            cookie += "; Expires=" + options.expires.toGMTString();
        if (options.secure)
            cookie += "; Secure";
        if (options.httpOnly)
            cookie += "; HttpOnly";
    }
    return cookie;
};

