/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2010-2012 Zynga Inc.
  Copyright 2012-2014 Sebastian Werner
--------------------------------------------------------------------------------------------------
  Based on the work of:
  Hogan.JS by Twitter, Inc.
  https://github.com/twitter/hogan.js
  Licensed under the Apache License, Version 2.0
  http://www.apache.org/licenses/LICENSE-2.0
==================================================================================================
*/

"use strict";

(function ()
{
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var undef;

	var htmlChars = /[&<>\"\']/g;
	var htmlMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		"'": '&#39;',
		'"': '&quot;'
	};
	var htmlEscape = function(str) {
		return htmlMap[str];
	};

	var getter = function(key, obj)
	{
		if (obj != null)
		{
			var camelized = core.String.camelize(key);

			if (obj.constructor === Object)
			{
				if (hasOwnProperty.call(obj, camelized)) {
					return obj[camelized];
				}
			}
			else if (typeof obj.get == "function")
			{
				var value = obj.get(camelized);
				if (value != null) {
					return value;
				}
			}
			else if (jasy.Env.isSet("debug"))
			{
				console.warn("Could not read " + key + " from object " + obj + "! Missing generic get(property) method!");
      }
		}
	};

	var accessor =
	{
		2: function(key, data)
		{
			if (data != null) {
				return data;
			}
		},

		1: function(key, data)
		{
			var splits = key.split(".");
			for (var i=0, l=splits.length; i<l; i++)
			{
				data = getter(splits[i], data);
				if (data == null) {
					return;
				}
			}

			return data;
		},

		0: getter
	};


	/**
	 * This is the template class which is typically initialized and configured using the {core.template.Compiler#compile} method.
	 */
	core.Class("core.template.Template",
	{
		include : [ core.util.MLogging ],

		/**
		 * Creates a template instance with the given @render {Function} method. Best way to work with
		 * the template class is to create one using the {core.template.Compiler#compile} method.
		 */
		construct: function(render, text, name)
		{
			if (jasy.Env.isSet("debug"))
			{
				core.Assert.isType(render, "Function", "Missing valid render method!");

				if (name != null) {
					core.Assert.isType(name, "String", "Invalid template name!");
				}
			}

			this.__render = render;
			this.__text = text;
			this.__name = name;
		},

		members:
		{
			__name : null,
			__text : null,
			__render : null,


			/**
			 * {String} Public render method which transforms the stored template text using the @data {Map},
			 * runtime specific @partials {Map?null} and @labels {Map?null}.
			 */
			render: function(data, partials, labels, commands)
			{
				if (jasy.Env.isSet("debug"))
				{
					if (!(core.Main.isTypeOf(data, "Object") || core.Main.isTypeOf(data, "Array"))) {
						throw new Error("Data needs to be type of Object, Map or Array: " + data);
					}

					if (arguments.length > 1 && partials != null) {
						core.Assert.isType(partials, "Map", "Invalid partials");
					}

					if (arguments.length > 2 && labels != null) {
						core.Assert.isType(labels, "Map", "Invalid labels");
					}
				}

				if (jasy.Env.isSet("debug"))
				{
					try
					{
						return this.__render(data, partials, labels, commands);
					}
					catch(ex)
					{
						this.error("Unable to render template " + (this.__name||""));
						throw ex;
					}
				}
				else
				{
					return this.__render(data, partials, labels, commands);
				}
			},


			/**
			 * {String} Outputs the @key {String} of @data {Map}
			 * using the given accessor @method {Integer} as HTML escaped variable.
			 */
			_variable: function(key, method, data)
			{
				var value = accessor[method](key, data);
				var str = value == null ? "" : "" + value;

				return str.replace(htmlChars, htmlEscape);
			},


			/**
			 * {String} Outputs the @key {String} of @data {Map}
			 * using the given accessor @method {Integer} as raw data.
			 */
			_data : function(key, method, data)
			{
				var value = accessor[method](key, data);
				return value == null ? "" : "" + value;
			},


			/**
			 * {String} Tries to find a partial in the current scope and render it
			 */
			_partial: function(name, data, partials, labels, commands)
			{
				if (partials && hasOwnProperty.call(partials, name))
				{
					return partials[name].__render(data, partials, labels, commands);
				}
				else
				{
					if (jasy.Env.isSet("debug")) {
						this.warn("Could not find partial: " + name);
					}

					return "";
				}
			},


			/**
			 * {String} Tries to find a dynamic label by its @name {String} and renders
			 * the resulting label text like a partial template with the current
			 * @data {var}, defined @partials {Map} and other @labels {Map}.
			 *
			 * #break(core.template.Compiler)
			 */
			_label: function(name, data, partials, labels, commands)
			{
				var text = labels && labels[name];
				if (text == null) {
					return "";
				}

				// Automatically execute dynamic labels e.g. trn() with plural strings
				if (typeof text == "function") {
					text = text();
				}

				var compiledLabel = core.template.Compiler.compile(text);
				return compiledLabel.__render(data, partials, labels, commands);
			},


			/**
			 * Renders a section using the given @data {var}, user
			 * defined @partials {Map} and @labels {Map} and a @section {Function} specific renderer.
			 */
			_section: function(key, method, data, partials, labels, section, commands)
			{
				var value = accessor[method](key, data);
				if (value !== undef)
				{
					// Auto cast
					if (value.toArray) {
						value = value.toArray();
					}

					if (value instanceof Array)
					{
						var a = [];
						for (var i=0, l=value.length; i<l; i++) {
							a.push(section.call(this, value[i], partials, labels, commands));
						}
						return a;
					}
					else
					{
						return section.call(this, value, partials, labels, commands);
					}
				}
			},


			/**
			 * Renders a command using the given @data {var}, user
			 * defined @partials {Map} and @labels {Map} and a @section {Function} specific renderer.
			 */
			_command: function(command, innerFnt, parameter, data, partials, labels, commands)
			{
				if (jasy.Env.isSet("debug"))
				{
					core.Assert.isType(commands, "Object", "Commands must be type of Object");
					core.Assert.isNotNull(commands[command], "Command '" + command + "' not defined!");
				}

				return commands[command](parameter)(this, innerFnt, parameter, data, partials, labels, commands);
			},


			/**
			 * {Boolean} Whether the given @key {String} has valid content inside @data {Map}
			 * using the given accessor @method {Integer}.
			 */
			_has: function(key, method, data)
			{
				var value = accessor[method](key, data);
				if (value instanceof Array) {
					return value.length > 0;
				} else if (value != null && value.isEmpty) {
					return !value.isEmpty();
				} else {
					return !!value
				}
			}
		}
	});

})();
