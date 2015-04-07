"use strict";

var Shim = require("./shim");
var Set = require("./set");
var GenericCollection = require("./generic-collection");
var GenericMap = require("./generic-map");
var PropertyChanges = require("./listen/property-changes");

module.exports = Map;

function Map(values, equals, hash, getDefault) {
    if (!(this instanceof Map)) {
        return new Map(values, equals, hash, getDefault);
    }
    equals = equals || Object.equals;
    hash = hash || Object.hash;
    getDefault = getDefault || Function.noop;
    this.contentEquals = equals;
    this.contentHash = hash;
    this.getDefault = getDefault;
    this.store = new Set(
        undefined,
        function keysEqual(a, b) {
            return equals(a.key, b.key);
        },
        function keyHash(item) {
            return hash(item.key);
        }
    );
    this.length = 0;
    this.addEach(values);
}

Object.addEach(Map.prototype, GenericCollection.prototype);
Object.addEach(Map.prototype, GenericMap.prototype); // overrides GenericCollection
Object.addEach(Map.prototype, PropertyChanges.prototype);

Map.prototype.constructClone = function (values) {
    return new this.constructor(
        values,
        this.contentEquals,
        this.contentHash,
        this.getDefault
    );
};

Map.prototype.log = function (charmap, logNode, callback, thisp) {
    logNode = logNode || this.logNode;
    this.store.log(charmap, function (node, log, logBefore) {
        logNode(node.value.value, log, logBefore);
    }, callback, thisp);
};

Map.prototype.logNode = function (node, log) {
    log(' key: ' + node.key);
    log(' value: ' + node.value);
};

