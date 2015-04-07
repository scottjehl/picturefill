"use strict";

var Shim = require("./shim");
var Set = require("./set");
var GenericCollection = require("./generic-collection");
var GenericSet = require("./generic-set");
var PropertyChanges = require("./listen/property-changes");
var RangeChanges = require("./listen/range-changes");

module.exports = LruSet;

function LruSet(values, maxLength, equals, hash, getDefault) {
    if (!(this instanceof LruSet)) {
        return new LruSet(values, maxLength, equals, hash, getDefault);
    }
    maxLength = maxLength || Infinity;
    equals = equals || Object.equals;
    hash = hash || Object.hash;
    getDefault = getDefault || Function.noop;
    this.store = new Set(undefined, equals, hash);
    this.contentEquals = equals;
    this.contentHash = hash;
    this.getDefault = getDefault;
    this.maxLength = maxLength;
    this.length = 0;
    this.addEach(values);
}

Object.addEach(LruSet.prototype, GenericCollection.prototype);
Object.addEach(LruSet.prototype, GenericSet.prototype);
Object.addEach(LruSet.prototype, PropertyChanges.prototype);
Object.addEach(LruSet.prototype, RangeChanges.prototype);

LruSet.prototype.constructClone = function (values) {
    return new this.constructor(
        values,
        this.maxLength,
        this.contentEquals,
        this.contentHash,
        this.getDefault
    );
};

LruSet.prototype.has = function (value) {
    return this.store.has(value);
};

LruSet.prototype.get = function (value) {
    value = this.store.get(value);
    if (value !== undefined) {
        this.store["delete"](value);
        this.store.add(value);
    } else {
        value = this.getDefault(value);
    }
    return value;
};

LruSet.prototype.add = function (value) {
    var found = this.store.has(value);
    // if the value already exists, we delete it and add it back again so it
    // appears at the end of the list of values to truncate
    var length = this.length;
    if (found) {
        this.store["delete"](value);
        length--;
    }
    // before change
    if (!found && this.dispachesRangeChanges) {
        this.dispatchBeforeRangeChange([value], [], 0);
    }
    this.store.add(value);
    length++;
    // only assign to length once to avoid jitter on length observers
    this.length = length;
    // after change
    if (!found && this.dispatchesRangeChanges) {
        this.dispatchRangeChange([value], [], 0);
    }
    // truncate if necessary
    if (this.store.length > this.maxLength) {
        var eldest = this.store.order.head.next;
        this["delete"](eldest.value);
        return false; // did not grow
    }
    return !found; // whether it grew
};

LruSet.prototype["delete"] = function (value) {
    var found = this.store.has(value);
    if (found) {
        if (this.dispatchesRangeChanges) {
            this.dispatchBeforeRangeChange([], [value], 0);
        }
        this.store["delete"](value);
        this.length--;
        if (this.dispatchesRangeChanges) {
            this.dispatcheRangeChange([], [value], 0);
        }
    }
    return found;
};

LruSet.prototype.one = function () {
    if (this.length > 0) {
        return this.store.one();
    }
};

LruSet.prototype.clear = function () {
    this.store.clear();
    this.length = 0;
};

LruSet.prototype.reduce = function (callback, basis /*, thisp*/) {
    var thisp = arguments[2];
    var set = this.store;
    var index = 0;
    return set.reduce(function (basis, value) {
        return callback.call(thisp, basis, value, index++, this);
    }, basis, this);
};

LruSet.prototype.reduceRight = function () {
    var thisp = arguments[2];
    var set = this.store;
    var index = this.length - 1;
    return set.reduceRight(function (basis, value) {
        return callback.call(thisp, basis, value, index--, this);
    }, basis, this);
};

LruSet.prototype.iterate = function () {
    return this.store.iterate();
};

