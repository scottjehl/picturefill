"use strict";

require("../../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../../fs");
var Mock = require("../../../fs-mock");
var normalize = FS.normal;

describe("removeTree", function () {
    it("should remove a tree", function () {

        var mock = Mock({
            "a/b": {
                "c": {
                    "d": 66,
                    "e": 99
                }
            }
        });

        return Q.fcall(function () {
            return mock.removeTree("a/b/c");
        })

        .then(function () {
            return mock.listTree();
        })
        .then(function (list) {
            expect(list).toEqual([
                ".",
                "a",
                normalize("a/b")
            ]);
        })

    });

});

