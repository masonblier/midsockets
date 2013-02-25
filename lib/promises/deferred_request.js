var Utils = require('../utils');
var Events = require('../events');
var Deferred = require('./deferred');

/**
  @module midsockets
  @submodule Promises
**/

var eventedMiddleware = function(_this){
  return function(req,res,next){
    _this.subscribed = req.subscribed;
    if (typeof req.eventName == 'string') {
      var emitArgs = req.data.args;
      emitArgs.unshift(req.eventName);
      _this.emit.apply(_this,emitArgs);
    } else if (req.err) {
      _this.reject(req.err);
    } else if (req.nothing) {
      console.log("subscribed?",_this.subscribed)
      // do nothign
    } else {
      _this.fulfill(req.data);
    }
  };
};

/**
  A Deferred object which wraps requests. The return result of
  the request methods is the promise created by a DeferredRequest.

  @class DeferredRequest
  @constructor
**/

function DeferredRequest() {
  DeferredRequest.__super__.constructor.apply(this, arguments);
  this.emit = Events.prototype.emit.bind(this.promise);
  this.promise.on = Events.prototype.on.bind(this.promise);
  this.promise.off = Events.prototype.off.bind(this.promise);
  this.handle = eventedMiddleware(this);
  this.timeout = setTimeout(function(){
    if (!this.resolved && !this.subscribed) {
      this.reject("request timed out after "+DeferredRequest.timeout_seconds+" seconds.")
    }
  }.bind(this), DeferredRequest.timeout_seconds * 1000)
};

Utils.extends(DeferredRequest, Deferred);

module.exports = DeferredRequest;

DeferredRequest.timeout_seconds = 5;