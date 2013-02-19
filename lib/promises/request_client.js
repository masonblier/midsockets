var RequestPromise = require('./request_promise')

/**
  @module midsockets
  @submodule Promises
**/

/**
  Implements the same request methods as RequestClient. By pasing a route parameter,
  this object will map requested routes as relative to the passed route.

  @class RequestGhost
  @constructor
  @param {String}       route   The route to mount onto
  @param {RequestGhost} parent  The parent RequestGhost or RequestClient to send requests to
**/

var RequestGhost = (function(){

  function RequestGhost(route, parent){
    this.parent = parent;
    // ensure trailing slash
    route = (route.charAt(route.length-1)=='/'?route:route+'/');
    this.route = route;
  };

  RequestGhost.prototype.get = function(route){
    route = route.replace(/^[\/]+/,''); // strip leading slashes
    return this.parent.get(this.route+route);
  };
  RequestGhost.prototype.post = function(route,data){
    route = route.replace(/^[\/]+/,''); // strip leading slashes
    return this.parent.post(this.route+route,data);
  };
  RequestGhost.prototype.requester = function(route){
    route = route.replace(/^[\/]+/,''); // strip leading slashes
    return this.parent.requester(this.route+route);
  };

  return RequestGhost;

})();

/**
  Implements the same request methods as RequestClient. By pasing a route parameter,
  this object will map requested routes as relative to the passed route.

  @class RequestClient
  @constructor
  @param {Object} options
  @param {App}    options.app The parent app to listen on
**/

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

  RequestClient.prototype.requester = function(route){
    return new RequestGhost(route,this);
  };

  return RequestClient;

})();