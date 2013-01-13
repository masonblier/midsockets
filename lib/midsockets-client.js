/*
 * midsockets-client
 */

window.midsockets = (function(){

  function midsockets(options) {
    if (typeof options == "string") { options = {url: options}; }
    return new midsockets.SocketApp(options);
  }

  // other exports

  midsockets.Events = require('./events');
  midsockets.Utils = require('./utils');
  midsockets.App = require('./app');
  midsockets.SocketApp = require('./socket-app-client');

  return midsockets;

})();