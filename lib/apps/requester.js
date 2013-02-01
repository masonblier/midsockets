var Utils = require('../utils');
var App = require('../app');

/*
 * Requester app
 */

module.exports = App.extend({

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

  request: function(route,data,fn){
    if (typeof data == 'function') { 
      fn = data; data = null;
    }
    var req_id = uuid.v1();
    if (fn) {
      this.requestListeners[req_id] = fn;
    }
    this._out({route:route,data:data,req_id:req_id},{});
  }

});