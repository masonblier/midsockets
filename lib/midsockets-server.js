var fs = require('fs');
var basename = require('path').basename;

/*
 * midsockets-server
 */

module.exports = (function(){

  function midsockets(options) {
    if (typeof options == "string") { options = {url: options}; }
    return new midsockets.SocketApp(options);
  }

  // other exports

  midsockets.Events = require('./events');
  midsockets.Utils = require('./utils');
  midsockets.App = require('./app');
  midsockets.SocketApp = require('./socket-app-server');

  // load all middleware and attach getters to midsockets

  midsockets.middleware = {}

  fs.readdirSync(__dirname + '/middleware').forEach(function(filename){
    if (!/\.js$/.test(filename)) return;
    var name = basename(filename, '.js');
    function load(){ return require('./middleware/' + name); }
    midsockets.middleware.__defineGetter__(name, load);
    midsockets.__defineGetter__(name, load);
  });

  return midsockets;

})();