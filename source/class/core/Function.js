/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2012-2014 Sebastian Werner
==================================================================================================
*/

"use strict";

(function(global, slice)
{
  var bind = function(func, context)
  {
    // Inspired by: http://webreflection.blogspot.de/2012/11/my-name-is-bound-method-bound.html

    if (jasy.Env.isSet("debug"))
    {
      core.Assert.isType(func, "Function");
      core.Assert.isType(context, "Object");
    }

    // Using name which is not common to store these references in their objects
    // Storing it on the object has the benefit that when the object is
    // garbage collected its bound methods are gone as well.
    var boundName = "bound:" + core.util.Id.get(func);

    return context[boundName] || (
      context[boundName] = func.bind(context)
    );
  };

  var createDelayed = function(nativeMethod)
  {
    return function(callback, context, delay)
    {
      if (jasy.Env.isSet("debug"))
      {
        core.Assert.isType(callback, "Function");
        if (context) {
          core.Assert.isType(context, "Object");
        }
        core.Assert.isType(delay, "Integer");
      }

      if (arguments.length > 3)
      {
        if (!context) {
          context = global;
        }

        var callbackArgs = slice.call(arguments, 3);

        return nativeMethod(function() {
          callback.apply(context, callbackArgs);
        }, delay);
      }
      else
      {
        if (context) {
          callback = bind(callback, context);
        }

        return nativeMethod(callback, delay);
      }
    };
  };

  var immediate;

  // Keep in mind IE10 bugs:
  // http://codeforhire.com/2013/09/21/setimmediate-and-messagechannel-broken-on-internet-explorer-10/

  // Try NodeJS style nextTick() API
  // http://howtonode.org/understanding-process-next-tick
  if (global.process && process.nextTick)
  {
    immediate = process.nextTick;
  }
  else
  {
    // Try experimental setImmediate() API
    // https://developer.mozilla.org/en-US/docs/DOM/window.setImmediate
    immediate = core.util.Experimental.get(global, "setImmediate");

    if (immediate)
    {
      immediate = global[immediate];
    }
    else
    {
      // Last fallback: Timeout
      immediate = function(func) {
        return setTimeout(func, 0);
      };
    }
  }

  /**
   * {Integer} Maximum arguments that could be given to Function.apply
   * 2048 is a safe value for all browsers.
   */

  var APPLY_LIMIT = 2048;

  /**
   * A collection of utility methods for native JavaScript functions.
   */
  core.Module("core.Function",
  {
    /**
     * {Function} Binds the given function @func {Function} to the given @object {Object} and returns
     * the resulting function.
     *
     * - Only one connection is made to allow proper disconnecting without access to the bound function.
     * - Uses ES5 bind() to connect functions to objects internally.
     *
     * Because bound functions are cached on the objects this approach is only useful for longer
     * living methods like class or module methods and not a recommended approach for binding
     * short living or temporary methods like the ones declared inside closures. Otherwise
     * the cache would increase in size during application runtime.
     */
    bind : bind,


    /**
     * {Number} Executes the given @callback {Function} in the given @context {Object?global}
     * after a timeout of @delay {Number} milliseconds. Supports optional
     * @args {arguments...} which are passed to the @callback.
     */
    timeout : createDelayed(setTimeout),


    /**
     * {Number} Executes the given @callback {Function} in the given @context {Object?global}
     * every interval of @delay {Number} milliseconds. Supports optional
     * @args {arguments...} which are passed to the @callback.
     */
    interval : createDelayed(setInterval),


    /**
     * {Function} Debounces the given method.
     *
     * Debouncing ensures that exactly one signal is sent for an event that may be happening
     * several times — or even several hundreds of times over an extended period. As long as
     * the events are occurring fast enough to happen at least once in every detection
     * period, the signal will not be sent!
     *
     * - @threshold {Integer?100} Number of milliseconds of distance required before reacting/resetting.
     * - @execAsap {Boolean?false} Whether the execution should happen at begin.
     */
    debounce : function(func, threshold, execAsap)
    {
      if (jasy.Env.isSet("debug"))
      {
        core.Assert.isType(func, "Function");

        if (threshold != null) {
          core.Assert.isType(threshold, "Integer");
        }

        if (execAsap != null) {
          core.Assert.isType(execAsap, "Boolean");
        }
      }

      // Via: http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
      var timeout;

      return function()
      {
        var obj = this, args = arguments;
        function delayed()
        {
          if (!execAsap) {
            func.apply(obj, args);
          }

          timeout = null;
        }

        if (timeout){
          clearTimeout(timeout);
        } else if (execAsap) {
          func.apply(obj, args);
        }

        timeout = setTimeout(delayed, threshold || 100);
      };
    },


    /**
     * {Function} Returns a new function that when called multiple times will only call the
     * original function after the specificed @time {Integer} in milliseconds has elapsed.
     */
    throttle : function(func, time)
    {
      if (jasy.Env.isSet("debug"))
      {
        core.Assert.isType(func, "Function");
        core.Assert.isType(time, "Integer");
      }

      var lastEventTimestamp = null;
      var limit = time;

      return function()
      {
        var self = this;
        var args = arguments;
        var now = Date.now();

        if (!lastEventTimestamp || now - lastEventTimestamp >= limit)
        {
          lastEventTimestamp = now;
          func.apply(self, args);
        }
      };
    },


    /**
     * Executes the given @func {Function} immediately, but not in the current
     * thread (non-blocking). Optionally is able to call the method in the given
     * @context {Object?}.
     */
    immediate : function(func, context)
    {
      if (jasy.Env.isSet("debug"))
      {
        core.Assert.isType(func, "Function");

        if (context != null) {
          core.Assert.isType(context, "Object");
        }
      }

      if (context) {
        func = bind(func, context);
      }

      immediate(func);
    },


    /**
     * Executes the wrapped @func {Function} only once. After the first call
     * the result method does not do anything. Optional supports to bind a
     * @context {Object} for execution.
     */
    once : function(func, context)
    {
      return function()
      {
        if (!func) {
          return;
        }

        return func.apply(context || this, arguments);

        // Set to null to allow garbage collection
        func = null;
      };
    },


    /**
     * {Function} Returns a new function that curries all given arguments to the given @func {Function}.
     */
    curry : function(func)
    {
      if (jasy.Env.isSet("debug"))
      {
        core.Assert.isType(func, "Function");
      }

      var args = core.Array.fromArguments(arguments);
      args.splice(0, 1);
      return function() {
        return func.apply(this, args.concat(core.Array.fromArguments(arguments)));
      };
    },

    /**
     * Applies the given @args {Array} via func.apply to the given @func {Function}
     * in @context {Object}.
     * infiniteApply devides the arguments list to a reasonable size and applies each
     * chunk to the fiven function. After that @joinFunc {Function} is called with the
     * result as array. This function should join all results to the appropriate result
     * and return it.
     */
    infiniteApply : function(func, args, joinFunc, context)
    {
      if (jasy.Env.isSet("debug")) {
        core.Assert.isType(func, "Function");
        core.Assert.isType(args, "Array");
        core.Assert.isType(joinFunc, "Function");
      }

      var argsLength = args.length;
      if (argsLength <= APPLY_LIMIT) {
        return func.apply(context, args);
      }

      var turns = Math.ceil(argsLength / APPLY_LIMIT)
      var result = new Array(turns);
      for (var i=0; i<turns; i++) {
        var start = i * APPLY_LIMIT;
        result[i] = func.apply(context, args.slice(start, start + APPLY_LIMIT));
      }
      return joinFunc(result);
    }
  });
})(core.Main.getGlobal(), Array.prototype.slice);
