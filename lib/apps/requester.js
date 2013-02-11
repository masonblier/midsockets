var Utils = require('../utils');
var App = require('../app');

/*
 * Requester app
 */

var Requester = module.exports = App.extend({

  initialize: function(){
    var _this = this;
    this.requestListeners = {};
    _this._in.use('/response',function(req,res,next){
      if (req.req_id in _this.requestListeners) {
        _this.requestListeners[req.req_id].call(this,req.data);
        delete _this.requestListeners[req.req_id];
      }
    });

    return this;
  },

  requester: function(route){
    if (typeof route != 'string') {
      route = "/";
    }
    var app = new Requester();
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
    return app;
  },

  get: function(route,data,fn){
    if (typeof data == 'function') { 
      fn = data; data = null;
    }
    var req_id = uuid.v1();
    if (fn) {
      this.requestListeners[req_id] = fn;
    }
    this._out({route:route,data:data,req_id:req_id},{});
  },

  subscribe: function(route,fn){
    this._in.use(route,function(req,res){
      fn(req.data);
    });
  }

});