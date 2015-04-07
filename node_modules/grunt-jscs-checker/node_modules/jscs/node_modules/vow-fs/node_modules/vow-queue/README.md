vow-queue
===============

Simple queue with weights and priorities

Installation
------------

Vow-queue can be installed using `npm`:

```
npm install vow-queue
```

Usage
-----

````javascript
var Queue = require('vow-queue'),
    queue = new Queue({ weightLimit : 10 });
    
queue.enqueue(function() { // simple function
    return 2 * 2;
});

queue.enqueue(function() { // function returns a promise
    // do job
    return promise;
});

queue.enqueue( // task with custom priority and weight
    function() {
        // do job
    },
    {
        priority : 3, // this task will be started before the previous two
        weight   : 5
    });
````
