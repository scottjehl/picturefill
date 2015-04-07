
require("../lib/jasmine-promise");
var Q = require("q");
var Http = require("../../http");
var Apps = require("../../http-apps");

describe("http cookies", function () {

    var hosts = ["localhost", "127.0.0.1"];

    hosts.forEach(function (host) {
        it("should work on host" + host, function () {

            var server = Http.Server(function (request) {
                return {
                    status: 200,
                    headers: {
                        "set-cookie": "a=10; MaxAge=1"
                    },
                    body: [request.headers.cookie || ""]
                };
            });

            var request = Apps.Normalize(Apps.CookieJar(Http.request));

            return server.listen(0)
            .then(function (server) {
                var address = server.node.address();
                return request("http://" + host + ":" + address.port)
                .get("body")
                .invoke("read")
                .invoke("toString", "utf-8")
                .then(function (content) {
                    expect(content).toEqual(""); // no cookie first time
                })
                .then(function () {
                    return request("http://" + host + ":" + address.port)
                    .get("body")
                    .invoke("read")
                    .invoke("toString", "utf-8")
                })
                .then(function (content) {
                    expect(content).toEqual("a=10"); // cookie set second time
                })
            })
            .timeout(1000)
            .finally(server.stop)
        });
    });

});

