var Utils = require('../utils');
var Events = require('../events');
var Deferred = require('./deferred');

/**
  @module midsockets
  @submodule Promises
**/

var eventedMiddleware = function(_this){
  return function(req,res,next){
    if (typeof req.eventName == 'string') {
      var emitArgs = req.data.args;
      emitArgs.unshift(req.eventName);
      _this.emit.apply(_this,emitArgs);
    } else if (req.err) {
      _this.reject(req.err);
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
  this.emit = Events.prototype.emit.bind(this);
  this.promise.on = Events.prototype.on.bind(this);
  this.promise.off = Events.prototype.off.bind(this);
  this.handle = eventedMiddleware(this);
};

Utils.extends(DeferredRequest, Deferred);

module.exports = DeferredRequest;