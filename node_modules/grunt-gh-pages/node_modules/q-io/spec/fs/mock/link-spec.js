
require("../../lib/jasmine-promise");
var MockFs = require("../../../fs-mock");
var normalize = require('../../../fs').normal;

describe("link", function () {
    it("should", function () {
        var mock = MockFs();

        // make some content
        return mock.makeTree("a/b")
        .then(function () {
            return mock.write("a/b/c.txt", "Hello, World!")
        })

        // verify content
        .then(function () {
            return mock.read("a/b/c.txt")
        })
        .then(function (content) {
            expect(content).toBe("Hello, World!");
        })

        // link it
        .then(function () {
            return mock.link("a/b/c.txt", "a/b/d.txt")
        })

        // should be non-destructive
        .then(function () {
            return mock.read("a/b/c.txt")
        })
        .then(function (content) {
            expect(content).toBe("Hello, World!");
        })

        // should be listed
        .then(function () {
            return mock.listTree()
        })
        .then(function (content) {
            expect(content).toEqual([
                ".",
                "a",
                normalize("a/b"),
                normalize("a/b/c.txt"),
                normalize("a/b/d.txt")
            ])
        })

        // should be identified as a file
        .then(function () {
            return mock.isFile("a/b/d.txt");
        })
        .then(function (isFile) {
            expect(isFile).toBe(true);
        })

        // should have the same content
        .then(function () {
            return mock.read("a/b/d.txt");
        })
        .then(function (content) {
            expect(content).toBe("Hello, World!");
        });

    });
});


