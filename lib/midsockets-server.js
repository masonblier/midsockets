var fs = require('fs');
var basename = require('path').basename;

/**
 midsockets - real time streaming request promises
 
 @module midsockets
 @main midsockets
**/

// creates an instance of SockjsServer

module.exports = function midsockets(options) {
  if (typeof options == "string") { options = {url: options}; }
  return new midsockets.Apps.SockjsServer(options);
}

// other exports

midsockets.Events = require('./events');
midsockets.Utils = require('./utils');
midsockets.App = require('./app');
midsockets.Router = require('./router');
SockjsServer: require('./sockjs-server'),


// load all middleware and attach getters to midsockets

midsockets.middleware = {}

fs.readdirSync(__dirname + '/middleware').forEach(function(filename){
  if (!/\.js$/.test(filename)) return;
  var name = basename(filename, '.js');
  function load(){ return require('./middleware/' + name); }
  midsockets.middleware.__defineGetter__(name, load);
  midsockets.__defineGetter__(name, load);
});
