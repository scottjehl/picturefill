/**
 * Vow-queue
 *
 * Copyright (c) 2013 Filatov Dmitry (dfilatov@yandex-team.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * @version 0.0.1
 */

var vow = require('vow'),
    extend = function() {
        var res = {};

        for(var i = 0, len = arguments.length; i < len; i++) {
            var obj = arguments[i];
            if(obj) {
                for(var key in obj) {
                    obj.hasOwnProperty(key) && (res[key] = obj[key]);
                }
            }
        }

        return res;
    },

    DEFAULT_QUEUE_PARAMS = {
        weightLimit : 100
    },
    DEFAULT_TASK_PARAMS = {
        weight   : 1,
        priority : 1
    },

    Queue = module.exports = function(params) {
        this._pendingTasks = [];
        this._params = extend(DEFAULT_QUEUE_PARAMS, params);
        this._curWeight = 0;
        this._isRunScheduled = false;
    };

Queue.prototype = {
    /**
     * Add task to queue
     * @param {Function} taskFn
     * @param {Object} [taskParams]
     * @param {Number} [taskParams.weight=1]
     * @param {Number} [taskParams.priority=1]
     * @return {vow.promise}
     */
    enqueue : function(taskFn, taskParams) {
        var task = {
                fn      : taskFn,
                params  : extend(DEFAULT_TASK_PARAMS, taskParams),
                promise : vow.promise()
            };

        if(task.params.weight > this._params.weightLimit) {
            throw Error('task with weight ' +
                task.params.weight +
                ' couldn\'t be executed in queue with weight limit of ' +
                this._params.weightLimit);
        }

        this._enqueueTask(task);
        this._scheduleRun();

        return task.promise;
    },

    /**
     * Set params of queue
     * @param {Object} params
     * @param {Number} [params.weightLimit]
     */
    params : function(params) {
        if(typeof params.weightLimit !== 'undefined') {
            this._params.weightLimit = params.weightLimit;
            this._scheduleRun();
        }
    },

    _enqueueTask : function(task) {
        var pendingTasks = this._pendingTasks,
            i = pendingTasks.length;

        while(i) {
            if(pendingTasks[i - 1].params.priority >= task.params.priority) {
                i === pendingTasks.length?
                    pendingTasks.push(task) :
                    pendingTasks.splice(i, 0, task);
                return;
            }
            i--;
        }

        pendingTasks.push(task);
    },

    _scheduleRun : function() {
        if(!this._isRunScheduled) {
            this._isRunScheduled = true;
            process.nextTick(this._run.bind(this));
        }
    },

    _run : function() {
        this._isRunScheduled = false;
        while(this._pendingTasks.length && this._allowRunTask(this._pendingTasks[0])) {
            this._runTask(this._pendingTasks.shift());
        }
    },

    _allowRunTask : function(task) {
        return this._curWeight + task.params.weight <= this._params.weightLimit;
    },

    _runTask : function(task) {
        this._curWeight += task.params.weight;

        var taskRes = vow.invoke(task.fn);
        taskRes.always(
            function() {
                this._curWeight -= task.params.weight;
                this._scheduleRun();
            },
            this);

        task.promise.sync(taskRes);
    }
};