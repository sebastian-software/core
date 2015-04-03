/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2013-2014 Sebastian Werner
  Copyright 2013-2014 Sebastian Fastner
==================================================================================================
*/

(function(slice)
{
  "use strict";

  /**
   *
   *
   */
  var identity = function(x) {
    return x;
  };


  /**
   *
   *
   */
  var map = function(promisesOrValues, mapFunction, context)
  {
    if (jasy.Env.isSet("debug"))
    {
      core.Assert.isType(mapFunction, "Function", "Flow control map() requires second parameter to be an mapping function!");

      if (context != null) {
        core.Assert.isType(context, "Object", "Flow control map() requires third parameter to be an context objext for the mapping function!");
      }
    }

    context = context || this;

    if (promisesOrValues && promisesOrValues.then && typeof promisesOrValues.then == "function")
    {

      return promisesOrValues.then(function(value) {
        return map(value, mapFunction, context);
      }, null, context);

    }
    else if (core.Main.isTypeOf(promisesOrValues, "Array"))
    {
      var promise = new core.event.Promise;

      var resolved = 0;
      var len = promisesOrValues.length;
      var result = [];
      var resultLength = 0;

      var valueCallback = function(pos) {
        return function(value)
        {
          result[pos] = value;
          resultLength++;

          if (resultLength == len) {
            promise.fulfill(result);
          }
        };
      };

      for (var i=0; i<len; i++)
      {
        var value = map(promisesOrValues[i], mapFunction, context);

        if (value && value.then)
        {
          value.then(valueCallback(i), function(reason) {
            promise.reject(reason);
          });
        }
        else
        {
          valueCallback(i)(value);
        }
      }

      return promise;
    }
    else
    {
      return mapFunction.call(context, promisesOrValues);
    }
  };


  /**
   *
   *
   *
   */
  var promisify = function(func, context, args)
  {
    var error;

    try
    {
      var result = func.apply(context || this, args);

      if ((result == null) || (!result.then))
      {
        var promise = new core.event.Promise;
        promise.fulfill(result);
        return promise;
      }
      else
      {
        return result;
      }
    }
    catch (e)
    {
      var promise = new core.event.Promise;
      promise.reject(e);
      return promise;
    }
  };


  /**
   *
   *
   */
  var promisifyGenerator = function(task, context, args, takeValue)
  {
    if (takeValue)
    {
      return function(value) {
        return promisify(task, context, [value]);
      };
    }
    else
    {
      return function(value) {
        return promisify(task, context, args);
      };
    }
  };


  /**
   * Advanced flow control methods for promises
   *
   */
  core.Module("core.event.Flow",
  {
    /**
     * Initiates a competitive race that allows one winner, returning a promise that will
     * resolve when any one of the items in array resolves. The returned promise will
     * only reject if all items in array are rejected. The resolution value of the returned
     * promise will be the fulfillment value of the winning promise. The rejection value will be
     * an array of all rejection reasons.
     */
    any : function(promisesOrValues)
    {
      if (jasy.Env.isSet("debug")) {
        core.Assert.isType(promisesOrValues, "ArrayOrPromise");
      }

      var promise = new core.event.Promise;
      var reasons = [];
      var promisesLength = promisesOrValues.length;

      for (var i=0, l=promisesLength; i<l; i++)
      {
        var value = promisesOrValues[i];

        if (value && value.then)
        {
          value.then(function(value)
          {
            if (promisesLength > 0)
            {
              promise.fulfill(value);
              promisesLength = -1;
            }
          },
          function(reason)
          {
            if (promisesLength > 0)
            {
              reasons.push(reason);
              promisesLength--;

              if (promisesLength == 0) {
                promise.reject(reasons);
              }
            }
          });
        }
        else
        {
          if (promisesLength > 0)
          {
            promise.fulfill(value);
            promisesLength = -1;
          }
        }
      }

      return promise;
    },


    /**
     * {core.event.Promise} Return a promise that will resolve only once all the inputs have resolved.
     * The resolution value of the returned promise will be an array containing the
     * resolution values of each of the inputs.
     *
     * If any of the input promises is rejected, the returned promise will be
     * rejected with the reason from the first one that is rejected.
     */
    all : function(promisesOrValues, context)
    {
      if (jasy.Env.isSet("debug")) {
        core.Assert.isType(promisesOrValues, "ArrayOrPromise");
      }

      return map(promisesOrValues, identity, context);
    },


    /**
     * {Promise} Calls all functions of @tasks {Array} in @context {var} with following arguments
     * @args in sequence.
     *
     * That means they do not overlap in time. Returns a promise that resolves to an array of the
     * returning values of task. All task can return a promise or a value.
     *
     * If one returning promise is rejected or an error is thrown the returning promise is rejected.
     */
    sequence : function(tasks, context, arg1)
    {
      if (jasy.Env.isSet("debug"))
      {
        core.Assert.isType(tasks, "Array");

        if (context != null) {
          core.Assert.isType(context, "Object");
        }
      }

      var args = slice.call(arguments, 2);
      var promise = new core.event.Promise;
      var result = [];

      var prom;

      for (var i=0, l=tasks.length; i<l; i++)
      {
        if (!prom)
        {
          prom = promisify(tasks[i], context, args);
        }
        else
        {
          prom = prom.then(function(value) {
            result.push(value);
          },
          function(reason) {
            promise.reject(reason);
          }).then(promisifyGenerator(tasks[i], context, args));
        }
      }

      prom.then(function(value)
      {
        result.push(value);
        promise.fulfill(result);
      },
      function(reason) {
        promise.reject(reason);
      });

      return promise;
    },


    /**
     * {Promise} Calls all functions of @tasks {Array} in @context {var}. First function gets
     * arguments @args. All other functions gets returning value of function as argument. All
     * functions called in sequence. That means they do not overlap in time. Returns promise
     * of value of last function. All task can return a promise or a value.
     *
     * If one returning promise is rejected or an error is thrown the returning promise is rejected.
     */
    pipeline : function(tasks, context, arg1)
    {
      if (jasy.Env.isSet("debug"))
      {
        core.Assert.isType(tasks, "Array");

        if (context != null) {
          core.Assert.isType(context, "Object");
        }
      }

      var args = slice.call(arguments, 2);
      var promise = promisify(tasks[0], context, args);

      for (var i=1, l=tasks.length; i<l; i++) {
        promise = promise.then(promisifyGenerator(tasks[i], context, null, true));
      }

      return promise;
    }
  });

})(Array.prototype.slice);
