<a href="http://promises-aplus.github.com/promises-spec"><img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png" align="right" /></a>
Vow [![Build Status](https://secure.travis-ci.org/dfilatov/vow.png)](http://travis-ci.org/dfilatov/vow)
=========

Promises/A+ implementation.
See https://github.com/promises-aplus/promises-spec.

Getting Started
---------------
###In Node.js###
You can install using Node Package Manager (npm):

    npm install vow

###In Browsers###
```html
<script type="text/javascript" src="vow.min.js"></script>
```
It also supports RequireJS module format and [YM module](https://github.com/ymaps/modules) format.

Vow has been tested in IE6+, Mozilla Firefox 3+, Chrome 5+, Safari 5+, Opera 10+.

API
---
  * [Creating promise](#vowpromisevalue)
  * [Promise API](#promise-api)
    * [fulfill](#fulfillvalue)
    * [reject](#rejectreason)
    * [notify](#notifyvalue)
    * [isFulfilled](#isfulfilled)
    * [isRejected](#isrejected)
    * [isResolved](#isresolved)
    * [valueOf](#valueof)
    * [then](#thenonfulfilled-onrejected-onprogress-context)
    * [fail](#failonrejected-context)
    * [always](#alwaysonresolved-context)
    * [progress](#progressonprogress-context)
    * [spread](#spreadonfulfilled-onrejected-context)
    * [done](#doneonfulfilled-onrejected-onprogress-context)
    * [delay](#delaydelay)
    * [timeout](#timeouttimeout)
    * [sync](#syncwithpromise)
  * [Vow API](#vow-api)
    * [isPromise](#ispromisevalue)
    * [when](#whenvalue-onfulfilled-onrejected-onprogress-context)
    * [fail](#failvalue-onrejected-context)
    * [always](#alwaysvalue-onresolved-context)
    * [progress](#progressvalue-onprogress-context)
    * [spread](#spreadvalue-onfulfilled-onrejected-context)
    * [done](#donevalue-onfulfilled-onrejected-onprogress-context)
    * [isFulfilled](#isfulfilledvalue)
    * [isRejected](#isrejectedvalue)
    * [isResolved](#isresolvededvalue)
    * [fulfill](#fulfillvalue-1)
    * [reject](#rejectreason-1)
    * [resolve](#resolvevalue)
    * [invoke](#invokefn-args)
    * [all](#allpromisesorvalues)
    * [allResolved](#allresolvedpromisesorvalues)
    * [any](#anypromisesorvalues)
    * [delay](#delayvalue-delay)
    * [timeout](#timeoutvalue-timeout)

####Vow.promise([value])####
Creates a new promise if no ````value```` given, or creates a new fulfilled promise if the ````value```` is not a promise, or returns ````value```` if the given ````value```` is a promise.
````javascript
var promise = Vow.promise(), // creating a new promise
    fulfilledPromise = Vow.promise('ok'), // creating a new fulfilled promise
    anotherPromise = Vow.promise(existingPromise); // anotherPromise is equal to the existingPromise
````
###Promise API###
####fulfill(value)####
Fulfills promise with given ````value````
````javascript
var promise = Vow.promise();
promise.fulfill('completed'); // fulfilling promise with 'completed' value
````
####reject(reason)####
Rejects promise with given ````reason````
````javascript
var promise = Vow.promise();
promise.reject(Error('internal error')); // rejecting promise with Error object
````
####notify(value)####
Notifies promise about progress with given ````value````
````javascript
var promise = Vow.promise();
promise.notify(20); // notifying promise with 20 value
````

####isFulfilled()####
Returns true if the promise is fulfilled
````javascript
var promise = Vow.promise();
promise.isFulfilled(); // returns false
promise.fulfill('completed');
promise.isFulfilled(); // returns true
````

####isRejected()####
Returns true if the promise is rejected
````javascript
var promise = Vow.promise();
promise.isRejected(); // returns false
promise.reject(Error('internal error'));
promise.isRejected(); // returns true
````

####isResolved()####
Returns true if the promise is fulfilled or rejected
````javascript
var promise = Vow.promise();
promise.isResolved(); // returns false
promise.fulfill('completed'); // or promise.reject(Error('internal error'));
promise.isResolved(); // returns true
````

####valueOf()####
Returns value of the promise:
  * value of fulfillment, if promise is fullfilled
  * reason of rejection, if promise is rejected
  * undefined, if promise is not resolved

####then([onFulfilled], [onRejected], [onProgress], [context])####
Are arranged for:
  * ````onFulfilled```` to be called with the value after promise is fulfilled,
  * ````onRejected```` to be called with the rejection reason after promise is rejected.
  * ````onProgress```` to be called with the value when promise is notified about progress.
  * ````context```` context of callbacks

Returns a new promise. See [Promises/A+ specification](https://github.com/promises-aplus/promises-spec) for details.
````javascript
var promise = Vow.promise();
promise.then(
    function() { }, // to be called after promise is fulfilled
    function() { }, // to be called after promise is rejected
    function() { } // to be called when promise is notified
    );
````

####fail(onRejected, [context])####
Arranges to call ````onRejected```` with given ````context```` on the promise rejection reason if it is rejected. Shortcut for ````then(null, onRejected)````.
````javascript
var promise = Vow.promise();
promise.fail(
    function() { // to be called after promise is rejected
    });
promise.reject(Error('error'));
````

####always(onResolved, [context])####
Arranges to call ````onResolved```` with given ````context```` on the promise if it is fulfilled or rejected.
````javascript
var promise = Vow.promise();
promise.always(
    function(promise) { // to be called after promise is fulfilled or rejected
    });
promise.fulfill('ok'); // or promise.reject(Error('error'));
````

####progress(onProgress, [context])####
Arranges to call ````onProgress```` with given ````context```` on the promise if it is notified.
Shortcut for ````then(null, null, onProgress)````.
````javascript
var promise = Vow.promise();
promise.progress(
    function(val) { // to be called when promise is notified
        console.log('performed ' + val + '% of the job');
    });
    
promise.notify(20); // performed 20% of the job
promise.notify(40); // performed 40% of the job
promise.notify(60); // performed 60% of the job
````

####spread([onFulfilled], [onRejected], [context])####
Like "then", but "spreads" the array into a variadic value handler.
It useful with [Vow.all](#allpromises), [Vow.allResolved](#allresolvedpromises) methods.
````javascript
var promise1 = Vow.promise(),
    promise2 = Vow.promise();

Vow.all([promise1, promise2]).spread(function(arg1, arg2) {
    // arg1 should be "1", arg2 should be "'two'"
});

promise1.fulfill(1);
promise2.fulfill('two');
````

####done([onFulfilled], [onRejected], [onProgress], [context])####
Terminates a chain of promises. If the promise is rejected, throws it as an exception in a future turn of the event loop.
````javascript
var promise = Vow.promise();
promise.reject(Error('Internal error'));
promise.done(); // exception to be thrown
````
####delay(delay)####
Returns a new promise that will be fulfilled in ````delay```` milliseconds if the promise is fulfilled, or immediately rejected if promise is rejected.

####timeout(timeout)####
Returns a new promise that will be rejected in ````timeout```` milliseconds if the promise is not resolved beforehand.
````javascript
var promise = Vow.promise(),
    promiseWithTimeout1 = promise.timeout(50),
    promiseWithTimeout2 = promise.timeout(200);

setTimeout(
    function() {
        promise.fulfill('ok');
    },
    100);

promiseWithTimeout1.fail(function(e) {
    // promiseWithTimeout to be rejected in 50ms
});

promiseWithTimeout2.then(function(val) {
    // promiseWithTimeout to be fulfilled with "'ok'" value
});
````

####sync(withPromise)####
Synchronizes promise state with ````withPromise```` state. Shortcut for:
````javascript
withPromise.then(
    function(val) {
        promise.fulfill(val);
    },
    function(err) {
        promise.reject(err);
    },
    function(val) {
        promise.notify(val);
    });
````

###Vow API###

####isPromise(value)####
Returns true if the given ````value```` is a promise.
````javascript
Vow.isPromise('value'); // returns false
Vow.isPromise(Vow.promise()); // returns true
````

####when(value, [onFulfilled], [onRejected], [onProgress], [context])####
Static equivalent to [promise.then](#thenonfulfilled-onrejected-onprogress-context). If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####fail(value, onRejected, [context])####
Static equivalent to [promise.fail](#failonrejected-context). If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####always(value, onResolved, [context])####
Static equivalent to [promise.always](#alwaysonresolved-context). If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####progress(value, onProgress, [context])####
Static equivalent to [promise.progress](#progressonprogress-context). If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####spread(value, [onFulfilled], [onRejected], [context])####
Static equivalent to [promise.spread](#spreadonfulfilled-onrejected-context).
If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####done(value, [onFulfilled], [onRejected], [onProgress], [context]])####
Static equivalent to [promise.done](#doneonfulfilled-onrejected-onprogress-context).
If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####isFulfilled(value)####
Static equivalent to [promise.isFulfilled](#isfulfilled).
If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####isRejected(value)####
Static equivalent to [promise.isRejected](#isrejected).
If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####isResolved(value)####
Static equivalent to [promise.isResolved](#isresolved).
If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####fulfill(value)####
Returns a promise that has already been fulfilled with the given ````value````. If ````value```` is a promise, returned promise will be fulfilled with fulfill/rejection value of given promise.

####reject(reason)####
Returns a promise that has already been rejected with the given ````reason````. If ````reason```` is a promise, returned promise will be rejected with fulfill/rejection value of given promise.

####resolve(value)####
Returns a promise that has already been fulfilled with the given ````value````. If ````value```` is a promise, returns ````promise````.

####invoke(fn, ...args)####
Invokes a given function ````fn```` with arguments ````args````. Returned promise:
  * will be fulfilled with returned value if value is not a promise
  * will be rejected if function throw exception
  * value will be returned if value is a promise

````javascript
var promise1 = Vow.invoke(function(value) {
        return value;
    }, 'ok'),
    promise2 = Vow.invoke(function() {
        throw Error();
    });

promise1.isFulfilled(); // true
promise1.valueOf(); // 'ok'
promise2.isRejected(); // true
promise2.valueOf(); // instance of Error
````

####all(promisesOrValues)####
Returns a promise to be fulfilled only after all the items in ````promisesOrValues```` are fulfilled, or to be rejected when any of the promises is rejected.

````promisesOrValues```` can be Array:
````javascript
var promise1 = Vow.promise(),
    promise2 = Vow.promise();

Vow.all([promise1, promise2, 3])
    .then(function(value) {
        // value is [1, 2, 3]
    });

promise1.fulfill(1);
promise2.fulfill(2);
````
or Object:
````javascript
var promise1 = Vow.promise(),
    promise2 = Vow.promise();

Vow.all({ a : promise1, b : promise2, c : 3 })
    .then(function(value) {
        // value is { a : 1, b : 2, c : 3 }
    });

promise1.fulfill(1);
promise2.fulfill(2);
````

####allResolved(promisesOrValues)####
Returns a promise to be fulfilled only after all the items in ````promisesOrValues```` are resolved.
````javascript
var promise1 = Vow.promise(),
    promise2 = Vow.promise();

Vow.allResolved([promise1, promise2])
    .spread(function(promise1, promise2) {
        promise1.valueOf(); // returns 'error'
        promise2.valueOf(); // returns 'ok'
    });

promise1.reject('error');
promise2.fulfill('ok');
````

####any(promisesOrValues)####
Returns a promise to be fulfilled only when any of the items in ````promisesOrValues```` are fulfilled, or to be rejected when all the items are rejected (with the reason of the first rejected item).

####delay(value, delay)####
Static equivalent to [promise.delay](#delaydelay). If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.

####timeout(value, timeout)####
Static equivalent to [promise.timeout](#timeouttimeout). If given ````value```` is not a promise, then ````value```` is equivalent to fulfilled promise.
