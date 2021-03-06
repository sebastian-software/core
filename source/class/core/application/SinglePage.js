core.Class("core.application.SinglePage",
{
  include : [core.presenter.Abstract],

  construct : function(parent)
  {
    core.presenter.Abstract.call(this, parent);

    // Prepare history object
    this.__history = new core.bom.HashHistory;
    this.__history.addListener("change", this.__onHistoryChange, this);
  },

  properties :
  {
    /**
     * Currently active presenter (page/activity)
     */
    active :
    {
      type : core.presenter.Abstract,
      nullable : true,
      apply : function(value, old)
      {
        if (old) {
          old.disable(this.__navigationDirection);
        }

        if (value) {
          value.enable(this.__navigationDirection);
        }
      }
    }
  },

  members :
  {
    /*
    ==================================================================
       ACTIVITY TRACKING
    ==================================================================
    */

    /** {=Integer} Number of active tasks */
    __activityCounter : 0,

    /**
     * Internal helper for updating activity indicator when some task was started.
     */
    incrementActivity : function(hint)
    {
      if (++this.__activityCounter == 1) {
        this.getView("root").showActivityIndicator();
      }

      if (jasy.Env.isSet("debug"))
      {
        // this.log(">>> Incremented: " + hint, this.__activityCounter);
        // this.log(">>> Waiting for " + this.__activityCounter + " background processes...");
      }
    },


    /**
     * Internal helper for updating activity indicator when some task was done.
     */
    decrementActivity : function(hint)
    {
      if (--this.__activityCounter == 0) {
        this.getView("root").hideActivityIndicator();
      }

      if (jasy.Env.isSet("debug"))
      {
        // this.log(">>> Decremented: " + hint, this.__activityCounter);
        // this.log(">>> Waiting for " + this.__activityCounter + " background processes...");
      }
    },




    /*
    ==================================================================
       NAVIGATION HANDLING
    ==================================================================
    */

    /** {=String} Either "in", "out", "other" */
    __navigationDirection : null,

    /** {=core.util.HashPath} Current path object */
    __navigationPath : null,


    /**
     * Reacts on all native history changes
     */
    __onHistoryChange : function(e)
    {
      var path = core.util.HashPath.obtain(e.getData());
      if (path.length == 0)
      {
        this.__history.setLocation("home");
        return;
      }

      var current = path.getCurrent();
      if (!current) {
        return;
      }

      var presenter = this.getChild(current.presenter);
      if (!presenter)
      {
        this.warn("Unknown presenter: " + current.presenter);
        return;
      }

      // Switch to new path while remember the old one
      var oldPath = this.__navigationPath;
      this.__navigationPath = path;

      // Detect movement between the two paths
      this.__navigationDirection = oldPath ? oldPath.compareTo(path) : "jump";

      // Make old path available for reusage
      if (oldPath) {
        oldPath.release();
      }

      // Configure next presenter
      presenter.setParam(current.param);
      presenter.setSegment(current.param);

      // Switch to that presenter
      this.setActive(presenter);

      // Fire event
      this.fireEvent("changePath", path);
    },


    /**
     * Navigate to given @fragment {String} with optional hint regarding the @relation {String}.
     */
    navigate : function(fragment, relation)
    {
      // Use current path to create a new mutated one
      var path = this.__navigationPath.navigate(fragment, relation);

      // Apply that path to the browser's native location hash
      location.hash = "#" + path.serialize();

      // Make path instance available to next user
      path.release();
    },


    /**
     * {Boolean} Whether the given presenter {Object|Class} is active.
     */
    isPresenterActive : function(presenter)
    {
      var active = this.getActive();
      return active && (active == presenter || active.constructor == presenter);
    },


    navigateBack : function(alternate)
    {
      // Navigate back to parent
      var hash = location.hash;
      var last = hash.lastIndexOf("/");

      if (last == -1) {
        location.hash += "/" + alternate;
        return;
      }

      location.hash = hash.slice(0, last);
    },


    /**
     * Real initialization code after first rendering
     */
    init : function()
    {
      this.__history.init();

      if (location.hash == "") {
        location.hash = "#home";
      }
    }
  }
});
