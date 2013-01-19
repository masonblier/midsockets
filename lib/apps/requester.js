var Utils = require('../utils');
var App = require('../app');

/*
 * Requester app
 */

module.exports = (function(){

  function Requester(){
    var _this = this;
    Requester.__super__.constructor.apply(this, arguments);
    this.requestListeners = {};
    _this._in.use('/response',function(req,res,next){
      if (req.req_id in _this.requestListeners) {
        _this.requestListeners[req.req_id].call(this,req.data);
        delete _this.requestListeners[req.req_id];
      }
    });

    return this;
  }

  Utils.extends(Requester, App);

  Requester.prototype.request = function(route,data,fn){
    if (typeof data == 'function') { 
      fn = data; data = null;
    }
    var req_id = uuid.v1();
    if (fn) {
      this.requestListeners[req_id] = fn;
    }
    this._out({route:route,data:data,req_id:req_id},{});
  };

  return Requester;

})();