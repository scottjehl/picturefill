"use strict";

require("../../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../../fs");
var Mock = require("../../../fs-mock");
var normalize = FS.normal;

describe("makeTree", function () {
    it("should make a branch of a tree", function () {

        var mock = Mock({
            "a": {}
        });

        return Q.fcall(function () {
            return mock.makeTree("a/b/c");
        })

        .then(function () {
            return mock.listTree();
        })
        .then(function (list) {
            expect(list).toEqual([
                ".",
                "a",
                normalize("a/b"),
                normalize("a/b/c")
            ]);
        })

        .then(function () {
            return mock.exists("a/b/c")
        })
        .then(function (exists) {
            expect(exists).toBe(true);
        })

        .then(function () {
            return mock.isDirectory("a/b/c")
        })
        .then(function (isDirectory) {
            expect(isDirectory).toBe(true);
        })

    });

    it("should make a branch of a tree even if some of it already exists", function () {

        var mock = Mock({
            "a/b": {}
        });

        return Q.fcall(function () {
            return mock.makeTree("a/b/c/d");
        })

        .then(function () {
            return mock.listTree();
        })
        .then(function (list) {
            expect(list).toEqual([
                ".",
                "a",
                normalize("a/b"),
                normalize("a/b/c"),
                normalize("a/b/c/d")
            ]);
        })
    });

    it("should make an absolute tree from a subdirectory", function () {
        var mock = Mock({
            "a/b": {
                "c": {
                    "d.ext": 66
                }
            }
        }, "/a/b");

        return Q.fcall(function () {
            return mock.makeTree("/a/b/c/x/y/z");
        })
        .then(function () {
            return Q.all([
                mock.isDirectory("a/b/c/x"),
                mock.isDirectory("a/b/c/x/y"),
                mock.isDirectory("a/b/c/x/y/z")
            ]);
        })
        .then(function () {
            return mock.listTree("/");
        })
        .then(function (list) {
            expect(list).toEqual([
                "/",
                "/a",
                "/a/b",
                "/a/b/c",
                "/a/b/c/d.ext",
                "/a/b/c/x",
                "/a/b/c/x/y",
                "/a/b/c/x/y/z"
            ]);
        });
    });

});

