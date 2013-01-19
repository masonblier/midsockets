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