var Utils = require('../utils');
var App = require('../app');

/**
  @module midsockets
  @submodule Adapters
**/

/**
  Creates and listens to a Sockjs client connection, and acts as an
  App to attach other apps and middleware.

  @class SockjsClient
  @constructor
  @param {Object} options
  @param {String} options.url The url of the midsockets server
**/

function SockjsClient(options) {
  if (!options.url) { 
    throw new Error("midsockets requires a connection url"); 
  }
  SockjsClient.__super__.constructor.apply(this, arguments);
  var _this = this;
  this.sock = new SockJS(options.url);
  this._buffer = [];  
  this.sock.onopen = function(){
    console.info('midsockets.Adapters.SockjsClient :: opened '+options.url);
    _this._buffer.forEach(function(message){
      _this.sock.send(message);
    });
    _this._buffer = [];
  };
  this.sock.onclose = function(){ console.info('midsockets.Adapters.SockjsClient :: closed '+options.url); };
  this.sock.onmessage = function(e){ 
    if (!e) { throw new Error("midsockets.Adapters.SockjsClient :: Strange Message of 'undefined'"); }
    if (e.type !== "message") { throw new Error("midsockets.Adapters.SockjsClient :: Strange Message of type: '"+e.type+"'"); }
    try {
      var parsed = JSON.parse(e.data);
    } catch(err) {
      throw new Error("midsockets.Adapters.SockjsClient :: Could not parse message data: '"+e.data+"'");
    }
    _this._in(parsed, {});
  };
  this._out.last(function(req,res,next){
    if (_this.sock.readyState===1) { // open
      _this.sock.send(JSON.stringify(req));
    } else {
      _this._buffer.push(JSON.stringify(req));
    }
  });
  return this;
};

module.exports = SockjsClient;

Utils.extends(SockjsClient, App);


SockjsClient.prototype.requestClient = function(){
  if (arguments.length > 0) { throw new Error("Arguments are not supported for SockjsClient#requestClient"); }
  return new midsockets.RequestClient({app: this});
};