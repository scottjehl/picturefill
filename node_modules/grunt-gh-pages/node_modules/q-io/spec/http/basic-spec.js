
require("../lib/jasmine-promise");
var Q = require("q");
var HTTP = require("../../http");

describe("http server and client", function () {

    it("should work as both server and client", function () {
        var response = {
            "status": 200,
            "headers": {
                "content-type": "text/plain"
            },
            "body": [
                "Hello, World!"
            ]
        };

        var server = HTTP.Server(function () {
            return response;
        });

        return server.listen(0)
        .then(function (server) {
            var port = server.address().port;

            var request = {
                "host": "localhost",
                "port": port,
                "headers": {
                    "host": "localhost"
                }
            };

            return HTTP.request(request)
            .then(function (response) {
                expect(Q.isPromise(response.body)).toBe(false);
                var acc = [];
                return response.body.read()
                .then(function (body) {
                    expect(body.toString("utf-8")).toBe("Hello, World!");
                });
            })
        })
        .finally(server.stop)
    });

    it("should defer a response", function () {
        var response = {
            "status": 200,
            "headers": {
                "content-type": "text/plain; charset=utf-8"
            },
            "body": {
                "forEach": function (write) {
                    var deferred = Q.defer();
                    write("Hello, World!");
                    setTimeout(function () {
                        deferred.resolve();
                    }, 100);
                    return deferred.promise;
                }
            }
        };

        var server = HTTP.Server(function () {
            return response;
        });

        return server.listen(0).then(function (server) {
            var port = server.node.address().port;

            var request = {
                "host": "localhost",
                "port": port,
                "headers": {
                    "host": "localhost"
                },
                "charset": "utf-8"
            };

            return HTTP.request(request)
            .then(function (response) {
                var acc = [];
                return response.body.read()
                .then(function (body) {
                    expect(body).toBe("Hello, World!");
                });
            })
        })
        .finally(server.stop)
    });


});

