var Utils = require('../utils');
var App = require('../app');

/*
 * Responder app
 */

var Responder = module.exports = App.extend({

  initialize: function(){
    var _this = this;
    if ((typeof _this.before)==='function'){
      _this._in.use(function(req,res,next){
        return _this.before.call(_this,req,res,next);
      });
    }
    Object.keys(this.__proto__)
      .filter(function(k){return k!='constructor'&&k!='before'&&k!='initialize';})
      .forEach(function(route){
        return _this._setupListener.call(_this,"/"+route,_this[route].bind(_this));});
    return this;
  },

  _setupListener: function(route, fn){
    var _this = this;
    if (!this._eventSubscribers || !(route in this._eventSubscribers)) {
      // setup middleware to listen to the route
      _this._in.use(route,function(req,res,next){
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