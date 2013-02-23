var zmq = require('zmq');
var Utils = require('../utils');
var App = require('../app');

/**
  @module midsockets
  @submodule Adapters
**/

/**
  Creates a ZeroMQ req socket to send midsockets
  requests over.

  @class ZmqClient
  @constructor
  @param {Object} options
  @param {String} options.url The url of the midsockets server
**/

function ZmqClient(options) {
  if (!options.url) { 
    throw new Error("midsockets.ZmqClient requires a connection url"); 
  }
  ZmqClient.__super__.constructor.apply(this, arguments);
  var _this = this;
  var _buffer = [];
  var opened = false;
  var req = zmq.socket('req');
  req.connect(options.url, function(err){
    if (err) { throw err; }
    var opened = true;
    console.log("midsockets.ZmqClient :: opened "+options.url);
    console.info(this)
    console.info(arguments)
  });
  req.on("message", function(reply) {
    console.log(":::::::::::::; message reply ;:::::::::::::")
    console.info(this)
    console.info(arguments)
  });
  this._out.last(function(req,res,next){
    if (opened) {
      req.send(JSON.stringify(req));
    } else {
      _buffer.push(JSON.stringify(req));
    }
  });
  return this;
}

module.exports = ZmqClient;
Utils.extends(ZmqClient, App);

ZmqClient.prototype.requestClient = function(){
  if (arguments.length > 0) { throw new Error("Arguments are not supported for ZmqClient#requestClient"); }
  return new midsockets.RequestClient({app: this});
};
