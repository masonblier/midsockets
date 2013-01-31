/*
 * middleware app prototype
 */

module.exports = (function(){

  MiddlewarePrototype = {}

  MiddlewarePrototype.use = function(route,fn){
    if ('string' != typeof route) {
      fn = route;
      route = '/';

    }
    if ('/' == route[route.length - 1]) {
      route = route.slice(0, -1);
    }
    this.stack.push({route:route,handle:fn});

    return this;
  };

  MiddlewarePrototype.last = function(fn){
    this._last = fn;
    return this;
  };

  MiddlewarePrototype.handle = function(req,res,out){
    var stack = this.stack
      , _last = this._last
      , removed = ''
      , index = 0;

    function next(err,msg) {
      var path, layer, c;

      req.route = removed + req.route;
      req.originalRoute = req.originalRoute || req.route;
      removed = '';

      var layer = stack[index++];

      if (_last && !layer) {
        layer = {
          route: '/',
          handle: _last
        };
        _last = undefined;
      }

      if (!layer) {
        if (out) return out(err);
        if (err) {
          console.error("\x1B[31m"+err.message+"\n"+err.stack)
        } else {
          console.info("unresolved request",req);
        }
        return;
      }

      try {
        path = req.route || '/';

        if (0 != path.toLowerCase().indexOf(layer.route.toLowerCase())) return next(err);
        if (layer.route.length > 1) {
          c = path[layer.route.length];
          if (c && '/' != c && '.' != c) return next(err);
      
          removed = layer.route;
          req.route = req.route.substr(removed.length);
        }

        var arity = layer.handle.length;
        if (err) {
          if (arity === 4) {
            layer.handle(err, req, res, next);
          } else {
            next(err);
          }
        } else if (arity < 4) {
          layer.handle(req, res, next);
        } else {
          next();
        }
      } catch (e) {
        next(e);
      }
    };
    next();
  };

  return MiddlewarePrototype;

})();