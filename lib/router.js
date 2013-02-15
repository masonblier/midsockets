App = require('./app');
Utils = require('./utils');
DeferredResponse = require('./promises/deferred_response')

/*
 * router
 */
module.exports = (function(){

  function Router(){
    var _this = this;
    this._routeMap = {};
    Router.__super__.constructor.apply(this, arguments);

    if (_this._in) {
      _this._in.use(function(req,res,next){
        res = new DeferredResponse({res: res, req_id: req.req_id});
        return _this.handle.call(_this,req,res,next);
      });
    }

  }

  Utils.extends(Router,App);

  Router.prototype.on = function(route, handle){
    if (typeof route == 'function'){
      handle = route;
      route = "";
    }

    var strp = (route.charAt(0)=='/' ? route.substr(1) : route);
    var str = strp.split('/',1)[0];
    if (str.length > 0) {
      var rem = strp.substr(str.length);
      if (str.charAt(0) == ':') {
        var spl = str.substr(1);
        if (!this._routeMap[":"]) { this._routeMap[":"] = {}; }
        if (!this._routeMap[":"][spl]) {
          this._routeMap[":"][spl] = new Router();
        }
        this._routeMap[":"][spl].on(rem,handle)
      } else {
        if (!this._routeMap[str]) {
          this._routeMap[str] = new Router();
        }
        this._routeMap[str].on(rem, handle);
      }
    } else {
      if (!this._routeMap["/"]) { this._routeMap["/"] = []; }
      this._routeMap["/"].push(handle);
    }
  };

  Router.prototype.handle = function(req,res,next) {
    var _this = this;
    var strp = (req.route.charAt(0)=='/' ? req.route.substr(1) : req.route);
    var str = strp.split('/',1)[0];
    var rem = strp.substr(str.length);
    if (_this._routeMap[str]) {
      req.route = rem;
      _this._routeMap[str].handle(req,res,next);
    } else if (_this._routeMap[":"]) {
      for (var key in _this._routeMap[":"]) {
        if ({}.hasOwnProperty.call(_this._routeMap[":"],key)){
          req[key] = str;
          req.route = rem;
          _this._routeMap[":"][key].handle(req,res,next);
        }
      }
    } else if (str.length <= 0 && _this._routeMap["/"]) {
      _this._routeMap["/"].forEach(function(handler){
        handler(req,res,next);
      });
    } else {
      next();
    }
  };

  return Router;

})();