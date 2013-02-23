var zmq = require('zmq');

var Utils = require('../utils');
var App = require('../app');
var Events = require('../events');

/**
  @module midsockets
  @submodule Adapters
**/

/**
  Provides an App which listens to a ZeroMQ responder
  socket.

  @class ZmqServer
  @constructor
  @param {Object} options
  @param {String} options.bind The bind string of the responder socket
**/

function ZmqServer(options) {
  this.options = options;
  ZmqServer.__super__.constructor.apply(this, arguments);
  return this;
}

Utils.extends(ZmqServer, App);
module.exports = ZmqServer;

ZmqServer.prototype.listen = function(){
  var rep = zmq.socket('rep');
  var bind_uri = this.options.bind.toString();
  
  rep.on('message', function(request) {
    console.log(")))))))))))))) ZmqServer message (((((((((((((")
    console.info(this)
    console.info(arguments)
  });

  rep.bind(bind_uri, function(err){
    if (err) { throw err; }
    console.log(" [zmq] Listening on "+bind_uri);
  });

  process.on('SIGINT', function() {
    rep.close();
  });
};