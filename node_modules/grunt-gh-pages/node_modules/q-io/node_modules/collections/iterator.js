"use strict";

module.exports = Iterator;

var Object = require("./shim-object");
var GenericCollection = require("./generic-collection");

// upgrades an iterable to a Iterator
function Iterator(iterable) {

    if (!(this instanceof Iterator)) {
        return new Iterator(iterable);
    }

    if (Array.isArray(iterable) || typeof iterable === "string")
        return Iterator.iterate(iterable);

    iterable = Object(iterable);

    if (iterable instanceof Iterator) {
        return iterable;
    } else if (iterable.next) {
        this.next = function () {
            return iterable.next();
        };
    } else if (iterable.iterate) {
        var iterator = iterable.iterate();
        this.next = function () {
            return iterator.next();
        };
    } else if (Object.prototype.toString.call(iterable) === "[object Function]") {
        this.next = iterable;
    } else {
        throw new TypeError("Can't iterate " + iterable);
    }

}

Iterator.prototype.forEach = GenericCollection.prototype.forEach;
Iterator.prototype.map = GenericCollection.prototype.map;
Iterator.prototype.filter = GenericCollection.prototype.filter;
Iterator.prototype.every = GenericCollection.prototype.every;
Iterator.prototype.some = GenericCollection.prototype.some;
Iterator.prototype.any = GenericCollection.prototype.any;
Iterator.prototype.all = GenericCollection.prototype.all;
Iterator.prototype.min = GenericCollection.prototype.min;
Iterator.prototype.max = GenericCollection.prototype.max;
Iterator.prototype.sum = GenericCollection.prototype.sum;
Iterator.prototype.average = GenericCollection.prototype.average;
Iterator.prototype.flatten = GenericCollection.prototype.flatten;
Iterator.prototype.zip = GenericCollection.prototype.zip;
Iterator.prototype.enumerate = GenericCollection.prototype.enumerate;
Iterator.prototype.sorted = GenericCollection.prototype.sorted;
Iterator.prototype.group = GenericCollection.prototype.group;
Iterator.prototype.reversed = GenericCollection.prototype.reversed;
Iterator.prototype.toArray = GenericCollection.prototype.toArray;
Iterator.prototype.toObject = GenericCollection.prototype.toObject;
Iterator.prototype.iterator = GenericCollection.prototype.iterator;

// this is a bit of a cheat so flatten and such work with the generic
// reducible
Iterator.prototype.constructClone = function (values) {
    var clone = [];
    clone.addEach(values);
    return clone;
};

Iterator.prototype.mapIterator = function (callback /*, thisp*/) {
    var self = Iterator(this),
        thisp = arguments[1],
        i = 0;

    if (Object.prototype.toString.call(callback) != "[object Function]")
        throw new TypeError();

    return new self.constructor(function () {
        return callback.call(thisp, self.next(), i++, self);
    });
};

Iterator.prototype.filterIterator = function (callback /*, thisp*/) {
    var self = Iterator(this),
        thisp = arguments[1],
        i = 0;

    if (Object.prototype.toString.call(callback) != "[object Function]")
        throw new TypeError();

    return new self.constructor(function () {
        var value;
        while (true) {
            value = self.next();
            if (callback.call(thisp, value, i++, self))
                return value;
        }
    });
};

Iterator.prototype.reduce = function (callback /*, initial, thisp*/) {
    var self = Iterator(this),
        result = arguments[1],
        thisp = arguments[2],
        i = 0,
        value;

    if (Object.prototype.toString.call(callback) != "[object Function]")
        throw new TypeError();

    // first iteration unrolled
    try {
        value = self.next();
        if (arguments.length > 1) {
            result = callback.call(thisp, result, value, i, self);
        } else {
            result = value;
        }
        i++;
    } catch (exception) {
        if (isStopIteration(exception)) {
            if (arguments.length > 1) {
                return arguments[1]; // initial
            } else {
                throw TypeError("cannot reduce a value from an empty iterator with no initial value");
            }
        } else {
            throw exception;
        }
    }

    // remaining entries
    try {
        while (true) {
            value = self.next();
            result = callback.call(thisp, result, value, i, self);
            i++;
        }
    } catch (exception) {
        if (isStopIteration(exception)) {
            return result;
        } else {
            throw exception;
        }
    }

};

Iterator.prototype.concat = function () {
    return Iterator.concat(
        Array.prototype.concat.apply(this, arguments)
    );
};

