/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2010-2012 Zynga Inc.
  Copyright 2012-2014 Sebastian Werner
  Copyright 2015      Sebastian Software GmbH
==================================================================================================
*/

(function() {
	"use strict";

	var matchesFactory = function() {
		var node = document.body;

		if (typeof node.matches == "function") {
			return function(element, selector) {
				return element.matches(selector);
			};
		} else if (typeof node.webkitMatchesSelector == "function") {
			return function(element, selector) {
				return element.webkitMatchesSelector(selector);
			};
		} else if (typeof node.msMatchesSelector == "function") {
			return function(element, selector) {
				return element.msMatchesSelector(selector);
			};
		} else if (typeof node.mozMatchesSelector == "function") {
			return function(element, selector) {
				return element.mozMatchesSelector(selector);
			};
		} else {
			return function(element, selector) {
				var matches = (element.document || element.ownerDocument).querySelectorAll(selector);
				var i = 0;

				while (matches[i] && matches[i] !== element) {
					i++;
				}

				return matches[i] ? true : false;
			};
		}
	};

	/**
	 * DOM utility methods
	 */
	core.Module("core.dom.Node",
	{
		/**
		 * Throws an exception when @node {var} is not a valid DOM node.
		 * The exception @message {String} can be customized via the parameter.
		 */
		assertIsNode: function(node, message)
		{
			if (typeof node != "object" || node.nodeType == null) {
				throw new Error(message || "Invalid DOM node: " + node);
			}
		},


		/**
		 * {Element} Finds the closest parent of @start {Element} which is
		 * successfully tested against the given @test {Function}.
		 */
		closest: function(start, test)
		{
			while (start && start.nodeType != 9)
			{
				if (test(start)) {
					return start;
				}

				start = start.parentNode;
			}
		},


		/**
		 * {Boolean} Returns whether the given @parent {Element} contains the
		 * given @child {Element}.
		 */
		contains: function(parent, child)
		{
			if (parent.nodeType == 9) {
				return child.ownerDocument === parent;
			} else if (parent.contains) {
				return parent.contains(child);
			} else if (parent.compareDocumentPosition) {
				return !!(parent.compareDocumentPosition(child) & 16);
			}

			while(target)
			{
				if (element == target) {
					return true;
				}

				target = target.parentNode;
			}

			return false;
		},

		/**
		 * {Boolean} Returns wether the given @selector {String} matches the given
		 * @element {Element}.
		 */
		matches: matchesFactory()
	});
})();
