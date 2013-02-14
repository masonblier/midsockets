var RequestPromise = require('./request_promise')

/*
 * RequestClient class
 */

module.exports = (function(){
  
  /*
   * constructor
   */
  function RequestClient(options) {
    this.app = options.app;
    this._requestPromises = {};
    this.app._in.last(requestMiddleware(this));
  }

  var requestMiddleware = function(_this){
    return function(req,res,next){
      if (req.req_id) {
        _this.handle(req,res,next);
      } else {
        next();
      }
    };
  };

  RequestClient.prototype.handle = function(req,res,next){
    if (!this._requestPromises[req.req_id]) {
      throw new Error("recieved unknown request id "+req.req_id);
    }
    this._requestPromises[req.req_id].handle(req,res,next);
    if (!req.subscribed) {
      delete this._requestPromises[req.req_id];
    }
  };

  RequestClient.prototype.get = function(route){
    return this.post(route,null);
  };

  RequestClient.prototype.post = function(route,data){
    var rp = new RequestPromise();
    var req_id = uuid.v1();
    this._requestPromises[req_id] = rp;
    this.app._out({route:route,data:data,req_id:req_id},{});
    return rp;
  };

  return RequestClient;

})();