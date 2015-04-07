"use strict";

require("../../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../../fs");
var Mock = require("../../../fs-mock");

describe("move", function () {
    it("should move", function () {

        return FS.mock(FS.join(__dirname, "fixture"))
        .then(function (mock) {

            // initial list
            return Q.fcall(function () {
                return mock.listTree()
            })
            .then(function (list) {
                expect(list).toEqual([
                    ".",
                    "hello.txt"
                ]);
            })

            // initial content
            .then(function () {
                return mock.read("hello.txt");
            })
            .then(function (content) {
                expect(content).toBe("Hello, World!\n");
            })

            // move!
            .then(function () {
                return mock.move("hello.txt", "new-hello.txt");
            })

            // list after
            .then(function () {
                return mock.listTree();
            })
            .then(function (list) {
                expect(list).toEqual([
                    ".",
                    "new-hello.txt"
                ]);
            })

            // content after
            .then(function () {
                return mock.read("new-hello.txt");
            })
            .then(function (content) {
                expect(content).toBe("Hello, World!\n");
            })

        });
    });

    it("should not delete a node if the source and target are the same", function () {

        return FS.mock(FS.join(__dirname, "fixture"))
        .then(function (mock) {

            // initial list
            return Q.fcall(function () {
                return mock.listTree()
            })
            .then(function (list) {
                expect(list).toEqual([
                    ".",
                    "hello.txt"
                ]);
            })

            // initial content
            .then(function () {
                return mock.read("hello.txt");
            })
            .then(function (content) {
                expect(content).toBe("Hello, World!\n");
            })

            // move!
            .then(function () {
                return mock.move("hello.txt", "hello.txt");
            })

            // list after
            .then(function () {
                return mock.listTree();
            })
            .then(function (list) {
                expect(list).toEqual([
                    ".",
                    "hello.txt"
                ]);
            })

            // content after
            .then(function () {
                return mock.read("hello.txt");
            })
            .then(function (content) {
                expect(content).toBe("Hello, World!\n");
            })
        });

    });

    it("should not delete a node if the source and target refer to the same node", function () {

        return FS.mock(FS.join(__dirname, "fixture"))
        .then(function (mock) {

            return Q.fcall(function () {
                return Q.all([
                    mock.symbolicCopy("hello.txt", "a.txt"),
                    mock.symbolicCopy("hello.txt", "b.txt"),
                ]);
            })

            // initial list
            .then(function () {
                return mock.listTree()
            })
            .then(function (list) {
                expect(list).toEqual([
                    ".",
                    "a.txt",
                    "b.txt",
                    "hello.txt"
                ]);
            })

            // initial content
            .then(function () {
                return mock.read("hello.txt");
            })
            .then(function (content) {
                expect(content).toBe("Hello, World!\n");
            })

            // move!
            .then(function () {
                return mock.move("a.txt", "b.txt");
            })

            // list after
            .then(function () {
                return mock.listTree();
            })
            .then(function (list) {
                expect(list).toEqual([
                    ".",
                    "a.txt",
                    "b.txt",
                    "hello.txt"
                ]);
            })

            // content after
            .then(function () {
                return mock.read("hello.txt");
            })
            .then(function (content) {
                expect(content).toBe("Hello, World!\n");
            })
        });

    });

    it("should fail to move over an existing directory", function () {
        var mock = Mock({
            "hi.txt": "Hello, World!",
            "hello": {}
        });

        return Q.fcall(function () {
            return mock.isDirectory("/hello");
        })
        .then(function (isDirectory) {
            expect(isDirectory).toBe(true);
        })

        .then(function () {
            return mock.move("/hi.txt", "/hello");
        })
        .then(function () {
            throw new Error("Move should not succeed.");
        }, function (error) {
        })

    });

    it("should fail to move over an existing directory of the same name", function () {
        var mock = Mock({
            "hello": {}
        });

        return Q.fcall(function () {
            return mock.isDirectory("/hello");
        })
        .then(function (isDirectory) {
            expect(isDirectory).toBe(true);
        })

        .then(function () {
            return mock.move("/hello", "/hello");
        })
        .then(function () {
            throw new Error("Move should not succeed.");
        }, function (error) {
        })

    });

});

