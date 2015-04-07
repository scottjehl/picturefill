/*
    Based in part on observable arrays from Motorola Mobility’s Montage
    Copyright (c) 2012, Motorola Mobility LLC. All Rights Reserved.
    3-Clause BSD License
    https://github.com/motorola-mobility/montage/blob/master/LICENSE.md
*/

/*
    This module is responsible for observing changes to owned properties of
    objects and changes to the content of arrays caused by method calls.
    The interface for observing array content changes establishes the methods
    necessary for any collection with observable content.
*/

require("../shim");
var List = require("../list");
var WeakMap = require("weak-map");
var PropertyChanges = require("./property-changes");
var RangeChanges = require("./range-changes");
var MapChanges = require("./map-changes");

var array_splice = Array.prototype.splice;
var array_slice = Array.prototype.slice;
var array_reverse = Array.prototype.reverse;
var array_sort = Array.prototype.sort;

// use different strategies for making arrays observable between Internet
// Explorer and other browsers.
var protoIsSupported = {}.__proto__ === Object.prototype;
var array_makeObservable;
if (protoIsSupported) {
    array_makeObservable = function () {
        this.__proto__ = ChangeDispatchArray;
    };
} else {
    array_makeObservable = function () {
        Object.defineProperties(this, observableArrayProperties);
    };
}

Object.defineProperty(Array.prototype, "makeObservable", {
    value: array_makeObservable,
    writable: true,
    configurable: true,
    enumerable: false
});

function defineEach(prototype) {
    for (var name in prototype) {
        Object.defineProperty(Array.prototype, name, {
            value: prototype[name],
            writable: true,
            configurable: true,
            enumerable: false
        });
    }
}

defineEach(PropertyChanges.prototype);
defineEach(RangeChanges.prototype);
defineEach(MapChanges.prototype);

var observableArrayProperties = {

    isObservable: {
        value: true,
        writable: true,
        configurable: true
    },

    makeObservable: {
        value: Function.noop, // idempotent
        writable: true,
        configurable: true
    },

    reverse: {
        value: function reverse() {

            // dispatch before change events
            this.dispatchBeforeRangeChange(this, this, 0);
            for (var i = 0; i < this.length; i++) {
                PropertyChanges.dispatchBeforeOwnPropertyChange(this, i, this[i]);
                this.dispatchBeforeMapChange(i, this[i]);
            }

            // actual work
            array_reverse.call(this);

            // dispatch after change events
            for (var i = 0; i < this.length; i++) {
                PropertyChanges.dispatchOwnPropertyChange(this, i, this[i]);
                this.dispatchMapChange(i, this[i]);
            }
            this.dispatchRangeChange(this, this, 0);

            return this;
        },
        writable: true,
        configurable: true
    },

    sort: {
        value: function sort() {

            // dispatch before change events
            this.dispatchBeforeRangeChange(this, this, 0);
            for (var i = 0; i < this.length; i++) {
                PropertyChanges.dispatchBeforeOwnPropertyChange(this, i, this[i]);
                this.dispatchBeforeMapChange(i, this[i]);
            }

            // actual work
            array_sort.apply(this, arguments);

            // dispatch after change events
            for (var i = 0; i < this.length; i++) {
                PropertyChanges.dispatchOwnPropertyChange(this, i, this[i]);
                this.dispatchMapChange(i, this[i]);
            }
            this.dispatchRangeChange(this, this, 0);

            return this;
        },
        writable: true,
        configurable: true
    },

    splice: {
        value: function splice(start, length) {
            var minus = array_slice.call(this, start, start + length);
            var plus = array_slice.call(arguments, 2);
            if (!minus.length && !plus.length)
                return plus; // [], but spare us an instantiation
            var diff = plus.length - minus.length;
            var oldLength = this.length;
            var newLength = Math.max(this.length + diff, start + plus.length);
            var longest = Math.max(oldLength, newLength);

            // dispatch before change events
            if (diff) {
                PropertyChanges.dispatchBeforeOwnPropertyChange(this, "length", this.length);
            }
            this.dispatchBeforeRangeChange(plus, minus, start);
            if (diff === 0) { // substring replacement
                for (var i = start; i < start + plus.length; i++) {
                    PropertyChanges.dispatchBeforeOwnPropertyChange(this, i, this[i]);
                    this.dispatchBeforeMapChange(i, this[i]);
                }
            } else if (PropertyChanges.hasOwnPropertyChangeDescriptor(this)) {
                // all subsequent values changed or shifted.
                // avoid (longest - start) long walks if there are no
                // registered descriptors.
                for (var i = start; i < longest; i++) {
                    PropertyChanges.dispatchBeforeOwnPropertyChange(this, i, this[i]);
                    this.dispatchBeforeMapChange(i, this[i]);
                }
            }

            // actual work
            if (start > oldLength) {
                this.length = start;
            }
            var result = array_splice.apply(this, arguments);

            // dispatch after change events
            if (diff === 0) { // substring replacement
                for (var i = start; i < start + plus.length; i++) {
                    PropertyChanges.dispatchOwnPropertyChange(this, i, this[i]);
                    this.dispatchMapChange(i, this[i]);
                }
            } else if (PropertyChanges.hasOwnPropertyChangeDescriptor(this)) {
                // all subsequent values changed or shifted.
                // avoid (longest - start) long walks if there are no
                // registered descriptors.
                for (var i = start; i < longest; i++) {
                    PropertyChanges.dispatchOwnPropertyChange(this, i, this[i]);
                    this.dispatchMapChange(i, this[i]);
                }
            }
            this.dispatchRangeChange(plus, minus, start);
            if (diff) {
                PropertyChanges.dispatchOwnPropertyChange(this, "length", this.length);
            }

            return result;
        },
        writable: true,
        configurable: true
    },

    // splice is the array content change utility belt.  forward all other
    // content changes to splice so we only have to write observer code in one
    // place

    set: {
        value: function set(index, value) {
            this.splice(index, 1, value);
            return this;
        },
        writable: true,
        configurable: true
    },

    shift: {
        value: function shift() {
            return this.splice(0, 1)[0];
        },
        writable: true,
        configurable: true
    },

    pop: {
        value: function pop() {
            if (this.length) {
                return this.splice(this.length - 1, 1)[0];
            }
        },
        writable: true,
        configurable: true
    },

    push: {
        value: function push(arg) {
            if (arguments.length === 1) {
                return this.splice(this.length, 0, arg);
            } else {
                var args = array_slice.call(arguments);
                return this.swap(this.length, 0, args);
            }
        },
        writable: true,
        configurable: true
    },

    unshift: {
        value: function unshift(arg) {
            if (arguments.length === 1) {
                return this.splice(0, 0, arg);
            } else {
                var args = array_slice.call(arguments);
                return this.swap(0, 0, args);
            }
        },
        writable: true,
        configurable: true
    },

    clear: {
        value: function clear() {
            return this.splice(0, this.length);
        },
        writable: true,
        configurable: true
    }

};

var ChangeDispatchArray = Object.create(Array.prototype, observableArrayProperties);

