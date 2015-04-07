
var FS = require("../../fs");

describe("relativeFromDirectory", function () {

    it("should find the relative path from a directory", function () {

        expect(FS.relativeFromDirectory("/a/b", "/a/b")).toBe("");
        expect(FS.relativeFromDirectory("/a/b/", "/a/b")).toBe("");
        expect(FS.relativeFromDirectory("/a/b", "/a/b/")).toBe("");
        expect(FS.relativeFromDirectory("/a/b/", "/a/b/")).toBe("");

        expect(FS.relativeFromDirectory("/a/b", "/a/b/c")).toBe("c");
        expect(FS.relativeFromDirectory("/a/b/", "/a/b/c")).toBe("c");
        expect(FS.relativeFromDirectory("/a/b", "/a/b/c/")).toBe("c");
        expect(FS.relativeFromDirectory("/a/b/", "/a/b/c/")).toBe("c");

        expect(FS.relativeFromDirectory("/a/b", "/a")).toBe("..");
        expect(FS.relativeFromDirectory("/a/b/", "/a")).toBe("..");
        expect(FS.relativeFromDirectory("/a/b", "/a/")).toBe("..");
        expect(FS.relativeFromDirectory("/a/b/", "/a/")).toBe("..");

    });

});
