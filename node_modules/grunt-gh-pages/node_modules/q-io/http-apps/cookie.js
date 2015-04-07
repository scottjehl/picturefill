
var Q = require("q");
var Cookie = require("../http-cookie");

exports.CookieJar = function (app) {
    var hostCookies = {}; // to {} of pathCookies to [] of cookies
    return function (request) {

        var hosts = allHostsContaining(request.headers.host);

        var now = new Date();

        var requestCookies = concat(hosts.map(function (host) {

            // delete expired cookies
            for (var host in hostCookies) {
                var pathCookies = hostCookies[host];
                for (var path in pathCookies) {
                    var cookies = pathCookies[path];
                    for (var name in cookies) {
                        var cookie = cookies[name];
                        if (cookie.expires && cookie.expires > now) {
                            delete cookie[name];
                        }
                    }
                }
            }

            // collect applicable cookies
            return concat(
                Object.keys(hostCookies)
                .map(function (host) {
                    if (!hostContains(host, request.headers.host))
                        return [];
                    var pathCookies = hostCookies[host];
                    return concat(
                        Object.keys(pathCookies)
                        .map(function (path) {
                            if (!pathContains(path, request.path))
                                return [];
                            var cookies = pathCookies[path];
                            return (
                                Object.keys(cookies)
                                .map(function (name) {
                                    return cookies[name];
                                })
                                .filter(function (cookie) {
                                    return cookie.secure ?
                                        request.ssl :
                                        true;
                                })
                            );
                        })
                    )
                })
            );

        }));

        if (requestCookies.length) {
            request.headers["cookie"] = (
                requestCookies
                .map(function (cookie) {
                    return Cookie.stringify(
                        cookie.key,
                        cookie.value,
                        cookie
                    );
                })
                .join("; ")
            );
        }

        return Q.when(app.apply(this, arguments), function (response) {
            response.headers = response.headers || {};
            if (response.headers["set-cookie"]) {
                var requestHost = ipRe.test(request.headers.host) ?
                    request.headers.host :
                    "." + request.headers.host;
                // normalize to array
                if (!Array.isArray(response.headers["set-cookie"])) {
                    response.headers["set-cookie"] = [response.headers["set-cookie"]];
                }
                response.headers["set-cookie"].forEach(function (cookie) {
                    var date = response.headers["date"] ?
                        new Date(response.headers["date"]) :
                        new Date();
                    cookie = Cookie.parse(cookie, date);
                    // ignore illegal host
                    if (cookie.host && !hostContains(requestHost, cookie.host))
                        delete cookie.host;
                    var host = requestHost || cookie.host;
                    var path = cookie.path || "/";
                    var pathCookies = hostCookies[host] = hostCookies[host] || {};
                    var cookies = pathCookies[path] = pathCookies[path] || {};
                    cookies[cookie.key] = cookie;
                })
                delete response.headers["set-cookie"];
            }

            return response;
        });

    };
};

var ipRe = /^\d+\.\d+\.\d+\.\d+$/;

function allHostsContaining(content) {
    if (ipRe.test(content)) {
        return [content];
    } if (content === "localhost") {
        return [content];
    } else {
        var parts = content.split(".");
        var hosts = [];
        while (parts.length > 1) {
            hosts.push("." + parts.join("."));
            parts.shift();
        }
        return hosts;
    }
}

function hostContains(container, content) {
    if (ipRe.test(container) || ipRe.test(content)) {
        return container === content;
    } else if (/^\./.test(container)) {
        return (
            content.lastIndexOf(container) ===
            content.length - container.length
        ) || (
            container.slice(1) === content
        );
    } else {
        return container === content;
    }
};

function pathContains(container, content) {
    if (/^\/$/.test(container)) {
        return content.indexOf(container) === 0;
    } else {
        return (
            content === container ||
            content.indexOf(container + "/") === 0
        );
    }
}

function concat(arrays) {
    return [].concat.apply([], arrays);
}

