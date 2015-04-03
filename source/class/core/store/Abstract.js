/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2013-2014 Sebastian Fastner
==================================================================================================
*/

(function() {
	/* jshint unused:false */

	"use strict";


	/**
	 * Maps store action to event fired before action is triggered
	 */
	var ActionEventStartMapper = {
		'index' : 'indexing',
		'get' : 'getting',
		'create' : 'creating',
		'replace' : 'replacing',
		'update' : 'updating',
		'destroy' : 'destroying'
	};

	/**
	 * Maps store action to event fired after action is done
	 */
	var ActionEventEndMapper = {
		'index' : 'indexed',
		'get' : 'got',
		'create' : 'created',
		'replace' : 'replaced',
		'update' : 'updated',
		'destroy' : 'destroyed'
	};

	/**
	 * A store is pretty much a combination of the adapter pattern (convert data
	 * betweeen storage/server and client) and a asynchronous storage API with
	 * activity reporting.
	 */
	core.Class("core.store.Abstract",
	{
		include: [core.property.MGeneric, core.event.MEventTarget, core.util.MLogging],

		construct : function() {
			this.__queue = [];
			this.__tracker = {
				index: 0,
				get: 0,
				create: 0,
				replace: 0,
				update: 0,
				destroy: 0
			};
		},

		events : {
			/**
			 * Fired whenever the activity state was changed
			 * (Please note that every single change produces a new event -
			 * even if the storage is still active e.g. when the second request is send out.)
			 */
			change : core.event.Simple,

			/** Fired when the process of loading index of something was started. */
			indexing : core.store.Event,
			/** Fired when the process of loading index of something was completed. */
			indexed : core.store.Event,

			/** Fired when the process of getting something was started. */
			getting : core.store.Event,
			/** Fired when the process of getting something was completed. */
			got : core.store.Event,

			/** Fired when the process of creating something was started. */
			creating : core.store.Event,
			/** Fired when the process of creating something was completed. */
			created : core.store.Event,

			/** Fired when the process of replacing something was started. */
			replacing : core.store.Event,
			/** Fired when the process of replacing something was completed. */
			replaced : core.store.Event,

			/** Fired when the process of updating something was started. */
			updating : core.store.Event,
			/** Fired when the process of updating something was completed. */
			updated : core.store.Event,

			/** Fired when the process of destroying something was started. */
			destroying : core.store.Event,
			/** Fired when the process of destroying something was completed. */
			destroyed : core.store.Event
		},

		members: {
			/** {Array} Queue of operations on store. */
			__queue : null,
			/** {Object} Tracker of operations in progress on store. */
			__tracker : null,
			/** {Boolean} Mutex on flush to prevent calling it more than once in a time. */
			__flushMutex : false,

			/**
			 * Schedule new acitivty with @action {String}, @key {var}
			 * and @data {var?null} in operations queue.
			 */
			__scheduleActivity : function(action, key, data) {
				var tracker = this.__tracker;
				var queue = this.__queue;
				var promise = new core.event.Promise(function(resolve, reject) {
					queue.push({
						action: action,
						key: key,
						data: this._encode(data, action),
						promise: {
							resolve: resolve,
							reject: reject
						},
						value: null,
						error: null
					});
				});

				tracker[action]++;


				this.fireEvent("change");

				// Run flush in next javascript cycle
				if (!this.__flushMutex) {
					this.__flushMutex = true;
					core.Function.immediate(this.__flush, this);
				}

				return promise.then(function(value) {
					value = this._decode(value, action);
					tracker[action]--;
					this.__fireStorageEvent(action, true, key, value);
					return value;
				}, function(reason) {
					tracker[action]--;
					this.__fireStorageEvent(action, false, key);
					this.warn("Storage request '" + action + "' failed! ", reason.error ? reason.error : reason);
					throw reason;
				}, this);
			},

			/**
			 * Flush operations queue and execute tasks in right order
			 */
			__flush : function() {
				var task = this.__queue.shift();
				if (task) {
					var action = task.action;
					var promise = task.promise;

					this.__fireStorageEvent(ActionEventStartMapper[action], true, task);

					var promise2 = core.event.Promise.resolve();
					promise2.then(function() {
						return this._communicate(task.action, task.key, task.data);
					}, null, this).then(function(value) {
						task.value = value;
						task.error = null;
						promise.resolve(task);
						this.__fireStorageEvent(ActionEventEndMapper[action], true, task);
						this.__flush();
					}, function(reason) {
						task.value = null;
						task.error = reason;
						promise.reject(task);
						this.__fireStorageEvent(ActionEventEndMapper[action], false, task);
						this.__flush();
					}, this).done();
					
				} else {
					this.__flushMutex = false;
				}
			},


			/*
			======================================================
				EVENT HANDLING
			======================================================
			*/

			/**
			 * {Boolean} Shorthand for firing automatically pooled instances of {core.store.Event}
			 * with the given @type {String}, @success {Boolean}, @key {var} and @value {var}.
			 * The method returns whether any listers were processed.
			 */
			__fireStorageEvent : function(type, success, key, value)
			{
				var evt = core.store.Event.obtain(type, success, key, value);
				var retval = this.dispatchEvent(evt);
				evt.release();

				return retval;
			},



			/*
			======================================================
				PUBLIC API
			======================================================
			*/

			/**
			 * {core.event.Promise} Returns list of available resources located at @key {var}.
			 */
			index : function(key) {
				return this.__scheduleActivity("index", key);
			},

			/**
			 * {core.event.Promise} Returns single item located at @key {var}.
			 */
			get : function(key) {
				return this.__scheduleActivity("get", key);
			},

			/**
			 * {core.event.Promise} Creates item with values @data {Object} at location @key {var}.
			 */
			create : function(key, data) {
				return this.__scheduleActivity("create", key, data);
			},

			/**
			 * {core.event.Promise} Replace item at location @key {var} with values @data {Object}.
			 * This replaces the whole item.
			 */
			replace : function(key, data) {
				return this.__scheduleActivity("replace", key, data);
			},

			/**
			 * {core.event.Promise} Update item at location @key {var} with values @data {Object}.
			 * This updates item only with values defined in data.
			 */
			update : function(key, data) {
				return this.__scheduleActivity("update", key, data);
			},

			/**
			 * {core.event.Promise} Destroyes item located at @key {var}.
			 */
			destroy : function(key) {
				return this.__scheduleActivity("destroy", key);
			},

			/*
			======================================================
				ABSTRACT METHOD/STUBS
			======================================================
			*/

			/**
			 * {core.event.Promise} Communicates data changes to the underlying storage using
			 * the given @action {String} on the given optional @key {var?null}
			 * with the given optional @data {var?}.
			 */
			_communicate : function(action, key, data) {
				throw new Error("_communicate(action, key, data) is abstract!");
			},


			/**
			 * Applying correction on outgoing @data {var}, typically the model/collection
			 * for the given @action {String}.
			 */
			_encode : function(data, action) {
				return data;
			},


			/**
			 * Applying correction on incoming @data {var} as the result of
			 * the given @action {String}.
			 */
			_decode : function(data, action) {
				return data;
			},
		}
	});

})();