"use strict";

require("../../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../../fs");
var Mock = require("../../../fs-mock");

describe("open range", function () {
    it("read a partial range of a file", function () {

        return FS.mock(FS.join(__dirname, "fixture"))
        .then(function (mock) {

            return mock.read("hello.txt", {
                begin: 1,
                end: 3
            })
            .then(function (content) {
                expect(content).toBe("el");
            })

        });

    });
});

