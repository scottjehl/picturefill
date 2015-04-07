"use strict";

var Map = require("./map");

module.exports = MultiMap;
function MultiMap(values, bucket, equals, hash) {
    if (!(this instanceof MultiMap)) {
        return new MultiMap(values, bucket, equals, hash);
    }
    this.bucket = bucket || this.bucket;
    Map.call(this, values, equals, hash, function getDefault(key) {
        var bucket = this.bucket();
        Map.prototype.set.call(this, key, bucket);
        return bucket;
    });
}

MultiMap.prototype = Object.create(Map.prototype);

MultiMap.prototype.constructor = MultiMap;

MultiMap.prototype.constructClone = function (values) {
    return new this.constructor(
        values,
        this.bucket,
        this.contentEquals,
        this.contentHash
    );
};

MultiMap.prototype.set = function (key, newValues) {
    var values = this.get(key);
    values.swap(0, values.length, newValues);
};

MultiMap.prototype.bucket = function (key) {
    return [];
};

