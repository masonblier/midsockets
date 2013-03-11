/*
 * midsockets-client
 */

window.midsockets = (function(){

  // creates an instance of SockjsClient

  function midsockets(options) {
    if (typeof options == "string") { options = {url: options}; }
    return new midsockets.SockjsClient(options);
  }

  // other exports

  midsockets.Events = require('./events');
  midsockets.Utils = require('./utils');
  midsockets.App = require('./app');
  midsockets.RequestClient = require('./promises/request_client');
  midsockets.SockjsClient = require('./adapters/sockjs-client');

  return midsockets;

})();