var Utils = require('../utils');
var App = require('../app');
var Requester = require('./requester');

/*
 * SockjsClient
 */

module.exports = (function(){

  function SockjsClient(options) {
    if (!options.url) { 
      throw new Error("midsockets requires a connection url"); 
    }
    SockjsClient.__super__.constructor.apply(this, arguments);
    var _this = this;
    this.sock = new SockJS(options.url);
    this._buffer = [];  
    this.sock.onopen = function(){
      console.info('midsockets.Apps.SockjsClient :: opened '+options.url);
      _this._buffer.forEach(function(message){
        _this.sock.send(message);
      });
      _this._buffer = [];
    };
    this.sock.onclose = function(){ console.info('midsockets.Apps.SockjsClient :: closed '+options.url); };
    this.sock.onmessage = function(e){ 
      if (!e) { throw new Error("midsockets.SockApp :: Strange Message of 'undefined'"); }
      if (e.type !== "message") { throw new Error("midsockets.SockApp :: Strange Message of type: '"+e.type+"'"); }
      try {
        var parsed = JSON.parse(e.data);
      } catch(err) {
        throw new Error("midsockets.SockApp :: Could not parse message data: '"+e.data+"'");
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

  Utils.extends(SockjsClient, App);

  SockjsClient.prototype.requester = function(route){
    var app = new App();
    this.mount(route,app);
    return new midsockets.RequestClient({app: app});
  };

  return SockjsClient;

})();