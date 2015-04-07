
var HTTP = require("../http");
var URL = require("url2");
var Q = require("q");

exports.Proxy = function (app) {
    if (typeof app === "string") {
        var location = app;
        app = function (request) {
            request.url = location;
            return request;
        };
    }
    return function (request, response) {
        return Q.when(app.apply(this, arguments), function (request) {
            return HTTP.request(request);
        });
    };
};

exports.ProxyTree = function (url) {
    return exports.Proxy(function (request) {
        request.url = URL.resolve(url, request.pathInfo.replace(/^\//, ""));
        return request;
    });
};

