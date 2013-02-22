/**
  @module midsockets
  @submodule Promises
**/

/**
  An promises/a compatable promise implementation
  based on https://github.com/ForbesLindesay/promises-a

  @class Deferred
  @constructor
**/

function Deferred() {
  this.resolved = false;
  this.fulfilled = false;
  this.fulfill = fulfill.bind(this);
  this.reject = reject.bind(this);
  this.val = undefined;
  this.waiting = [];
  this.running = false;
  this.promise = {
    then: then.bind(this), 
    valueOf: valueOf.bind(this), 
    done: done.bind(this)
  };
}

module.exports = Deferred;

Deferred.prototype.resolve = function resolve(success, value) {
  if (this.resolved) return;
  if (success && value && typeof value.then === 'function') {
    value.then(this.fulfill.bind(this), this.reject.bind(this))
  } else {
    this.resolved = true
    this.fulfilled = success
    this.val = value
    __next.bind(this)()
  }
};

function fulfill(val) {
  this.resolve(true, val)
}
function reject(err) {
  this.resolve(false, err)
}

function valueOf() {
  return this.fulfilled ? this.val : this.promise;
}

function __next(){
  if (this.waiting.length) {
    this.running = true
    this.waiting.shift()()
  } else {
    this.running = false
  }
};

function then(cb, eb) {
  var _this = this;
  var def = new Deferred();
  var next = __next.bind(this);
  var handler = function() {
    var callback = _this.fulfilled ? cb : eb;
    if (typeof callback === 'function') {
      setTimeout(function(){
        var result;
        try {
          result = callback(_this.val);
        } catch (ex) {
          def.reject(ex);
          next();
        }
        def.fulfill(result);
        next();
      }, 0);
    } else if (_this.fulfilled) {
      def.fulfill(_this.val);
      next();
    } else {
      def.reject(_this.val);
      next();
    }
  }
  this.waiting.push(handler);
  if (_this.resolved && !_this.running) {
    next()
  }
  return def.promise
};

function done(cb, eb) {
  var p = this.promise; // support 'hot' promises
  if (cb || eb) {
    p = p.then(cb, eb)
  }
  p.then(null, function (reason) {
    setTimeout(function () {
      throw reason
    }, 0);
  })
};