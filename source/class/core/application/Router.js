core.Class("core.application.Router", {

  construct : function() {
    this.__routeListe = {};
  },

  members : {
    add : function(route, viewController) {
      this.__routeList.push(new core.application.router.Route(route, viewController));
    }
  }

});
