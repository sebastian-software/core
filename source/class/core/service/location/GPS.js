/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2013-2014 Sebastian Werner
==================================================================================================
*/

/**
 * Wrapper around different GPS APIs. Returns promises for simplified flow handling.
 */
core.Module("core.service.location.GPS",
{
  detect : function()
  {
    return new core.event.Promise(function(resolve, reject) {
      if (navigator.geolocation)
      {
        navigator.geolocation.getCurrentPosition(function(result)
        {
          if (result) {
            resolve(result.coords);
          } else {
            reject("Empty GPS response");
          }
        });
      }
      else
      {
        reject("No GPS support!");
      }
    });
  }
});
