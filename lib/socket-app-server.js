var Utils = require('./utils');
var App = require('./App');
var sockjs = require('sockjs');
var Events = require('./events')
var logger = require('./middleware/logger')

/*
 * socket app class
 */

module.exports = (function(){

  function SocketApp(options) {
    if (!options.sockjs_url) { 
      throw new Error("midsockets.SockApp :: options requires a sockjs_url"); 
    }
    this.options = options;
    SocketApp.__super__.constructor.apply(this, arguments);
    return this;
  };

  Utils.extends(SocketApp, App);

  SocketApp.prototype.installListeners = function(socksrv) {
    var _this = this;

    socksrv.on('connection', function(conn) {
      // set up the connection for returns
      var connApp = new App();
      connApp.mount(_this);
      connApp._out.last(function(req,res,next){
        conn.write(JSON.stringify(req));
      });

      // incoming message
      conn.on('data', function(body) {
        var req = {};

        var res = {};
        Utils.merge(res, Events.prototype);

        var data = {};
        try {
          var data = JSON.parse(body);
        } catch(e) {
          console.error("midsockets.SockApp :: Unexpected message:" + e.stack || e.message);
        }

        // warning: this holds a reference to all the res until disconnect
        conn.on('close',function(){
          return res.emit('close');
        });

        res.out = connApp._out;
        req.route = data.route || "/";
        req.data = data.data;
        _this._in(req,res);
      });
    });

    return this;
  };

  SocketApp.prototype.listen = function(http_server){
    var socksrv = sockjs.listen(http_server, this.options);
    return this.installListeners.call(this, socksrv);
  };

  return SocketApp;

})();