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

      if (context !== undefined) {
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
      return new core.event.Promise(function(resolve, reject) {
        //var resolved = 0;
        var len = promisesOrValues.length;
        var result = [];
        var resultLength = 0;

        var valueCallback = function(pos) {
          return function(value)
          {
            result[pos] = value;
            resultLength++;

            if (resultLength == len) {
              resolve(result);
            }
          };
        };

        for (var i=0; i<len; i++)
        {
          var value = map(promisesOrValues[i], mapFunction, context);

          if (value && value.then)
          {
            value.then(valueCallback(i), reject);
          }
          else
          {
            valueCallback(i)(value);
          }
        }
      });
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
        return new core.event.Promise(function(resolve){
          resolve(result);
        });
      }
      else
      {
        return result;
      }
    }
    catch (e)
    {
      return new core.event.Promise(function(resolve, reject) {
        reject(e);
      });
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

      return new core.event.Promise(function(resolve, reject) {
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
                resolve(value);
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
                  reject(reason);
                }
              }
            });
          }
          else
          {
            if (promisesLength > 0)
            {
              resolve(value);
              promisesLength = -1;
            }
          }
        }
      });
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
     * {core.event.Promise} Return a promise that will resolve only once all the
     * inputs from @hashmap {Map} have resolved.
     * The resolution value of the returned promise will be an map containing the
     * resolution values of each of the inputs with their corresponding keys.
     *
     * If any of the input promises is rejected, the returned promise will be
     * rejected with the reason from the first one that is rejected.
     */
    hash : function(hashmap, context)
    {
      if (jasy.Env.isSet("debug")) {
        core.Assert.isType(hashmap, "Object");
      }

      var keylist = core.Object.getKeys(hashmap);
      var valuelist = new Array(keylist.length);
      for (var i=0,ii=keylist.length; i<ii; i++) {
        valuelist[i] = hashmap[keylist[i]];
      }
      var promise = map(valuelist, identity, context);

      return promise.then(function(result) {
        var retValue = {};
        for (var i=0,ii=keylist.length; i<ii; i++) {
          retValue[keylist[i]] = result[i];
        }
        return retValue;
      });
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
      var promise = new core.event.Promise(function(resolve, reject) {
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
              reject(reason);
            }).then(promisifyGenerator(tasks[i], context, args));
          }
        }

        prom.then(function(value)
        {
          result.push(value);
          fulfill(result);
        },
        function(reason) {
          reject(reason);
        });
      }.bind(this));

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
