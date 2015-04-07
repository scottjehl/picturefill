"use strict";

require("../../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../../fs");
var Mock = require("../../../fs-mock");
var normalize = FS.normal;

describe("makeTree", function () {
    it("should make a branch of a tree", function () {

        var merged = FS.merge([
            Mock({
                "a": 10,
                "b": 20,
                "1/2/3": "123"
            }),
            Mock({
                "a": 20,
                "c": 30
            }),
            Mock({
                "a": 30,
                "d": 40
            }),
        ])

        return merged.then(function (merged) {

            return Q.fcall(function () {
                return merged.listTree();
            })
            .then(function (list) {
                expect(list.sort()).toEqual([
                    ".",
                    "1",
                    normalize("1/2"),
                    normalize("1/2/3"),
                    "a",
                    "b",
                    "c",
                    "d",
                ]);
            })

            // overridden by a previous tree
            .then(function () {
                return merged.read("a");
            })
            .then(function (a) {
                expect(a).toBe("30");
            })

            // not overridden
            .then(function () {
                return merged.read("b");
            })
            .then(function (a) {
                expect(a).toBe("20");
            })

        })

    });

});

