/*
 * DeferredResponse class
 */

module.exports = (function(){

  function DeferredResponse(options) {
    this._res = options.res;
    this.req_id = options.req_id;
    this._subscribed = false;
    this._eventSubscribers = {};
    this._finished = false;
    return this;
  };

  /*
   * subscribes to events emitted on this response directly
   * @returns key object for future reference
   */
  DeferredResponse.prototype.on = function(eventName,listener){
    if (!this._eventSubscribers[eventName]) { this._eventSubscribers[eventName]=[]; }
    var listSize = this._eventSubscribers[eventName].push(function(){
      listener.apply(this,arguments);
    });
    return {eventName:eventName,offset:listSize-1};
  };
  DeferredResponse.prototype.off = function(key){
    if (key && this._eventSubscribers[key.eventName]) {
      // deleting is intentional to leave gaps in the array,
      // as splicing causes the offsets to change
      delete this._eventSubscribers[key.eventName][key.offset];
    }
  };

  DeferredResponse.prototype.listenTo = function(target,eventName,options){
    var _this = this;
    this._subscribed = true;
    var localName = (options && options.as) ? options.as : "";
    var sub = function(msg){
      _this.emit(localName, msg)
    };
    target.on(eventName, sub);
    target.on("close", function(){
      target.off(eventName, sub);
    });
  };
  /*
   * emits an event to the requester and local listeners
   */
  DeferredResponse.prototype.emit = function(eventName){
    var _this = this;
    if (!eventName) { eventName = ""; }
    var emitArgs = Array.prototype.slice.call(arguments, 1);
    this._res.out({
      route:"/",
      eventName:eventName,
      data:{args:emitArgs},
      req_id:this.req_id,
      subscribed:this._subscribed
    },{});
    if (this._eventSubscribers[eventName]) {
      this._eventSubscribers[eventName].forEach(function(fn){
        fn.apply(_this, emitArgs);
      });
    }
  };

  /*
   * Resolves the promise. Response will close if there are no subscriptions
   */
  DeferredResponse.prototype.resolve = function(val){
    if (!this._finished) {
      this._finished = true;
      this._res.out({route:"/",data:val,req_id:this.req_id,subscribed:this._subscribed},{});
    } else {
      throw new Error("cannot #resolve a closed DeferredResponse")
    }
  };
  /*
   * Rejects the promise. Response will close if there are no subscriptions
   */
  DeferredResponse.prototype.reject = function(err){
    if (!this._finished) {
      this._finished = true;
      this._res.out({route:"/",error:err,req_id:this.req_id,subscribed:this._subscribed},{});
    } else {
      throw new Error("cannot #reject a closed DeferredResponse")
    }
  };

  /*
   * Closes the response
   */
  DeferredResponse.prototype.end = function(){
    if (!this._finished) {
      this._finished = true;
      this._res.out({route:"/",req_id:this.req_id},{});
    } else {
      throw new Error("cannot #end a closed DeferredResponse")
    }
  };

  return DeferredResponse;

})();