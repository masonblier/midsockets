var Deferred = require('./deferred.js');


exports.pending = function(){
  var deferred = new Deferred();
  return {
    promise: deferred.promise,
    fulfill: deferred.fulfill,
    reject: deferred.reject
  };
};

exports.fulfilled = function(val){
  var deferred = new Deferred();
  deferred.fulfill(val);
  return deferred.promise;
};

exports.rejected = function(val){
  var deferred = new Deferred();
  deferred.reject(val);
  return deferred.promise;
};