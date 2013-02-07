var Utils = require('../utils');
var App = require('../app');

/*
 * Responder app
 */

var Responder = module.exports = App.extend({

  initialize: function(){
    var _this = this;
    Object.keys(this.__proto__)
      .filter(function(k){return k!='constructor';})
      .forEach(function(route){
        return _this._setupListener.call(_this,"/"+route,_this[route].bind(_this));});
    return this;
  },

  _setupListener: function(route, fn){
    var _this = this;
    if (!this._eventSubscribers || !(route in this._eventSubscribers)) {
      // setup middleware to listen to the route
      _this._in.use(route,function(req,res,next){
        req.params = req.route.substr(1).split('/');
        _this.emit(route,req,res);
      });
    }

    return App.prototype.on.apply(this,arguments);
  },

  on: function(route,fn){
    if (typeof route == 'function') { 
      fn = route; 
      route = null;
    }
    return this._setupListener.call(this,route,fn);
  }

});