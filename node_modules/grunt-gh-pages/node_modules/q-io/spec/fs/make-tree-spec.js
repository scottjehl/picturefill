"use strict";

require("../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../fs");
var _n = FS.normal;

describe("makeTree", function () {
    it("should make a branch of a tree", function () {

        return Q.fcall(function () {
            return FS.makeTree("a/b/c");
        })

        .then(function () {
            return FS.listTree("a");
        })
        .then(function (list) {
            expect(list).toEqual([
                "a",
                _n("a/b"),
                _n("a/b/c")
            ]);
        })

        .then(function () {
            return FS.exists("a/b/c");
        })
        .then(function (exists) {
            expect(exists).toBe(true);
        })

        .then(function () {
            return FS.isDirectory("a/b/c");
        })
        .then(function (isDirectory) {
            expect(isDirectory).toBe(true);
        })

    });

    it("should make a branch of a tree even if some of it already exists", function () {

        return Q.fcall(function () {
            return FS.makeTree("a/b/c/d");
        })

        .then(function () {
            return FS.listTree("a");
        })
        .then(function (list) {
            expect(list).toEqual([
                "a",
                _n("a/b"),
                _n("a/b/c"),
                _n("a/b/c/d")
            ]);
        })
        .then(function () {
            return FS.removeTree("a");
        })
    });

    it("should make branch from an absolute path", function () {

        return Q.fcall(function () {
            return FS.makeTree(FS.absolute("a/b/c/d"));
        })

        .then(function () {
            return FS.listTree("a");
        })
        .then(function (list) {
            expect(list).toEqual([
                "a",
                _n("a/b"),
                _n("a/b/c"),
                _n("a/b/c/d")
            ]);
        })
        .then(function () {
            return FS.removeTree("a");
        })
    });
});

