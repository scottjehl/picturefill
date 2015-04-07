
require("../../lib/jasmine-promise");
var MockFs = require("../../../fs-mock");
var normalize = require('../../../fs').normal;

describe("symbolic link", function () {
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
            return mock.symbolicCopy("/a/b/c.txt", "a/b/d.txt", "file")
        })

        // should have a link
        .then(function () {
            return mock.readLink("a/b/d.txt")
        })
        .then(function (link) {
            expect(link).toBe("c.txt");
        })

        // should have a canonical path
        .then(function () {
            return mock.canonical("a/b/d.txt")
        })
        .then(function (canonical) {
            expect(canonical).toBe("/a/b/c.txt");
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

        // should be non-destructive
        .then(function () {
            return mock.read("a/b/c.txt")
        })
        .then(function (content) {
            expect(content).toBe("Hello, World!");
        })

        // should be identified as a file
        .then(function () {
            return mock.isSymbolicLink("a/b/d.txt");
        })
        .then(function (isSymbolicLink) {
            expect(isSymbolicLink).toBe(true);
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


