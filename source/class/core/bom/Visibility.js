/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2015 Sebastian Werner
==================================================================================================
*/

"use strict";

/**
 * Utilities to work with HTML elements visibility
 */
core.Module("core.bom.Visibility",
{
  /**
   *
   */
  hide : function(elem) {
    elem.setAttribute("hidden", true);
  },

  /**
   *
   */
  show : function(elem) {
    elem.removeAttribute("hidden");
  },

  /**
   *
   */
  isHidden : function(elem) {
    return elem.hidden || !elem.offsetWidth || !elem.offsetHeight;
  },

  /**
   *
   */
  isVisible : function(elem) {
    return !this.isHidden(elem);
  }
});
