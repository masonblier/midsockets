/*
 * RequestPromise class
 */

module.exports = (function(){

  var eventedMiddleware = function(_this){
    return function(req,res,next){
      if (typeof req.eventName == 'string') {
        var emitArgs = req.data.args;
        emitArgs.unshift(req.eventName);
        _this.emit.apply(_this,emitArgs);
      } else if (req.err) {
        _this._promise.err = req.err;
        _this._promise.rejecteds.forEach(function(rejected){
          rejected(_this._promise.err);
        });
      } else {
        _this._promise.val = req.data;
        _this._promise.fulfilled = true;
        _this._promise.fulfilleds.forEach(function(fulfilled){
          fulfilled(_this._promise.val);
        }); 
      }
    };
  };

  /*
   * constructor
   */
  function RequestPromise() {
    this._eventSubscribers = {};
    this._promise = {fulfilleds: [], rejecteds: []};
    this.handle = eventedMiddleware(this);
  }

  /*
   * promises/a methods are emitted on request termination.
   */
  RequestPromise.prototype.then = function(fulfilled,rejected) {
    throw new Error("not yet implemented");
    return this;
  };
  RequestPromise.prototype.done = function(fulfilled,rejected) {
    if (!this._promise.done) {
      if (fulfilled) { this._promise.fulfilleds.push(fulfilled); }
      if (rejected) { this._promise.rejecteds.push(rejected); }
    } else {
      if (this._promise.fulfilled && fulfilled) {
        fulfilled(this._promise.val);
      } else if (rejected) {
        rejected(this._promise.err);
      }
    }
    return this;
  };

  /*
   * route based events
   * @returns key object for future reference
   */
  RequestPromise.prototype.on = function(eventName,listener){
    if (typeof eventName == 'function'){
      listener = eventName;
      eventName = "";
    }
    if (!this._eventSubscribers[eventName]) { this._eventSubscribers[eventName]=[]; }
    var listSize = this._eventSubscribers[eventName].push(function(){
      listener.apply(this,arguments);
    });
    return {eventName:eventName,offset:listSize-1};
  };
  RequestPromise.prototype.off = function(key){
    if (key && this._eventSubscribers[key.eventName]) {
      // deleting is intentional to leave gaps in the array,
      // as splicing causes the offsets to change
      delete this._eventSubscribers[key.eventName][key.offset];
    }
  };
  RequestPromise.prototype.emit = function(eventName){
    var _this = this;
    if (this._eventSubscribers[eventName]) {
      var emitArgs = Array.prototype.slice.call(arguments, 1);
      this._eventSubscribers[eventName].forEach(function(fn){
        fn.apply(_this, emitArgs)
      });
    }
  };

  return RequestPromise;

})();