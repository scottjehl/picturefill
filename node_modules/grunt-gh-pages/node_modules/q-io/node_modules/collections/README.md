[![Build Status](https://travis-ci.org/montagejs/collections.png?branch=master)](http://travis-ci.org/montagejs/collections)

# Collections

This package contains JavaScript implementations of common data
structures with idiomatic iterfaces, including extensions for Array and
Object.

You can use these Node Packaged Modules with Node.js, [Browserify][],
[Mr][], or any compatible CommonJS module loader.  Using a module loader
or bundler when using Collections in web browsers has the advantage of
only incorporating the modules you need.  However, you can just embed
`<script src="collections/collections.min.js">` and *all* of the
collections will be introduced as globals.  :warning:
`require("collections")` is not supported.

```
npm install collections --save
```

[Browserify]: https://github.com/substack/node-browserify
[Mr]: https://github.com/montagejs/mr


-   **List(values, equals, getDefault)**

    ```javascript
    var List = require("collections/list");
    ```

    An ordered collection of values with fast insertion and deletion and
    forward and backward traversal, backed by a cyclic doubly linked
    list with a head node.  Lists support most of the Array interface,
    except that they use and return nodes instead of integer indicies in
    analogous functions.

    Lists have a `head` `Node`. The node type is available as `Node` on
    the list prototype and can be overridden by inheritors.  Each node
    has `prev` and `next` properties.

-   **Set(values, equals, hash, getDefault)**

    ```javascript
    var Set = require("collections/set");
    ```

    A collection of unique values.  The set can be iterated in the order
    of insertion.  With a good hash function for the stored values,
    insertion and removal are fast regardless of the size of the
    collection.  Values may be objects.  The `equals` and `hash`
    functions can be overridden to provide alternate definitions of
    "unique".  `Set` is backed by `FastSet` and `List`.

-   **Map(map, equals, hash, getDefault)**

    ```javascript
    var Map = require("collections/map");
    ```

    A collection of key and value entries with unique keys.  Keys may be
    objects.  The collection iterates in the order of insertion.  `Map`
    is backed by `Set`.

-   **MultiMap(map, getDefault, equals, hash)**

    ```javascript
    var MultiMap = require("collections/multi-map");
    ```

    A collection of keys mapped to collections of values.  The default
    `getDefault` collection is an `Array`, but it can be a `List` or any
    other array-like object.  `MultiMap` inherits `Map` but overrides
    the `getDefault(key)` provider.

-   **WeakMap()**

    ```javascript
    var WeakMap = require("collections/weak-map");
    ```

    A non-iterable collection of key value pairs.  Keys must objects and
    do not benefit from `hash` functions.  Some engines already
    implement `WeakMap`.  The non-iterable requirement makes it possible
    for weak maps to collect garbage when the key is no longer
    available, without betraying when the key is collected.  The shimmed
    implementation undetectably annotates the given key and thus does
    not necessarily leak memory, but cannot collect certain reference
    graphs.  This WeakMap shim was implemented by Mark Miller of Google.

-   **SortedSet(values, equals, compare, getDefault)**

    ```javascript
    var SortedSet = require("collections/sorted-set");
    ```

    A collection of unique values stored in stored order, backed by a
    splay tree.  The `equals` and `compare` functions can be overridden
    to provide alternate definitions of "unique".

    The `compare` method *must* provide a total order of all unique
    values.  That is, if `compare(a, b) === 0`, it *must* follow that
    `equals(a, b)`.

-   **SortedMap(map, equals, compare, getDefault)**

    ```javascript
    var SortedMap = require("collections/sorted-map");
    ```

    A collection of key value pairs stored in sorted order.  `SortedMap`
    is backed by `SortedSet` and the `GenericMap` mixin.

-   **LruSet(values, maxLength, equals, hash, getDefault)**

    ```javascript
    var LruSet = require("collections/lru-set");
    ```

    A cache with the Least-Recently-Used strategy for truncating its
    content when it’s length exceeds `maxLength`.  `LruSet` is backed by
    a `Set` and takes advantage of the already tracked insertion order.
    Both getting and setting a value constitute usage, but checking
    whether the set has a value and iterating values do not.

-   **LruMap(map, maxLength, equals, hash, getDefault)**

    ```javascript
    var LruMap = require("collections/lru-map");
    ```

    A cache of entries backed by an `LruSet`.

-   **SortedArray(values, equals, compare, getDefault)**

    ```javascript
    var SortedArray = require("collections/sorted-array");
    ```

    A collection of values stored in a stable sorted order, backed by an
    array.

-   **SortedArraySet(values, equals, compare, getDefault)**

    ```javascript
    var SortedArraySet = require("collections/sorted-array-set");
    ```

    A collection of unique values stored in sorted order, backed by a
    plain array.  If the given values are an actual array, the sorted
    array set takes ownership of that array and retains its content.  A
    sorted array set performs better than a sorted set when it has
    roughly less than 100 values.

-   **SortedArrayMap(values, equals, compare, getDefault)**

    ```javascript
    var SortedArrayMap = require("collections/sorted-array-map");
    ```

    A collection of key value pairs stored in sorted order, backed by a
    sorted array set.

-   **FastSet(values, equals, hash, getDefault)**

    ```javascript
    var FastSet = require("collections/fast-set");
    ```

    A collection of unique values stored like a hash table.  The
    underlying storage is a `Dict` that maps hashes to lists of values
    that share the same hash.  Values may be objects.  The `equals` and
    `hash` functions can be overridden to provide alternate definitions
    of "unique".

-   **FastMap(map, equals, hash, getDefault)**

    ```javascript
    var FastMap = require("collections/fast-map");
    ```

    A collection of key and value entries with unique keys, backed by a
    set.  Keys may be objects.  `FastMap` is backed by `FastSet` and the
    `GenericMap` mixin.

-   **Dict(values, getDefault)**

    ```javascript
    var Dict = require("collections/dict");
    ```

    A collection of string to value mappings backed by a plain
    JavaScript object.  The keys are mangled to prevent collisions with
    JavaScript properties.

-   **Heap(values, equals, compare)**

    ```javascript
    var Heap = require("collections/heap");
    ```

    A collection that can always quickly (constant time) report its
    largest value, with reasonable performance for incremental changes
    (logarithmic), using a contiguous array as its backing storage.
    However, it does not track the sorted order of its elements.

-   **Iterator(iterable)**

    ```javascript
    var Iterator = require("collections/iterator");
    ```

    A wrapper for any iterable that implements `iterate` or iterator the
    implements `next`, providing a rich lazy traversal interface.

-   **Array**

    ```javascript
    require("collections/shim-array");
    ```

    An ordered collection of values with fast random access, push, and
    pop, but slow splice. The `array` module provides extensions so it
    hosts all the expressiveness of other collections.  The `shim-array`
    module shims EcmaScript 5 methods onto the array prototype if they
    are not natively implemented.

-   **Object**

    ```javascript
    require("collections/shim-object");
    ```

    Can be used as a mapping of owned string keys to arbitrary values.
    The `object` module provides extensions for the `Object` constructor
    that support the map collection interface and can delegate to
    methods of collections, allowing them to gracefully handle both
    object literals and collections.

## Constructor Arguments

For all of these constructors, the argument `values` is an optional
collection of initial values, and may be an array.  If the `values` are
in a map collection, the the values are taken, but the keys are ignored.

-   **map**

    The `map` argument is an optional collection to copy shallowly into
    the new mapping.  The `map` may be an object literal.  If `map`
    implements `keys`, it is treated as a mapping itself and copied.
    Otherwise, if `map` implements `forEach`, it may be any collection
    of `[key, value]` pairs.

`equals(x, y)`, `compare(x, y)`, and `hash(value)` are all optional
arguments overriding the meaning of equality, comparability, and
consistent hashing for the purposes of the collection.  `equals` must
return a boolean.  `compare` must return an integer with the same
relationship to zero as x to y.  `hash` should consistently return the
same string for any given object.

-   **equals(x, y)**

    The default `equals` operator is implemented in terms of `===`, but
    treats `NaN` as equal to itself and `-0` as distinct from `+0`.  It
    also delegates to an `equals` method of either the left or right
    argument if one exists.  The default equality operator is shimmed as
    `Object.equals`.

-   **compare(x, y)**

    The default `compare` operator is implemented in terms of `<` and
    `>`.  It delegates to the `compare` method of either the left or
    right argument if one exists.  It inverts the result if it uses the
    falls to the right argument.  The default comparator is shimmed as
    `Object.compare`.

-   **hash(value)**

    The default `hash` operator uses `toString` for values and provides
    a [Unique Label][] for arbitrary objects.  The default hash is
    shimmed as `Object.hash`.

[Unique Label]: (http://wiki.ecmascript.org/doku.php?id=harmony:weak_maps#unique_labeler)

-   **getDefault(key or value)**

    The default `getDefault` function is `Function.noop`, which returns
    `undefined`.  The fallback function is used when you `get` a
    nonexistant value from any collection.  The `getDefault` function
    becomes a member of the collection object, so `getDefault` is called
    with the collection as `this`, so you can also use it to guarantee
    that default values in a collection are retained, as in `MultiMap`.


## Collection Methods

Where these methods coincide with the specification of an existing
method of Array, Array is noted as an implementation.  `Array+` refers
to shimmed arrays, as installed with the `array` module.  `Object`
refers to methods implemented on the `Object` constructor function, as
opposed to the `Object.prototype`.  `Object+` in turn refers to methods
shimmed on the object constructor by the `object` module.  These
functions accept the object as the first argument instead of the `this`
implied argument.  ~~Strikethrough~~ indicates an implementation that
should exist but has not yet been made (Send a pull request!).

These are all of the collections:

(Array, Array+, Object+, Iterator, List, Set, Map, MultiMap, WeakMap,
SortedSet, SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
SortedArrayMap, FastSet, FastMap, Dict)

-   **has(key)**

    Whether a value for the given key exists.

    (Object+, Map, MultiMap, SortedMap, LruMap, SortedArrayMap, FastMap,
    Dict)

    **has(value, opt_equals)**

    Whether a value exists in this collection.  This is slow for list
    (linear), but fast (logarithmic) for SortedSet and SortedArraySet,
    and very fast (constant) for Set.

    (Array+, List, Set, SortedSet, LruSet, SortedArray, SortedArraySet,
    FastSet)

-   **get(key or index)**

    The value for a key.  If a Map or SortedMap lacks a key, returns
    `getDefault(key)`.

    (Array+, Map, SortedMap, SortedArrayMap, WeakMap, Object+)

    **get(value)**

    Gets the equivalent value, or falls back to `getDefault(value)`.

    (List, Set, SortedSet, LruSet, SortedArray, SortedArraySet, FastSet)

-   **set(key or index, value)**

    Sets the value for a key.

    (Map, MultiMap, WeakMap, SortedMap, LruMap, SortedArrayMap, FastMap,
    Dict)

-   **add(value)**

    Adds a value.  Ignores the operation and returns false if an
    equivalent value already exists.

    (Array+, List, Set, SortedSet, LruSet, SortedArray, SortedArraySet,
    FastSet, Heap)

    **add(value, key)**

    Aliases `set(key, value)`, to assist generic methods used for maps,
    sets, and other collections.

-   **addEach(values)**

    Copies values from another collection to this one.

    (Array+, List, Set, SortedSet, LruSet, SortedArray, SortedArraySet,
    FastSet, Heap)

    **addEach(mapping)**

    Copies entries from another collection to this map.  If the mapping
    implements `keys` (indicating that it is a mapping) and `forEach`,
    all of the key value pairs are copied.  If the mapping only
    implements `forEach`, it is assumed to contain `[key, value]` arrays
    which are copied instead.

    (Object+, Map, MultiMap, SortedMap, LruMap, SortedArrayMap, FastMap,
    Dict)

-   **delete(key)**

    Deletes the value for a given key.  Returns whether the key was
    found.

    (Map, MultiMap, WeakMap, SortedMap, LruMap, SortedArrayMap, FastMap,
    Dict)

    **delete(value)**

    Deletes a value.  Returns whether the value was found.

    (Set, SortedSet, LruSet, SortedArray, SortedArraySet, FastSet, Heap)

    **delete(value, equals)**

    Deletes the equivalent value.  Returns whether the value was found.

    (Array+, List)

-   **deleteEach(values or keys)**

    Deletes every value or every value for each key.

    (Array+, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **indexOf(value)**

    Returns the position in the collection of a value, or `-1` if it is
    not found.  Returns the position of the first of equivalent values.
    For an Array this takes linear time.  For a SortedArray and
    SortedArraySet, it takes logarithmic time to perform a binary
    search.  For a SortedSet, this takes ammortized logarithmic time
    since it incrementally updates the number of nodes under each
    subtree as it rotates.

    (Array, ~~List~~, SortedSet, SortedArray, SortedArraySet)

-   **lastIndexOf(value)**

    Returns the position in the collection of a value, or `-1` if it is
    not found.  Returns the position of the last of equivalent values.

    (Array, ~~List~~, SortedArray, SortedArraySet)

-   **find(value, opt_equals)**

    Finds a value.  For List and SortedSet, returns the node at which
    the value was found.  For SortedSet, the optional `equals` argument
    is ignored.

    (Array+, List, SortedSet)

-   **findLast(value, opt_equals)**

    Finds the last equivalent value, returning the node at which the
    value was found.

    (Array+, List, SortedArray, SortedArraySet)

-   **findLeast()**

    Finds the smallest value, returning the node at which it was found,
    or undefined.  This is fast (logarithmic) and performs no rotations.

    (SortedSet)

-   **findLeastGreaterThan(value)**

    Finds the smallest value greater than the given value.  This is fast
    (logarithic) but does cause rotations.

    (SortedSet)

-   **findLeastGreaterThanOrEqual(value)**

    Finds the smallest value greater than or equal to the given value.
    This is fast (logarithmic) but does cause rotations.

    (SortedSet)

-   **findGreatest()**

    (SortedSet)

-   **findGreatestLessThan(value)**

    (SortedSet)

-   **findGreatestLessThanOrEqual(value)**

    (SortedSet)

-   **push(...values)**

    Adds values to the end of a collection.

    (Array, List)

    **push(...values)** for non-dequeues

    Adds values to their proper places in a collection.
    This method exists only to have the same interface as other
    collections.

    (Set, SortedSet, LruSet, SortedArray, SortedArraySet, FastSet, Heap)

-   **unshift(...values)**

    Adds values to the beginning of a collection.

    (Array, List)

    **unshift(...values)** for non-dequeues

    Adds values to their proper places in a collection.
    This method exists only to have the same interface as other
    collections.

    (Set, SortedSet, LruSet, SortedArray, SortedArraySet, FastSet)

-   **pop()**

    Removes and returns the value at the end of a collection.  For a
    Heap, this means the greatest contained value, as defined by the
    comparator.

    (Array, List, Set, SortedSet, LruSet, SortedArray, SortedArraySet,
    Heap)

-   **shift()**

    Removes and returns the value at the beginning of a collection.

    (Array, List, Set, SortedSet, LruSet, SortedArray, SortedArraySet)

-   **peek()**

    Returns the last value in an ordered collection.

    (List)

-   **poke(value)**

    Replaces the last value in an ordered collection.

    (List)

-   **slice(start, end)**

    Returns an array of the values contained in the
    half-open interval [start, end), that is, including the start and
    excluding the end.  For lists and arrays, both terms may be numeric
    positive or negative indicies.  For a list, either term may be a
    node.

    (Array, List, SortedSet, SortedArray, SortedArraySet)

-   **splice(start, length, ...values)**

    Works as with an array, but for a list, the start may be an index or
    a node.

    (Array, List, SortedArray, SortedSet, SortedArraySet)

-   **swap(start, length, values)**

    Performs a splice without variadic arguments.

    (Array+, List, SortedArray, SortedSet, SortedArraySet)

-   **clear()**

    Deletes the all values.

    (Array+, Object+, List, Set, Map, MultiMap, SortedSet,
    SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict, Heap)

-   **sort(compare)**

    Sorts a collection in place.  The comparator by only be a function.
    The default comparator coerces unlike types rather than fail to
    compare.

    (Array)

-   **sorted(compare, by, order)**

    Returns a collection as an array in sorted order.  Accepts an
    optional `compare(x, y)` function, `by(property(x))` function, and
    `order` indicator, `-1` for descending, `1` for ascending, `0` for
    stable.

    Instead of a `compare` function, the comparator can be an object
    with `compare` and `by` functions.  The default `compare` value is
    `Object.compare`.

    The `by` function must be a function that accepts a value from the
    collection and returns a representative value on which to sort.

    (Array+, List, Set, Map, SortedSet, LruSet, SortedArray,
    SortedArraySet, FastSet, Heap)

-   **group(callback, thisp, equals)**

    Returns an array of [key, equivalence class] pairs where every
    element from the collection is placed into an equivalence class
    if they have the same corresponding return value from the given
    callback.

    (Array+, Object+, List, Set, Map, MultiMap, SortedSet,
    SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict, Heap, Iterator)

-   **reverse()**

    Reverses a collection in place.

    (Array, List)

-   **reversed()**

    Returns a collection of the same type with this collection's
    contents in reverse order.

    (Array, List)

-   **enumerate(start=0)**

    Returns an array of [index, value] pairs from the source collection,
    starting with the given index.

-   **concat(...iterables)**

    Produces a new collection of the same type containing all the values
    of itself and the values of any number of other collections.  Favors
    the last of duplicate values.  For map-like objects, the given
    iterables are treated as map-like objects and each successively
    updates the result.  Array is like a map from index to value.  List,
    Set, and SortedSet are like maps from nodes to values.

    (Array, ~~Object+~~, Iterator, List, Set, Map, MultiMap,
    SortedSet, SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict, Heap)

-   **keys()**

    Returns an array of the keys.

    (Object, Map, MultiMap, SortedMap, LruMap, SortedArrayMap, FastMap,
    Dict)

-   **values()**

    Returns an array of the values

    (Object+, Map, MultiMap, SortedMap, LruMap, SortedArrayMap, FastMap,
    Dict)

-   **entries()**

    Returns an array of `[key, value]` pairs for each entry.

    (Object+, Map, MultiMap, SortedMap, LruMap, SortedArrayMap, FastMap,
    Dict)

-   **reduce(callback(result, value, key, object, depth), basis,
    thisp)**:

    (Array, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **reduceRight(callback(result, value, key, object, depth), basis,
    thisp)**:

    (Array, List, SortedSet, ~~SortedMap~~, SortedArray, SortedArraySet,
    ~~SortedArrayMap~~, Heap)

-   **forEach(callback(value, key, object, depth), thisp)**

    Calls the callback for each value in the collection.  The iteration
    of lists is resilient to changes to the list.  Particularly, nodes
    added after the current node will be visited and nodes added before
    the current node will be ignored, and no node will be visited twice.

    (Array, Object+, Iterator, List, Set, Map, MultiMap, WeakMap,
    SortedSet, SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict, Heap)

-   **map(callback(value, key, object, depth), thisp)**

    (Array, Object+, Iterator, List, Set, Map, MultiMap, WeakMap,
    SortedSet, SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict, Heap)

-   **toArray()**

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **toObject()**

    Converts any collection to an object, treating this collection as a
    map-like object.  Array is like a map from index to value.

    (Array+ Iterator, List, Map, MultiMap, SortedMap, LruMap,
    SortedArrayMap, FastMap, Dict, Heap)

-   **filter(callback(value, key, object, depth), thisp)**

    (Array, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **every(callback(value, key, object, depth), thisp)**

    Whether every value passes a given guard.  Stops evaluating the
    guard after the first failure.  Iterators stop consuming after the
    the first failure.

    (Array, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **some(callback(value, key, object, depth), thisp)**

    Whether there is a value that passes a given guard.  Stops
    evaluating the guard after the first success.  Iterators stop
    consuming after the first success.

    (Array, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **any()**

    Whether any value is truthy.

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **all()**

    Whether all values are truthy.

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **min()**

    The smallest value.  This is fast for sorted collections (logarithic
    for SortedSet, constant for SortedArray, SortedArraySet, and
    SortedArrayMap), but slow for everything else (linear).

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict)

-   **max()**

    The largest value.  This is fast for sorted collections (logarithic
    for SortedSet, constant for SortedArray, SortedArraySet, and
    SortedArrayMap), but slow for everything else (linear).

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **one()**

    Any single value, or throws an exception if there are no values.
    This is very fast (constant) for all collections.  For a sorted set,
    the value is not deterministic and depends on what value was most
    recently accessed.

    (Array+, List, Set, Map, MultiMap, SortedSet, SortedMap, LruSet,
    LruMap, SortedArray, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **only()**

    The one and only value, or throws an exception if there are no
    values or more than one value.

    (Array+, List, Set, Map, MultiMap, SortedSet, SortedMap, LruSet,
    LruMap, SortedArray, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **sum()**

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet,
    SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict)

-   **average()**

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet,
    SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict)

-   **flatten()**

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet,
    SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict, Heap)

-   **zip(...collections)**

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet,
    SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict, Heap)

-   **enumrate(zero)**

    (Array+, Iterator, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, SortedArray, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict, Heap)

-   **clone(depth, memo)**

    Replicates the collection.  Clones the values deeply, to the
    specified depth, using the memo to resolve reference cycles.  (which
    must the `has` and `set` parts of the Map interface, allowing
    objects for keys)  The default depth is infinite and the default
    memo is a WeakMap.

    `Object.clone` can replicate object literals inheriting directly
    from `Object.prototype` or `null`, or any object that implements
    `clone` on its prototype.  Any other object causes `clone` to throw
    an exception.

    The `clone` method on any other objects is not intended to be used
    directly since they do not necessarily supply a default depth and
    memo.

    (Array+, Object+, List, Set, Map, MultiMap, SortedSet,
    SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict, Heap)

-   **constructClone(values)**

    Replicates a collection shallowly.  This is used by each `clone`
    implementation to create a new collection of the same type, with the
    same options (`equals`, `compare`, `hash` options), but it leaves
    the job of deeply cloning the values to the more general `clone`
    method.

    (Array+, Object+, List, Set, Map, MultiMap, SortedSet,
    SortedMap, LruSet, LruMap, SortedArray, SortedArraySet,
    SortedArrayMap, FastSet, FastMap, Dict, Heap)

-   **equals(that, equals)**

    (Array+, Object+, List, Set, Map, MultiMap, SortedSet, SortedMap,
    LruSet, LruMap, ~~SortedArray~~, SortedArraySet, SortedArrayMap,
    FastSet, FastMap, Dict)

-   **compare(that)**

    (Array+, Object+, List, ~~SortedArray~~, ~~SortedArraySet~~)

-   **iterate()**

    Produces an iterator with a `next` method.  You may elect to get
    richer iterators by wrapping this iterator with an `Iterator` from
    the `iterator` module.  Iteration order of lists is resilient to
    changes to the list.

    (Array+, Iterator, List, Set, SortedSet, LruSet, SortedArray,
    SortedArraySet, FastSet)

    **iterate(start, end)**

    Returns an iterator for all values at indicies in the half-open
    interval [start, end), that is, greater than start, and less than
    end.

    (Array+)

    **iterate(start, end)**

    Returns an iterator for all values in the half-open interval [start,
    end), that is, greater than start, and less than end.  The iterator
    is resilient against changes to the data.

    (SortedSet)

-   **log(charmap, callback(node, write, writeAbove), log, logger)**

    Writes a tree describing the internal state of the data structure to
    the console.

    `charmap` is an object that notes which characters to use to draw
    lines.  By default, this is the `TreeLog.unicodeRound` property from the
    `tree-log` module.  `TreeLog.unicodeSharp` and `TreeLog.ascii` are
    alternatives.  The properties are:

    -   intersection: ╋
    -   through: ━
    -   branchUp: ┻
    -   branchDown: ┳
    -   fromBelow: ╭
    -   fromAbove: ╰
    -   fromBoth: ┣
    -   strafe: ┃

    `callback` is a customizable function for rendering each node of the tree.
    By default, it just writes the value of the node.  It accepts the node and
    a writer functions.  The `write` function produces the line on which the
    node joins the tree, and each subsequent line.  The `writeAbove` function
    can write lines before the branch.

    `log` and `loger` default to `console.log` and `console`.  To write
    the representation to an array instead, they can be `array.push` and
    `array`.

    (SortedSet)


### Iterator

-   **dropWhile(callback(value, index, iterator), thisp)**

-   **takeWhile(callback(value, index, iterator), thisp)**

-   **mapIterator(callback(value, index, iterator))**

    Returns an iterator for a mapping on the source values.  Values are
    consumed on demand.

-   **filterIterator(callback(value, index, iterator))**

    Returns an iterator for those values from the source that pass the
    given guard.  Values are consumed on demand.

-   **zipIterator(...iterables)**

    Returns an iterator that incrementally combines the respective
    values of the given iterations.

-   **enumerateIterator(start = 0)**

    Returns an iterator that provides [index, value] pairs from the
    source iteration.


### Iterator utilities

-   **cycle(iterable, times)**

-   **concat(iterables)**

-   **transpose(iterables)**

-   **zip(...iterables)**

    Variadic transpose.

-   **chain(...iterables)**

    Variadic concat.

-   **range(start, stop, step)**

    Iterates from start to stop by step.

-   **count(start, step)**

    Iterates from start by step, indefinitely.

-   **repeat(value, times)**

    Repeats the given value either finite times or indefinitely.


## Change Listeners

All collections support change listeners.  There are three types of
changes.  Property changes, map changes, and range changes.

### Property Changes

`PropertyChanges` from the `listen/property-changes` module can
configure listeners for property changes to specific keys of any object.

With the `listen/array-changes` module required, `PropertyChanges` can
also listen to changes to the length and indexed properties of an array.
The only caveat is that watched arrays can only modify their contents
with method calls like `array.push`.  All methods of a watched array
support change dispatch.  In addition, arrays have a `set` method to
make setting the value at a particular index observable.

-   PropertyChanges.addOwnPropertyChangeListener(object, key, listener, before)
-   PropertyChanges.removeOwnPropertyChangeListener(object, key, listener, before)
-   PropertyChanges.dispatchOwnPropertyChange(object, key, value, before)
-   PropertyChanges.addBeforeOwnPropertyChangeListener(object, key, listener)
-   PropertyChanges.removeBeforeOwnPropertyChangeListener(object, key, listener)
-   PropertyChanges.dispatchBeforeOwnPropertyChange(object, key, value)
-   PropertyChanges.getOwnPropertyChangeDescriptor(object, key)

All of these functions delegate to methods of the same name if one
exists on the object.

-   object.addOwnPropertyChangeListener(key, listener, before)
-   object.removeOwnPropertyChangeListener(key, listener, before)
-   object.dispatchOwnPropertyChange(key, value, before)
-   object.addBeforeOwnPropertyChangeListener(key, listener)
-   object.removeBeforeOwnPropertyChangeListener(key, listener)
-   object.dispatchBeforeOwnPropertyChange(key, value)
-   object.getOwnPropertyChangeDescriptor(key)

Additionally, `PropertyChanges.prototype` can be **mixed into** other
types of objects to support the property change dispatch interface.  All
collections support this interface.

The **listener** for a property change receives the arguments `value`,
`key`, and `object`, just as a `forEach` or `map` callback.  The
listener may alternately be a delegate object that implements one of
these methods:

-   listener.handle + **key** + Change **or** WillChange
-   listener.handleProperty + Change **or** WillChange
-   listener.call

### Map Changes

A map change listener receives notifications for the creation, removal,
or updates for any entry in a map data structure.

With the `listen/array-changes` module required, `Array` can also
dispatch map changes for the values at each index.

-   collection.addMapChangeListener(listener, token, before)
-   collection.removeMapChangeListener(listener, token, before)
-   collection.dispatchMapChange(key, value, before)
-   collection.addBeforeMapChangeListener(listener)
-   collection.removeBeforeMapChangeListener(listener)
-   collection.dispatchBeforeMapChange(key, value)
-   collection.getMapChangeDescriptor()

The **listener** for a map change receives the `value`, `key`, and
collection `object` as arguments, the same pattern as a `forEach` or
`map` callback.  In the after change phase, a value of `undefined` may
indicate that the value was deleted or set to `undefined`.  In the
before change phase, a value of `undefined` may indicate the the value
was added or was previously `undefined`.

The listener may be a delegate object with one of the following methods,
in order of precedence:

-   listener.handleMap + Change **or** WillChange
-   listener.handle + **token** + Map + Change **or** WillChange
-   listener.call

The `listen/map-changes` module exports a map changes **mixin**.  The
methods of `MaxChanges.prototype` can be copied to any collection that
needs this interface.  Its mutation methods will then need to dispatch
map changes.

### Range Changes

A range change listener receives notifications when a range of values at
a particular position is added, removed, or replaced within an ordered
collection.

-   collection.**add**RangeChange**Listener**(listener, token, before)
-   collection.**remove**RangeChange**Listener**(listener, token, before)
-   collection.**dispatch**RangeChange(plus, minus, index, before)
-   collection.add**Before**RangeChange**Listener**(listener)
-   collection.remove**Before**RangeChange**Listener**(listener)
-   collection.dispatch**Before**RangeChange(plus, minus, index)
-   collection.**get**RangeChange**Descriptor**()

The **listener** for a range change is a function that accepts `plus`,
`minus`, and `index` arguments.  `plus` and `minus` are the values that
were added or removed at the `index`.  Whatever operation caused these
changes is equivalent to:

```javascript
var minus = collection.splice(index, minus.length, ...plus)
```

The listener can alternately be a delegate object with one of the
following methods in order of precedence:

-   handle + **token** + Range + Change **or** WillChange
-   handleRange + Change **or** WillChange
-   call

The following support range change dispatch:

-   `Array` with `require("collections/listen/array-changes")`
-   `SortedSet`
-   `SortedArray`
-   `SortedArraySet`

The `listen/range-changes` module exports a range changes **mixin**.
The methods of `RangeChanges.prototype` can be copied to any collection
that needs this interface.  Its mutation methods will need to dispatch
the range changes.

All **descriptors** are objects with the properties `changeListeners`
and `willChangeListeners`.  Both are arrays of listener functions or
objects, in the order in which they were added.


## Miscellanea

### Set and Map

Set and map are like hash tables, but not implemented with a block of
memory as they would be in a lower-level language.  Most of the work of
providing fast insertion and lookup based on a hash is performed by the
underlying plain JavaScript object.  Each key of the object is a hash
string and each value is a List of values with that hash.  The inner
list resolves collisions.  With a good `hash` method, the use of the
list can be avoided.

Sets and maps both have a `log` function that displays the internal
structure of the bucket list in an NPM-style.

```
┣━┳ 1
┃ ┗━━ {"key":1,"value":"a"}
┣━┳ 2
┃ ┣━━ {"key":2,"value":"c"}
┃ ┗━━ {"key":2,"value":"d"}
┗━┳ 3
  ┗━━ {"key":3,"value":"b"}
```


### Sorted Set and Sorted Map

A binary splay tree is a balanced binary tree that rotates the most
frequently used entries toward the root such that they can be accessed the
most quickly.  `sorted-set` and `sorted-map` are backed by a splay tree.

All map implementations use an underlying set implementation.  Any map
can be implemented trivially atop a set by wrapping `compare`, `equals`,
or `hash` to operate on the key of an entry.

The sorted set has a `root` node.  Each node has a `left` and `right`
property, which may be null.  Nodes are returned by all of the "find"
functions, and provided as the `key` argument to callbacks.

Both `sorted-set` and `sorted-map` implement a `log` function which can
produce NPM-style visualizations of the internal state of the sorted
tree.

```
> set.log(SortedSet.ascii)
  .-+ -3
  | '-- -2
.-+ -1
+ 0
| .-- 1
'-+ 2
  '-- 3
```

```
> set.log(SortedSet.unicodeRound)
  ╭━┳ -3
  ┃ ╰━━ -2
╭━┻ -1
╋ 0
┃ ╭━┳ 1
┃ ┃ ╰━━ 2
╰━┻ 3
```


### Object and Function Shims

The collection methods on the `Object` constructor all polymorphically
delegate to the corresponding method of any object that implements the
method of the same name.  So, `Object.has` can be used to check whether
a key exists on an object, or in any collection that implements `has`.
This permits the `Object` interface to be agnostic of the input type.

`Array.from` creates an array from any iterable.

`Array.unzip` transposes a collection of arrays, so rows become columns.

`Array.empty` is an empty array, frozen if possible.  Do not modify it.

`Object.from` creates an object from any map or collection.  For arrays
and array-like collections, uses the index for the key.

`Object.empty` is an empty object literal.

`Object.isObject(value)` tests whether it is safe to attempt to access
properties of a given value.

`Object.is(x, y)` compares objects for exact identity and is a good
alternative to `Object.equals` in many collections.

`Object.getValueOf(value)` safely and idempotently returns the value of
an object or value by only calling the `valueOf()` if the value
implements that method.

`Object.owns` is a shorthand for `Object.prototype.hasOwnProperty.call`.

`Object.can(value, name)` checks whether an object implements a method
on its prototype chain.  An owned function property does not qualify as
a method, to aid in distinguishing "static" functions.

`Object.concat(...maps)` and `Object.from(entries)` construct an object
by adding the entries of other objects in order.  The maps can be other
objects, arrays of entries, or map alike collections.

`Function.noop` is returns undefined.

`Function.identity` returns its first argument.

`Function.by(relation)` creates a comparator from a relation function.

`Function.get(key)` creates a relation that returns the value for the
property of a given object.


### References

- a SplayTree impementation buried in Fedor Indutny’s super-secret
  [Callgrind](https://github.com/indutny/callgrind.js). This
  implementation uses parent references.
- a SplayTree implementation adapted by [Paolo
  Fragomeni](https://github.com/hij1nx/forest) from the V8 project and
  based on the top-down splaying algorithm from "Self-adjusting Binary
  Search Trees" by Sleator and Tarjan. This does not use or require
  parent references, so I favored it over Fedor Indutny’s style.
- the interface of ECMAScript harmony [simple maps and
  sets](http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets)
- a SplayTree implementation from [JavaScript data
  structures](derrickburns/Javascript-Data-Structures) mainted by
  Derrick Burns that supports change-resilient iterators and a
  comprehensive set of introspection functions.

### Future work

Goals

- automate the generation of the method support tables in readme and
  normalize declaration order
- comprehensive specs and spec coverage tests
- fast list splicing
- dict map changes
- revise map changes to use separate handlers for add/delete
- revise tokens for range and map changes to specify complete alternate
  delegate methods, particularly for forwarding directly to dispatch
- implement on/once/off listeners
- Make it easier to created a SortedSet with a criterion like
  Function.by(Function.get('name'))

More possible collections

- sorted-order (sorted, can contain duplicates, perhaps backed by splay
  tree with relaxation on the uniqueness invariant)
- sorted-multi-map (sorted, can contain duplicate entries, backed by
  sorted-map)
- trie-set
- trie-map
- immutable-* (mutation functions return new objects that largely share
  the previous version's internal state, some perhaps backed by a hash
  trie)

