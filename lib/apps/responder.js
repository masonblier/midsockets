var Utils = require('../utils');
var App = require('../app');

/*
 * Responder app
 */

module.exports = (function(){

  function Responder(){
    Responder.__super__.constructor.apply(this, arguments);
    return this;
  }

  Utils.extends(Responder, App);

  Responder.prototype.on = function(route,fn){
    if (typeof route == 'function') { 
      fn = route; 
      route = null;
    }

    console.log("listening for route",route)
    
    var _this = this;
    // setup middleware to listen to the route
    if (!this._eventSubscribers || !(route in this._eventSubscribers)) {
      _this._in.use(route,function(req,res,next){
        _this.emit(route,req,res);
      });
    }

    return Responder.__super__.on.apply(this, arguments);
  };

  return Responder;

})();