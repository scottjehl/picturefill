"use strict";

require("../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../fs");

describe("open range", function () {
    it("read a partial range of a file", function () {

        var name = FS.join(module.directory || __dirname, "range-spec.txt");

        return FS.open(name, {
            begin: 1,
            end: 3
        })
        .invoke("read")
        .then(function (content) {
            expect(content).toBe("23");
        })

    });
});

