"use strict";
/* globals core */

core.Class("core.vdom.svg.ClassnameHook", {
	construct: function(classNames) {
		this.__classNames = classNames.split(/\s+/);
	},

	members: {
		type: "AttributeHook",
		hook: function (node) {
			core.Array.forEach(this.__classNames, function(className) {
				core.bom.ClassName.add(node, className);
			});
		},

		unhook: function (node) {
			core.Array.forEach(this.__classNames, function(className) {
				core.bom.ClassName.remove(node, className);
			});
		}
	}
});