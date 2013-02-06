/*
 * events class
 */

module.exports = (function(){

  function Events() {
  }

  Events.prototype.on = function(key, fn) {
    if (this._eventSubscribers===undefined) { this._eventSubscribers = {}; }
    if (!this._eventSubscribers[key]) { this._eventSubscribers[key]=[]; }
    this._eventSubscribers[key].push(fn);
  };

  Events.prototype.off = function(key, fn) {
    if (this._eventSubscribers===undefined) { return; }
    if (this._eventSubscribers[key]===undefined) { return; }
    var removalIndex = this._eventSubscribers[key].indexOf(fn);
    console.log("removing "+key+" :: "+removalIndex);
    if (removalIndex >= 0) {
      this._eventSubscribers[key].splice(removalIndex, 1);
    }
  };

  Events.prototype.emit = function(key)  {
    if (this._eventSubscribers===undefined) { this._eventSubscribers = {} }
    if (this._eventSubscribers[key]) {
      var emitArgs = Array.prototype.slice.call(arguments, 1);
      this._eventSubscribers[key].forEach(function(fn){
        fn.apply(this, emitArgs)
      });
    }
  };

  return Events;

})();