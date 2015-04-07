
require("../lib/jasmine-promise");
var Http = require("../../http");
var Apps = require("../../http-apps");
var FS = require("../../fs");

describe("directory lists", function () {

    it("should be fine in plain text", function () {

        var fixture = FS.join(module.directory || __dirname, "fixtures");

        var app = new Apps.Chain()
        .use(Apps.Cap)
        .use(Apps.ListDirectories)
        .use(function () {
            return Apps.FileTree(fixture);
        })
        .end()

        return Http.Server(app)
        .listen(0)
        .then(function (server) {
            var port = server.address().port;
            return Http.read({
                url: "http://127.0.0.1:" + port + "/",
                headers: {
                    accept: "text/plain"
                },
                charset: 'utf-8'
            })
            .then(function (content) {
                expect(content).toEqual("1234.txt\n5678.txt\n9012/\n");
            })
            .finally(server.stop);
        });

    });

    it("should be fine in html", function () {

        var fixture = FS.join(module.directory || __dirname, "fixtures");

        var app = new Apps.Chain()
        .use(Apps.Cap)
        .use(Apps.HandleHtmlFragmentResponses)
        .use(Apps.ListDirectories)
        .use(function () {
            return Apps.FileTree(fixture);
        })
        .end()

        return Http.Server(app)
        .listen(0)
        .then(function (server) {
            var port = server.address().port;
            return Http.read({
                url: "http://127.0.0.1:" + port + "/",
                headers: {
                    accept: "text/html"
                },
                charset: 'utf-8'
            })
            .then(function (content) {
                expect(content).toEqual(
                    "<!doctype html>\n" +
                    "<html>\n" +
                    "    <head>\n" +
                    "        <title>Directory Index</title>\n" +
                    "    </head>\n" +
                    "    <body>\n" +
                    "        <ul class=\"directory-index\">\n" +
                    "            <li class=\"entry file\"><a href=\"1234.txt\">1234.txt</a></li>\n" +
                    "            <li class=\"entry file\"><a href=\"5678.txt\">5678.txt</a></li>\n" +
                    "            <li class=\"entry directory\"><a href=\"9012/\">9012/</a></li>\n" +
                    "        </ul>\n" +
                    "    </body>\n" +
                    "</html>\n"
                );
            })
            .finally(server.stop);
        });

    });
});
