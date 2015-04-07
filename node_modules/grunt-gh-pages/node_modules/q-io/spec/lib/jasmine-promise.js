"use strict";

var Q = require("q");

/**
 * Modifies the way that individual specs are run to easily test async
 * code with promises.
 *
 * A spec may return a promise. If it does, then the spec passes if and
 * only if that promise is fulfilled within a very short period of time.
 * If it is rejected, or if it isn't fulfilled quickly, the spec fails.
 *
 * In this way, we can use promise chaining to structure our asynchronous
 * tests. Expectations all down the chain of promises are all checked and
 * guaranteed to be run and resolved or the test fails.
 *
 * This is a big win over the runs() and watches() code that jasmine
 * supports out of the box.
 */
jasmine.Block.prototype.execute = function (onComplete) {
    var spec = this.spec;
    try {
        var result = this.func.call(spec, onComplete);

        // It seems Jasmine likes to return the suite if you pass it anything.
        // So make sure it's a promise first.
        if (result && typeof result.then === "function") {
            Q.timeout(result, 500).then(function () {
                onComplete();
            }, function (error) {
                spec.fail(error);
                onComplete();
            });
        } else if (this.func.length === 0) {
            onComplete();
        }
    } catch (error) {
        spec.fail(error);
        onComplete();
    }
};

