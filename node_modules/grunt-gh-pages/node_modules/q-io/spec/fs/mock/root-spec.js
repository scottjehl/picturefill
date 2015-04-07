"use strict";

require("../../lib/jasmine-promise");
var Q = require("q");
var FS = require("../../../fs");
var Mock = require("../../../fs-mock");
var Root = require("../../../fs-root");

describe("root", function () {
    it("should make a filesystem from a subtree of a mock filesystem", function () {

        var mock = Mock({
            "a/b/1": 10,
            "a/b/2": 20,
            "a/b/3": 30
        });

        var chroot = Root(mock, "a/b");

        return chroot.invoke("listTree")
        .then(function (list) {
            expect(list).toEqual([
                ".",
                "1",
                "2",
                "3"
            ]);
        });

    });
});

