/*
 * midsockets-client
 */

window.midsockets = (function(){

  // entry / builder function

  function midsockets(options) {
    if (typeof options == "string") { options = {url: options}; }
    return new midsockets.Apps.SockjsClient(options);
  }

  // other exports

  midsockets.Events = require('./events');
  midsockets.Utils = require('./utils');
  midsockets.App = require('./app');

  // app prefabs

  midsockets.Apps = {
    SockjsClient: require('./apps/sockjs-client'),
    Requester: require('./apps/requester')
  };

  return midsockets;

})();