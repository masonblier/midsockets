/*
 * events class
 */

module.exports = (function(){

  function Events() {
  }

  Events.prototype.on = function(key, fn) {
    if (this._eventSubscribers===undefined) { this._eventSubscribers = []; }
    if (!this._eventSubscribers[key]) { this._eventSubscribers[key]=[]; }
    this._eventSubscribers[key].push(fn);
  };

  Events.prototype.emit = function(key, data)  {
    if (this._eventSubscribers===undefined) { this._eventSubscribers = []; }
    if (this._eventSubscribers[key]) {
      this._eventSubscribers[key].forEach(function(fn){
        fn(data);
      });
    }
  };

  return Events;

})();