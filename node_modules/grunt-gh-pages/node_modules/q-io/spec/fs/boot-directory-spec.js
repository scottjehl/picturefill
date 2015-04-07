
var FS = require("../../fs-boot");
var normalize = FS.normal;

var specs = [
    {
        "from": "foo",
        "to": ""
    },
    {
        "from": "",
        "to": ".."
    },
    {
        "from": ".",
        "to": ".."
    },
    {
        "from": "..",
        "to": normalize("../..")
    },
    {
        "from": "../foo",
        "to": ".."
    },
    {
        "from": "/foo/bar",
        "to": normalize("/foo")
    },
    {
        "from": "/foo",
        "to": normalize("/")
    },
    {
        "from": "/",
        "to": "/"
    }
];

describe("fs-boot directory", function () {
    specs.forEach(function (spec) {
        it("should parse " + JSON.stringify(spec.from), function () {
            expect(FS.directory(spec.from)).toBe(spec.to);
        });
    });
});

