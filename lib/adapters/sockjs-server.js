var sockjs = require('sockjs');
var cookiejs = require('cookie');

var Utils = require('../utils');
var App = require('../app');
var Events = require('../events');

/**
  @module midsockets
  @submodule Adapters
**/

/**
  Provides an App which listens to a sockjs instance
  and can attach to an http.Server instance. This is the object
  return by midsockets() in nodejs. You can mount other App instances,
  such as a Router.

  @class SockjsServer
  @constructor
  @param {Object} options
  @param {String} options.sockjs_url The url of the sockjs client, for use in an embedded iframe if necessary
**/

function SockjsServer(options) {
  if (!options.sockjs_url) { 
    throw new Error("midsockets.SockjsServer :: options requires a sockjs_url"); 
  }
  this.options = options;
  SockjsServer.__super__.constructor.apply(this, arguments);
  return this;
}

module.exports = SockjsServer;

Utils.extends(SockjsServer, App);

/**
  Listens to the passed sockjs instance for incoming requests

  @method installListeners
  @param {Object} socksrv the sockjs instance
**/
SockjsServer.prototype.installListeners = function(socksrv) {
  var _this = this;

  socksrv.on('connection', function(conn) {

    // set up the connection for returns
    var connApp = new App();
    connApp.mount(_this);
    connApp._out.last(function(req,res,next){
      conn.write(JSON.stringify(req));
    });

    // load cookies
    var cookies;
    try {
      cookies = cookiejs.parse(conn._session.recv.ws.request.headers.cookie);
    } catch(e) {}

    // incoming message
    conn.on('data', function(body) {
      var req = {};

      var res = {};
      Utils.merge(res, Events.prototype);

      try {
        var req = JSON.parse(body);
      } catch(e) {
        throw new Error("midsockets.SockApp :: Unexpected message");
      }

      // warning: this holds a reference to all the res until disconnect
      conn.on('close',function(){
        return res.emit('close');
      });

      res.out = connApp._out;
      req.route = req.route || "/";
      req.cookies = cookies;
      _this._in(req,res);
    });
  });

  return this;
};

SockjsServer.prototype.listen = function(http_server){
  var socksrv = sockjs.listen(http_server, this.options);
  return this.installListeners.call(this, socksrv);
};