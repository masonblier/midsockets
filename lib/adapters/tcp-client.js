var net = require('net');
var Utils = require('../utils');
var App = require('../app');
var RequestClient = require('../promises/request_client');

var log = Utils.logger('bright black');

/**
  @module midsockets
  @submodule Adapters
**/

/**
  Connects to a midsockets tcp server, and acts as an
  App to attach other apps and middleware.

  @class TcpClient
  @constructor
  @param {Object} options
  @param {String} options.url The url of the midsockets server
**/

function TcpClient(options) {
  if (typeof options == 'string') {
    options = {url: options};
  }
  if (!options || !options.url) { 
    throw new Error("midsockets requires a connection url"); 
  }
  if (__domainPrefixRegex.test(options.url)) {
    var parts = __domainRegex.exec(options.url);
    options.protocol = parts[1];
    options.hostname = parts[2];
    options.port = parseInt(parts[3]);
  }
  TcpClient.__super__.constructor.apply(this, arguments);
  var _this = this;
  var _isOpen = false;
  this._buffer = [];
  this.sock = net.connect({port: options.port}, function() {
    log('midsockets.Adapters.TcpClient :: opened '+options.url);
    _this._buffer.forEach(function(message){
      _this.sock.write(""+message.length+"\r\n"+message+"\r\n");
    });
    _this._buffer = [];
    _isOpen = true;
  });
  this.sock.on('end', function() {
    log('midsockets.Adapters.TcpClient :: closed '+options.url);
  });
  var _dataBuffer = null;
  function onData(d) {
    var parts = d.toString().split("\r\n");
    if (parts[1].length != parseInt(parts[0])) {
      console.log("parts split fail",parts)
    } else {
      if (parts[2]) {
        setTimeout(function(){onData(parts.slice(2).join("\r\n"));},0);
      }
      try {
        var parsed = JSON.parse(parts[1]);
      } catch(err) {
        throw new Error("midsockets.Adapters.TcpClient :: Could not parse message data: '"+data+"'");
      }
    }
    _this._in(parsed, {});
  }
  this.sock.on('data', onData);
  this._out.last(function(req,res,next){
    if (_isOpen) {
      var message = JSON.stringify(req);
      _this.sock.write(""+message.length+"\r\n"+message+"\r\n");
    } else {
      _this._buffer.push(JSON.stringify(req));
    }
  });
  return this;
};

module.exports = TcpClient;

Utils.extends(TcpClient, App);

TcpClient.prototype.requestClient = function(){
  if (arguments.length > 0) { throw new Error("Arguments are not supported for TcpClient#requestClient"); }
  return new RequestClient({app: this});
};