/*
 * midsockets-client
 */

window.midsockets = (function(){

  // creates an instance of SockjsClient

  function midsockets(options) {
    if (typeof options == "string") { options = {url: options}; }
    return new midsockets.Apps.SockjsClient(options);
  }

  // other exports

  midsockets.Events = require('./events');
  midsockets.Utils = require('./utils');
  midsockets.App = require('./app');
  midsockets.RequestClient = require('./promises/request_client');

  // app prefabs

  midsockets.Apps = {
    SockjsClient: require('./apps/sockjs-client'),
  };

  return midsockets;

})();