
var URL = require("../url2");

var tests = [

    {
        source: "",
        target: "",
        relative: ""
    },

    {
        source: "foo/bar/",
        target: "foo/bar/",
        relative: ""
    },

    {
        source: "foo/bar/baz",
        target: "foo/bar/",
        relative: "./"
    },

    {
        source: "foo/bar/",
        target: "/foo/bar/",
        relative: "/foo/bar/"
    },

    {
        source: "/foo/bar/baz",
        target: "/foo/bar/quux",
        relative: "quux"
    },

    {
        source: "/foo/bar/baz",
        target: "/foo/bar/quux/asdf",
        relative: "quux/asdf"
    },

    {
        source: "/foo/bar/baz",
        target: "/foo/bar/quux/baz",
        relative: "quux/baz"
    },

    {
        source: "/foo/bar/baz",
        target: "/foo/quux/baz",
        relative: "../quux/baz"
    },

    {
        source: "/foo/bar/baz",
        target: "/foo/quux/baz?a=10",
        relative: "../quux/baz?a=10"
    },

    {
        source: "/foo/bar/baz?a=10",
        target: "/foo/quux/baz?a=10",
        relative: "../quux/baz?a=10"
    },

    {
        source: "/foo/bar/baz?b=20",
        target: "/foo/quux/baz?a=10",
        relative: "../quux/baz?a=10"
    },

    {
        source: "http://example.com",
        target: "/foo/bar",
        relative: "/foo/bar"
    },

    {
        source: "",
        target: "http://example.com/foo/bar",
        relative: "http://example.com/foo/bar"
    },

    {
        source: "",
        target: "#foo",
        relative: "#foo"
    },

    {
        source: "",
        target: "?a=10",
        relative: "?a=10"
    },

    {
        source: "?a=10",
        target: "#foo",
        relative: "?a=10#foo"
    }

];

describe("relative", function () {

    tests.forEach(function (test) {
        it(
            test.label || (
                "from " + JSON.stringify(test.source) + " " +
                "to " + JSON.stringify(test.target)
            ),
            function () {
                expect(URL.relative(test.source, test.target))
                .toBe(test.relative)
            }
        )
    });

    it("should format a url with a path property", function () {
        expect(URL.format({path: "a/b"})).toEqual("a/b");
        expect(URL.format({path: "a/b?c=d"})).toEqual("a/b?c=d");
    });

});

