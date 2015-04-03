/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2012-2014 Sebastian Werner
==================================================================================================
*/

"use strict";

/**
 * Base class for a DOM based view. Uses debounced rendering using RequestAnimationFrame
 * for optimal performance. Supports easy DOM event managment for view content.
 */
core.Class("core.view.Dom",
{
  include : [core.view.Abstract],
  implement : [core.view.IView],

  construct: function(presenter, root)
  {
    core.view.Abstract.call(this, presenter);

    this.__renderRequestBound = core.Function.bind(this.__renderRequest, this);

    if (root != null)
    {
      if (jasy.Env.isSet("debug")) {
        core.Assert.isType(root, "Node", "Invalid root node!");
      }

      this.setRoot(root);
    }
  },

  properties :
  {
    /** Instance of compiled template to produce final data / text for output e.g. HTML, JSON, ... */
    template :
    {
      type: core.template.Template,
      nullable : true,
      apply : function() {
        this.render();
      }
    },

    /** The root element to render into */
    root :
    {
      type: "Node",
      nullable : true,
      apply : function(value, old) {
        this.render();
      }
    }
  },

  events :
  {
    /** Fired whenever the view has been rendered */
    render : core.event.Simple

  },

  members :
  {
    /*
    ======================================================
      DEBOUNCED RENDER LOGIC
    ======================================================
    */

    // Interface implementation
    render : function()
    {
      if (this.__renderScheduled != null) {
        return;
      }

      this.__renderScheduled = core.effect.AnimationFrame.request(this.__renderRequestBound);
    },


    /**
     * This method checks for whether all required data is available and triggers
     * the rendering as soon as this happens. Until than it regularly re-evaluates
     * whether this case happens.
     */
    __renderRequest : function()
    {
      if (this.__loaded && this._shouldRender())
      {
        this.__render();
        this.__renderScheduled = null;
      }
      else
      {
        this.__renderScheduled = core.effect.AnimationFrame.request(this.__renderRequestBound);
      }
    },


    /**
     * Internal render method which is called in buffered mode
     * so that only one rendering happens per frame.
     */
    __render : function()
    {
      var presenter = this.getPresenter();
      var elem = this.getRoot();
      var template = this.getTemplate();

      if (!presenter || !elem || !template) {
        return;
      }

      var partials = this.getPartials();
      var labels = this.getLabels();

      this._beforeRender();
      elem.innerHTML = template.render(presenter, partials, labels);
      this._afterRender();

      // Let others know
      this.fireEvent("render");
    },


    _beforeRender : function() {
      // placeholder
    },


    _afterRender : function() {
      // placeholder
    },


    _shouldRender : function() {
      return true;
    },


    __loaded : false,

    markAsLoaded : function()
    {
      this.log("All assets loaded!");
      this.__loaded = true;
      this.render();
    },

    markAsFailed : function(msg) {
      this.error("Unable to load required assets: " + msg);
    },



    /*
    ======================================================
      PUBLIC API
    ======================================================
    */

    // Interface implementation
    show : function(approach)
    {
      var elem = this.getRoot();
      if (!elem) {
        return;
      }

      elem.style.display = "block";
      this.fireEvent("show");
    },


    // Interface implementation
    hide : function(approach)
    {
      var elem = this.getRoot();
      if (!elem) {
        return;
      }

      elem.style.display = "none";
      this.fireEvent("hide");
    },


    /**
     * {Object} Returns the event parent which is used to bubble view events, to
     */
    getEventParent : function() {
      return this.getPresenter();
    },



    /*
    ======================================================
      REMOTE ASSET LOADING
    ======================================================
    */

    /** {=Map} Internal partial cache. Used for all instances */
    __partialCache : {},

    /** {=Map} Internal template cache. Used for all instances */
    __templateCache : {},

    /** {=RegExp} Regular expression for extracting the partial name from the assetId */
    __partialNameExtract : /\/([a-zA-Z]*)\.[a-z]*$/,


    /**
     * {core.event.Promise} Loads and registers the given partial from
     * a local @assetId {String}. Returns a promise for easy management.
     *
     * The name of the partial is auto extracted as the file name part
     * of the @assetId.
     */
    loadPartial : function(assetId, nostrip)
    {
      return new core.event.Promise(function(resolve, reject) {

        // Auto extract partial name from file name
        // Convention over configuration FTW
        var name = this.__partialNameExtract.exec(assetId)[1];

        // Use cached partial if available
        var existing = this.__partialCache[name];
        if (existing)
        {
          this.addPartial(name, existing);
          return resolve(existing);
        }

        // Otherwise load asset dynamically
        core.io.Text.load(jasy.Asset.toUri(assetId), function(uri, errornous, data)
        {
          if (jasy.Env.isSet("debug"))
          {
            if (errornous) {
              this.error("Failed to load partial: " + uri);
            } else {
              // this.log("Loaded partial: " + uri);
            }
          }

          if (errornous)
          {
            // Reject as IO Error
            reject("io");
          }
          else
          {
            // Enable stripping (to remove white spaces from formatting)
            var template = core.template.Compiler.compile(data.text, this.getLabels(), nostrip, assetId);
            this.addPartial(name, template);
            this.__partialCache[name] = template;

            // Finally fulfill
            resolve(template);
          }
        }, this);

      }, this);
    },


    /**
     * {core.event.Promise} Loads and registers the given template from
     * a local @assetId {String}. Returns a promise for easy management.
     */
    loadTemplate : function(assetId, nostrip)
    {
      return new core.event.Promise(function(resolve, reject) {

        // Use cached template if available
        var existing = this.__templateCache[assetId];
        if (existing)
        {
          this.setTemplate(existing);
          return resolve(existing);
        }

        core.io.Text.load(jasy.Asset.toUri(assetId), function(uri, errornous, data)
        {
          if (jasy.Env.isSet("debug"))
          {
            if (errornous) {
              this.error("Failed to load template: " + uri);
            } else {
              // this.log("Loaded template: " + uri);
            }
          }

          if (errornous)
          {
            // Reject as IO Error
            reject("io");
          }
          else
          {
            // Enable stripping (to remove white spaces from formatting)
            var template = core.template.Compiler.compile(data.text, this.getLabels(), nostrip, assetId);
            this.setTemplate(template);
            this.__templateCache[assetId] = template;

            // Finally fulfill
            resolve(template);
          }
        }, this);

      }, this);
    },


    /**
     * {core.event.Promise} Loads and injects the given stylesheet from
     * a local @assetId {String}. Returns a promise for easy management.
     */
    loadStyleSheet : function(assetId)
    {
      return new core.event.Promise(function(resolve, reject) {
        core.io.StyleSheet.load(jasy.Asset.toUri(assetId), function(uri, errornous, data)
        {
          if (jasy.Env.isSet("debug"))
          {
            if (errornous) {
              this.error("Failed to load stylesheet: " + uri);
            } else {
              // this.log("Loaded stylesheet: " + uri);
            }
          }

          errornous ? reject("io") : resolve(data);
        }, this);
      }, this);
    }
  }
});
