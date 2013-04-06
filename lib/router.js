App = require('./app');
Utils = require('./utils');
DeferredResponse = require('./promises/deferred_response')

/**
  Routers are Apps which allow you to mount other routers or
  listener functions on specific routes. Listeners are given
  a DeferredResponse instance to respond to.

  @class Router
  @constructor
**/

function Router(){
  var _this = this;
  this._routeTree = {};
  Router.__super__.constructor.apply(this, arguments);

  if (_this._in) {
    _this._in.use(function(req,ores,next){
      ores._oldOut = ores.out;
      ores.out = function(resreq){
        resreq.route = req.route;
        ores._oldOut(resreq);
      };
      var res = new DeferredResponse({res: ores, req_id: req.req_id});
      return _this.handle.call(_this,req.route,req,res);
    });
  }
}

module.exports = Router;

Utils.extends(Router,App);

Router.prototype.on = function(route, listener) {
  // clean route and get parts
  if (!listener && (typeof route == 'function')) { listener = route; route = "/"; }
  route = "/"+route.replace(/\/+$/,"").replace(/^\/+/,""); // trip trailing slash but ensure leading slash
  var parts = route.split("/").slice(1); // split, slicing the first since we ensured a leading slash

  // follows a path down the route tree, creating nodes which do not yet exist
  var node = this._routeTree;
  for (var i = 0; i < parts.length; ++i) {
    var part = parts[i];
    if (part.length <= 0) { // no route or blank route
      continue; 
    } else if (part.charAt(0)==':') { // param matcher
      var paramName = part.substr(1);
      if (/^[a-zA-Z0-9_]+$/.test(paramName)) {
        if (!node[":"]) { node[":"] = {}; }
        if (!node[":"][paramName]) { node[":"][paramName] = {}; }
        node = node[":"][paramName];
        continue;
      } else {
        throw new Error("invalid param matcher "+part);
      }
    } else { // normal route match
      if (/^[a-zA-Z0-9_]+$/.test(part)) { 
        if (!node[part]) { node[part] = {}; }
        node = node[part];
        continue;
      } else {
        throw new Error("invalid route part "+part);
      }
    }
  }

  // place our listener on the / node of the deepest matched route
  if (!node["/"]) { node["/"] = []; }
  node["/"].push(listener);
  return this;
};

Router.prototype.handle = function(route) {
  // save any args beyond the first one
  var args = Array.prototype.slice.call(arguments,1);

  // param variables matched
  var params = {};

  // clean route and get parts
  route = "/"+route.replace(/\/+$/,"").replace(/^\/+/,""); // trip trailing slash but ensure leading slash
  var parts = route.split("/").slice(1); // split, slicing the first off since we ensured a leading slash

  // follows a path down the route tree, matching the first applicable path
  var node = this._routeTree;
  var i = 0;
  for (; i < parts.length; ++i) {
    var part = parts[i];
    if (part.length <= 0) { // no route or blank route
      continue; 
    } else if (node[part]) { // normal route match
      node = node[part];
      continue;
    } else if (node[":"]) { // if there are param matchers
      var firstNode = null;
      for (var key in node[":"]) {
        if ({}.hasOwnProperty.call(node[":"],key)){
          if (firstNode==null) { firstNode = node[":"][key]; }
          params[key] = part; // attach value to param hash
        }
      }
      if (firstNode) {
        node = firstNode;
        continue;
      } else {
        throw new Error("param matcher fake out?!")
      }
    } else {
      break;
    }
  }

  // call any listeners on "/", if there is no slash then route error?
  if (node["/"]) {
    node["/"].forEach(function(listener){
      // todo: probably shouldn't indiscriminantly try to attach properties to the first param
      if (!args[0]) { args[0] = {}; }
      args[0].route = route;
      args[0].params = params;
      Utils.merge(args[0],params)
      // call handle if the listener has it (such as a Router instance)
      if (listener.handle) {
        args.unshift(parts.slice(i).join('/'));
        listener.handle.apply(listener,args);
      } else {
        listener.apply(this, args);
      }
    });
  } else {
    console.info(this)
    throw new Error("could not route: "+route);
  }

  // save successful route match
  this._currentRoute = route;

  return;
};