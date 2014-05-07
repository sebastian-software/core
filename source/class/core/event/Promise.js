/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2013-2014 Sebastian Fastner
==================================================================================================
*/

/**
 * Promises implementation of A+ specification passing Promises/A+ test suite.
 * http://promises-aplus.github.com/promises-spec/
 *
 * Based upon Native Promise Only
 * v0.0.1-a (c) Kyle Simpson
 * MIT License: http://getify.mit-license.org
 */


(function() {
	/*jshint validthis:true */
	"use strict";

	function schedule(fn) {
		return (typeof setImmediate !== "undefined") ?
			setImmediate(fn) : setTimeout(fn,0)
		;
	}

	// promise duck typing?
	function isThenable(o,shallow) {
		var _then;

		if (o !== null &&
			(
				typeof o === "object" || typeof o === "function"
			)
		) {
			if (shallow) {
				// shallow/weak check, so that we
				// don't fire a potential getter
				return ("then" in o);
			}
			_then = o.then;
			return isFunction(_then) ? _then : false;
		}
		return false;
	}

	function isFunction(fn) {
		return (typeof fn === "function");
	}

	function notify() {
		if (this.state === 0) {
			return;
		}

		var cb, ret, _then, _chained, queue;

		if (this.state === 1) {
			queue = this.success;
		}
		if (this.state === 2) {
			queue = this.failure;
		}

		while ((cb = queue.shift())) {
			_chained = this.chained.shift();
			try {
				ret = cb(this.msg);
				if (ret === _chained.promise) {
					throw new TypeError("Illegal promise chain cycle");
				}
				if ((_then = isThenable(ret))) {
					_then.call(ret,_chained.resolve,_chained.reject);
				}
				else {
					_chained.resolve(ret);
				}
			}
			catch (err) {
				_chained.reject(err);
			}
		}
	}

	function resolve(msg) {
		var _then, self, obj;

		if (this.def) {
			if (this.triggered) {
				return;
			}
			this.triggered = true;
			self = this.def;
		}
		else {
			self = this;
		}

		if (self.state !== 0) {
			return;
		}

		obj = {
			def: self,
			triggered: false
		};

		try {
			if ((_then = isThenable(msg))) {
				_then.call(msg,resolve.bind(obj),reject.bind(obj));
			}
			else {
				self.msg = msg;
				self.state = 1;
				schedule(notify.bind(self));
			}
		}
		catch (err) {
			reject.call(obj,err);
		}
	}

	function fulfill(msg) {
		resolve(msg);
	}

	function publicResolve(msg) {
		if (this.triggered) {
			return;
		}
		this.triggered = true;

		resolve.call(this,msg);
	}

	function reject(msg) {
		var self;

		if (this.def) {
			if (this.triggered) {
				return;
			}
			this.triggered = true;
			self = this.def;
		}
		else {
			self = this;
		}

		if (self.state !== 0) {
			return;
		}

		self.msg = msg;
		self.state = 2;
		schedule(notify.bind(self));
	}

	function publicReject(msg) {
		if (this.triggered) {
			return;
		}
		this.triggered = true;

		reject.call(this,msg);
	}

	function then(success,failure) {
		this.success.push(isFunction(success) ? success : function __default_success__(m){ return m; });
		this.failure.push(isFunction(failure) ? failure : function __default_failure__(m){ throw m; });

		var p = new Promise(function __Promise__(resolve,reject){
			this.chained.push({
				resolve: resolve,
				reject: reject
			});
		}.bind(this));
		this.chained[this.chained.length-1].promise = p;

		schedule(notify.bind(this));

		return p;
	}

	function __catch(failure) {
		return this.promise.then(void 0,failure);
	}

	function Promise(cb) {
		var def = {
			promise: this,
			state: 0,
			triggered: false,
			success: [],
			failure: [],
			chained: []
		};
		this.then = function(success, failure, context) {
			if (context) {
				if (success && typeof success == "function") {
					success = success.bind(context);
				}
				if (failure && typeof failure == "function") {
					failure = failure.bind(context);
				}
			}

			return then.call(def, success,failure);
		};
		this["catch"] = __catch.bind(def);

		try {
			var resolve = publicResolve.bind(def);
			var reject = publicReject.bind(def);

			this.fulfill = resolve;
			this.reject = reject;
			var self = this;
			this.done = function() {
				return this.then(null, function(reason) {
					if (jasy.Env.isSet("debug"))
					{
						console.error("Promise rejected: ", reason);
					}

					throw reason;
				}, null, false);
			};

			cb && cb(resolve, reject);
		}
		catch (err) {
			reject.call(def,err);
		}
	}

	core.Main.declareNamespace("core.event.Promise", Promise);

})();
