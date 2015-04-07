
require("../../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../../fs");

describe("write and remove", function () {

    it("should write and remove a file", function () {

        var fixture = FS.join(__dirname, "fixture.txt");

        return FS.write(fixture, "1234")
        .then(function (result) {
            expect(result).toBe(undefined);
        })

        .then(function () {
            return FS.remove(fixture);
        })
        .then(function (result) {
            expect(result).toBe(undefined);
        })

        .then(function () {
            return FS.exists(fixture)
        })
        .then(function (exists) {
            expect(exists).toBe(false);
        })

    });
});

