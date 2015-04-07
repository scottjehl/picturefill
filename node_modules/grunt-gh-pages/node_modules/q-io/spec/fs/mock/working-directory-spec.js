"use strict";

require("../../lib/jasmine-promise");
var Q = require("q");
var Mock = require("../../../fs-mock");

describe("mock working directory", function () {
    it("should perform actions relative to the given working directory", function () {

        var mock = Mock({
            "a/b": {
                "c": {
                    "d": 66,
                    "e": 99
                }
            }
        }, "a/b/c");

        return mock.listTree()
        .then(function (list) {
            expect(list).toEqual([
                ".",
                "d",
                "e"
            ]);
        })

    });

});

