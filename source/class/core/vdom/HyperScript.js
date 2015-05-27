(function() {
	"use strict";

	/* globals virtualDom, console, core */

	var SVG_NAMESPACE = "http://www.w3.org/2000/svg";

	var h = virtualDom ? virtualDom.h : function() { console.error("Dependency VirtualDom not loaded!"); };
	var svgAttributeNamespace = core.vdom.svg.SvgAttributeNamespace.getNamespace;

	function isChildren(x) {
		return core.Main.isTypeOf(x, "String") || core.Main.isTypeOf(x, "Array");
	}

	var svg = function(tagName, properties, children) {
		if (!children && isChildren(properties)) {
			children = properties;
			properties = {};
		}

		properties = properties || {};
		properties["className patcher for svg"] = new core.vdom.svg.ClassnameHook(properties.className);

		// set namespace for svg
		properties.namespace = SVG_NAMESPACE;

		var attributes = properties.attributes || (properties.attributes = {});

		for (var key in properties) {
			if (!properties.hasOwnProperty(key)) {
				continue;
			}

			var namespace = svgAttributeNamespace(key);

			if (namespace === undefined) { // not a svg attribute
				continue;
			}

			var value = properties[key];

			if (typeof value !== "string" &&
				typeof value !== "number" &&
				typeof value !== "boolean"
			) {
				continue;
			}

			if (namespace !== null) { // namespaced attribute
				properties[key] = new core.vdom.svg.NamespaceHook(namespace, value);
				continue;
			}

			attributes[key] = value;
			properties[key] = undefined;
		}

		var node = h(tagName, properties, children);
		node.svg = true;
		return node;
	};

	core.Module("core.vdom.HyperScript", {
		h: h,
		svg: svg
	});
})();