"use strict";
/* globals core */

core.Class("core.vdom.svg.NamespaceHook", {
	construct: function(namespace, value) {
		this.namespace = namespace;
		this.value = value;
	},

	members: {
		type: "AttributeHook",
		hook: function (node, prop, prev) {
			if (prev && prev.type === "AttributeHook" &&
				prev.value === this.value &&
				prev.namespace === this.namespace) {
				return;
			}

			node.setAttributeNS(this.namespace, prop, this.value);
		},

		unhook: function (node, prop, next) {
			if (next && next.type === "AttributeHook" &&
				next.namespace === this.namespace) {
				return;
			}

			var colonPosition = prop.indexOf(":");
			var localName = colonPosition > -1 ? prop.substr(colonPosition + 1) : prop;
			node.removeAttributeNS(this.namespace, localName);
		}
	}
});