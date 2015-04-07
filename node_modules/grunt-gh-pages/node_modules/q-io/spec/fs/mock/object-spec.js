"use strict";

require("../../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../../fs");

describe("toObject", function () {
    it("should take a snapshot of a tree", function () {

        return FS.mock(FS.join(__dirname, "fixture"))
        .invoke("toObject")
        .then(function (tree) {

            expect(tree["hello.txt"].toString("utf-8")).toEqual("Hello, World!\n");
            expect(Object.keys(tree)).toEqual(["hello.txt"]);

        });
    });
});

