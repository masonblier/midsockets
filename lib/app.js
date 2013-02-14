var inheritance = require('./inheritance');
var Events = require('./events');
var MiddlewarePrototype = require('./middleware');
var Utils = require('./utils');

/*
 * app base class
 */

module.exports = (function(){

  function App(options){
    var _this = this;
    this._in = function(req,res){ _this._in.handle(req,res); };
    this._out = function(req,res){ _this._out.handle(req,res); };
    this._in.stack = [];
    this._out.stack = [];
    Utils.merge(this._in, MiddlewarePrototype);
    Utils.merge(this._out, MiddlewarePrototype);
    this.initialize.apply(this,arguments);
    return this;
  }

  Utils.extends(App, Events);
  App.extend = inheritance.extend;

  App.prototype.initialize = function(){};

  App.prototype.mount = function(route, app){
    if (typeof route != 'string') {
      app = route;
      route = "/";
    }
    var _this = this;
    this._in.use(route, function(req,res,next){
      // wrap the res.out function to push the route on
      var _resOutOld = res.out;
      res.out = function(req,res) {
        req.route = route + req.route;
        _resOutOld.apply(this,arguments);
      };
      app._in(req,res);
    });
    app._out.last(function(req,res,next){
      req.route = route + req.route;
      _this._out(req,res);
    });
    return this;
  };

  App.prototype.child = function(route) {
    var app = new App();
    this.mount(route,app);
    return app;
  };

  return App;
  
})();