var inheritance = require('./inheritance');
var Events = require('./events');
var MiddlewarePrototype = require('./middleware_prototype');
var Utils = require('./utils');

/**
  @module midsockets
**/

/**
  App is the base class of different things you can connect into your midsockets
  chain. 

  @class App
  @constructor
**/

function App(){
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

module.exports = App;

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
      var subroute = req.route.replace(/^[\/]+/,''); // strip leading slashes
      req.route = route + (route.charAt(route.length-1)=='/' ? "" : "/") + subroute;
      _resOutOld.apply(this,arguments);
    };
    app._in(req,res);
  });
  app._out.last(function(req,res,next){
    var subroute = req.route.replace(/^[\/]+/,''); // strip leading slashes
    req.route = route + (route.charAt(route.length-1)=='/' ? "" : "/") + subroute;
    _this._out(req,res);
  });
  return this;
};

App.prototype.child = function(route) {
  var app = new App();
  this.mount(route,app);
  return app;
};