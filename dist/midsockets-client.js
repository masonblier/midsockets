/*
 * midsockets client side library
 */

;(function(){

/*
 * main entry point
 */

window.midsockets = function midsockets(options) {
  if (typeof options == "string") { options = {url: options}; }
  return new midsockets.SocketApp(options);
};

/*
 * Utils functions
 */

var Utils = midsockets.Utils = {}

Utils.merge = function(a, b){
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};

var __hasProp = {}.hasOwnProperty;
Utils.extends = function(child, parent) { 
  for (var key in parent) {
    if (__hasProp.call(parent, key)) child[key] = parent[key]; 
  } 
  function ctor() { 
    this.constructor = child; 
  } 
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child; 
};

/*
 * events class
 */

midsockets.Events = (function(){

  function Events() {
  }

  Events.prototype.on = function(key, fn) {
    if (this._eventSubscribers===undefined) { this._eventSubscribers = []; }
    if (!this._eventSubscribers[key]) { this._eventSubscribers[key]=[]; }
    this._eventSubscribers[key].push(fn);
  };

  Events.prototype.emit = function(key, data)  {
    if (this._eventSubscribers===undefined) { this._eventSubscribers = []; }
    if (this._eventSubscribers[key]) {
      this._eventSubscribers[key].forEach(function(fn){
        fn(data);
      });
    }
  };

  return Events;

})();

/*
 * app base class
 */
midsockets.App = (function(){

  function App(){
    var _this = this;
    this._in = function(req,res){ _this._in.handle(req,res); };
    this._out = function(req,res){ _this._out.handle(req,res); };
    this._in.stack = [];
    this._out.stack = [];
    Utils.merge(this._in, MiddlewarePrototype);
    Utils.merge(this._out, MiddlewarePrototype);
    return this;
  }

  Utils.extends(App,midsockets.Events);

  App.prototype.mount = function(route, app){
    var _this = this;
    this._in.use(route,app._in);
    app._out.last(function(req,res,next){
      req.route = route + req.route;
      _this._out(req,res);
    });
    return this;
  };

  return App;
  
})();

/*
 * socket app class
 */

midsockets.SocketApp = (function(){

  function SocketApp(options) {
    if (!options.url) { 
      throw new Error("midsockets requires a connection url"); 
    }
    SocketApp.__super__.constructor.apply(this, arguments);
    var _this = this;
    this.sock = new SockJS(options.url);
    this._buffer = [];  
    this.sock.onopen = function(){
      console.info('midsockets.SockApp :: opened '+options.url);
      _this._buffer.forEach(function(message){
        _this.sock.send(message);
      });
      _this._buffer = [];
    };
    this.sock.onclose = function(){ console.info('midsockets.SockApp :: closed '+options.url); };
    this.sock.onmessage = function(e){ 
      if (!e || e.type !== "message") { console.error("strange message",e); return; }
      try {
        var parsed = JSON.parse(e.data);
        _this._in(parsed, {});
      } catch(err) {
        console.error("couldn't parse message",err)
      }
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

  Utils.extends(SocketApp,midsockets.App);

  return SocketApp;

})();

/*
 * middleware app prototype
 */

midsockets.MiddlewarePrototype = (function(){

  MiddlewarePrototype = {}

  MiddlewarePrototype.use = function(route,fn){
    if ('string' != typeof route) {
      fn = route;
      route = '/';

    }
    if ('/' == route[route.length - 1]) {
      route = route.slice(0, -1);
    }
    this.stack.push({route:route,handle:fn});
  };

  MiddlewarePrototype.last = function(fn){
    this._last = fn;
  };

  MiddlewarePrototype.handle = function(req,res,out){
    var stack = this.stack
      , _last = this._last
      , removed = ''
      , index = 0;

    function next(err,msg) {
      var path, layer, c;

      req.route = removed + req.route;
      req.originalRoute = req.originalRoute || req.route;
      removed = '';

      var layer = stack[index++];

      if (_last && !layer) {
        layer = {
          route: '/',
          handle: _last
        };
        _last = undefined;
      }

      if (!layer) {
        if (out) return out(err);
        if (err) {
          console.error(err.stack || err.toString());
        } else {
          console.info("unresolved request",req);
        }
        return;
      }

      try {
        path = req.route || '/';

        if (0 != path.toLowerCase().indexOf(layer.route.toLowerCase())) return next(err);
        if (layer.route.length > 1) {
          c = path[layer.route.length];
          if (c && '/' != c && '.' != c) return next(err);
      
          removed = layer.route;
          req.route = req.route.substr(removed.length);
        }

        var arity = layer.handle.length;
        if (err) {
          if (arity === 4) {
            layer.handle(err, req, res, next);
          } else {
            next(err);
          }
        } else if (arity < 4) {
          layer.handle(req, res, next);
        } else {
          next();
        }
      } catch (e) {
        console.error("next err",e)
        next(e);
      }
    };
    next();
  };

  return MiddlewarePrototype;

})();

})();