Iterator.prototype.dropWhile = function (callback /*, thisp */) {
    var self = Iterator(this),
        thisp = arguments[1],
        stopped = false,
        stopValue;

    if (Object.prototype.toString.call(callback) != "[object Function]")
        throw new TypeError();

    self.forEach(function (value, i) {
        if (!callback.call(thisp, value, i, self)) {
            stopped = true;
            stopValue = value;
            throw StopIteration;
        }
    });

    if (stopped) {
        return self.constructor([stopValue]).concat(self);
    } else {
        return self.constructor([]);
    }
};

Iterator.prototype.takeWhile = function (callback /*, thisp*/) {
    var self = Iterator(this),
        thisp = arguments[1];

    if (Object.prototype.toString.call(callback) != "[object Function]")
        throw new TypeError();

    return self.mapIterator(function (value, i) {
        if (!callback.call(thisp, value, i, self))
            throw StopIteration;
        return value;
    });
};

Iterator.prototype.zipIterator = function () {
    return Iterator.unzip(
        Array.prototype.concat.apply(this, arguments)
    );
};

Iterator.prototype.enumerateIterator = function (start) {
    return Iterator.count(start).zipIterator(this);
};

// creates an iterator for Array and String
Iterator.iterate = function (iterable) {
    var start;
    start = 0;
    return new Iterator(function () {
        // advance to next owned entry
        if (typeof iterable === "object") {
            while (!(start in iterable)) {
                // deliberately late bound
                if (start >= iterable.length)
                    throw StopIteration;
                start += 1;
            }
        } else if (start >= iterable.length) {
            throw StopIteration;
        }
        var result = iterable[start];
        start += 1;
        return result;
    });
};

Iterator.cycle = function (cycle, times) {
    if (arguments.length < 2)
        times = Infinity;
    //cycle = Iterator(cycle).toArray();
    var next = function () {
        throw StopIteration;
    };
    return new Iterator(function () {
        var iteration;
        try {
            return next();
        } catch (exception) {
            if (isStopIteration(exception)) {
                if (times <= 0)
                    throw exception;
                times--;
                iteration = Iterator.iterate(cycle);
                next = iteration.next.bind(iteration);
                return next();
            } else {
                throw exception;
            }
        }
    });
};

Iterator.concat = function (iterators) {
    iterators = Iterator(iterators);
    var next = function () {
        throw StopIteration;
    };
    return new Iterator(function (){
        var iteration;
        try {
            return next();
        } catch (exception) {
            if (isStopIteration(exception)) {
                iteration = Iterator(iterators.next());
                next = iteration.next.bind(iteration);
                return next();
            } else {
                throw exception;
            }
        }
    });
};

Iterator.unzip = function (iterators) {
    iterators = Iterator(iterators).map(Iterator);
    if (iterators.length === 0)
        return new Iterator([]);
    return new Iterator(function () {
        var stopped;
        var result = iterators.map(function (iterator) {
            try {
                return iterator.next();
            } catch (exception) {
                if (isStopIteration(exception)) {
                    stopped = true;
                } else {
                    throw exception;
                }
            }
        });
        if (stopped) {
            throw StopIteration;
        }
        return result;
    });
};

Iterator.zip = function () {
    return Iterator.unzip(
        Array.prototype.slice.call(arguments)
    );
};

Iterator.chain = function () {
    return Iterator.concat(
        Array.prototype.slice.call(arguments)
    );
};

Iterator.range = function (start, stop, step) {
    if (arguments.length < 3) {
        step = 1;
    }
    if (arguments.length < 2) {
        stop = start;
        start = 0;
    }
    start = start || 0;
    step = step || 1;
    return new Iterator(function () {
        if (start >= stop)
            throw StopIteration;
        var result = start;
        start += step;
        return result;
    });
};

Iterator.count = function (start, step) {
    return Iterator.range(start, Infinity, step);
};

Iterator.repeat = function (value, times) {
    return new Iterator.range(times).mapIterator(function () {
        return value;
    });
};

// shim isStopIteration
if (typeof isStopIteration === "undefined") {
    global.isStopIteration = function (exception) {
        return Object.prototype.toString.call(exception) === "[object StopIteration]";
    };
}

// shim StopIteration
if (typeof StopIteration === "undefined") {
    global.StopIteration = {};
    Object.prototype.toString = (function (toString) {
        return function () {
            if (
                this === global.StopIteration ||
                this instanceof global.ReturnValue
            )
                return "[object StopIteration]";
            else
                return toString.call(this, arguments);
        };
    })(Object.prototype.toString);
}

// shim ReturnValue
if (typeof ReturnValue === "undefined") {
    global.ReturnValue = function ReturnValue(value) {
        this.message = "Iteration stopped with " + value;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ReturnValue);
        }
        if (!(this instanceof global.ReturnValue))
            return new global.ReturnValue(value);
        this.value = value;
    };
    ReturnValue.prototype = Error.prototype;
}

