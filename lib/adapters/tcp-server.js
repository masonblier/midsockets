var net = require('net');
var Utils = require('../utils');
var App = require('../app');
var Events = require('../events');

/**
  @module midsockets
  @submodule Adapters
**/

/**
  Provides an App which creates and listens to a tcp connection

  @class TcpServer
  @constructor
**/

__domainPrefixRegex = /^(?:[a-z]+):\/\//g
__domainRegex = /^([a-z]+):\/\/((?:[a-z0-9]+(?:[\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6})|(?:(?:\d{1,3}\.){3}\d{1,3})|(?:localhost))(?::([0-9]{1,5}))?(\/.*‌​)?$/i


function TcpServer(options) {
  this.options = options || {};
  if (!this.options.port) {
    if (__domainPrefixRegex.test(this.options.url)) {
      var parts = __domainRegex.exec(this.options.url);
      this.options.protocol = parts[1];
      this.options.hostname = parts[2];
      this.options.port = parseInt(parts[3]);
    }
  }
  TcpServer.__super__.constructor.apply(this, arguments);
  return this;
}

module.exports = TcpServer;

Utils.extends(TcpServer, App);

/*
 * Creates the tcp connection
 */
TcpServer.prototype.listen = function(){
  var _this = this;

  var server = net.createServer(function(conn) {
    
    // set up the connection for returns
    var connApp = new App();
    connApp.mount(_this);
    connApp._out.last(function(req,res,next){
      var message = JSON.stringify(req);
      conn.write(""+message.length+"\r\n"+message+"\r\n");
    });


    function onData(d){
      var parts = d.toString().split("\r\n");
      if (parts[1].length == parseInt(parts[0])) {
        var body = parts[1];
      } else {
        console.log("cant handle mismatched message length",parts[0],parts[1].length)
        return
      }
      if (parts[2]) {
        process.nextTick(function(){onData(parts.slice(2).join("\r\n"));});
      }

      var req = {};

      var res = {};
      Utils.merge(res, Events.prototype);

      try {
        var req = JSON.parse(body);
      } catch(e) {
        throw new Error("midsockets.Adapters.TcpServer :: Unexpected message");
      }

      // warning: this holds a reference to all the res until disconnect
      conn.on('close',function(){
        return res.emit('close');
      });

      res.out = connApp._out;
      req.route = req.route || "/";
      _this._in(req,res);
      
    }
    conn.on('data',onData);

  });

  server.listen(this.options.port);

};