(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/events.js",function(require,module,exports,__dirname,__filename,process,global){/**
  A small implementation of an Event manager. Other classes can extend this without
  having to call the Events() constructor.

  @class Events
  @constructor
**/

function Events() {
};

module.exports = Events;

Events.prototype.on = function(key, fn) {
  if (this._eventSubscribers===undefined) { this._eventSubscribers = {}; }
  if (!fn && typeof key === 'function') { fn = key; key = ""; }
  if (!this._eventSubscribers[key]) { this._eventSubscribers[key]=[]; }
  this._eventSubscribers[key].push(fn);
  return this;
};

Events.prototype.off = function(key, fn) {
  if (this._eventSubscribers===undefined) { return; }
  if (this._eventSubscribers[key]===undefined) { return; }
  var removalIndex = this._eventSubscribers[key].indexOf(fn);
  if (removalIndex >= 0) {
    this._eventSubscribers[key].splice(removalIndex, 1);
  }
  return this;
};

Events.prototype.emit = function(key)  {
  if (this._eventSubscribers===undefined) { this._eventSubscribers = {} }
  if (this._eventSubscribers[key]) {
    var emitArgs = Array.prototype.slice.call(arguments, 1);
    this._eventSubscribers[key].forEach(function(fn){
      fn.apply(this, emitArgs)
    });
  }
  return this;
};
});

require.define("/utils.js",function(require,module,exports,__dirname,__filename,process,global){/**
  Utility functions

  @class Utils
  @static
**/

var Utils = module.exports = {};

Utils.merge = function(obj) {
  Array.prototype.slice.call(arguments, 1).forEach(function(source) {
    if (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
};

Utils.extends = function(child, parent) { 
  for (var key in parent) {
    if ({}.hasOwnProperty.call(parent, key)) child[key] = parent[key]; 
  } 
  function ctor() { 
    this.constructor = child; 
  } 
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child; 
};

/*
 * Logging
 */

var colorcodes = {
  'black':          '30',
  'red':            '31',
  'green':          '32',
  'yellow':         '33',
  'blue':           '34',
  'magenta':        '35',
  'cyan':           '36',
  'white':          '37',
  'reset':          '39',
  'bright black':   '90',
  'bright red':     '91',
  'bright green':   '92',
  'bright yellow':  '93',
  'bright blue':    '94',
  'bright magenta': '95',
  'bright cya':     '96',
  'bright white':   '97',
  'reset':          '99'
};

Utils.logger = function(code){
  if (code && /^(?:[a-z ]+|[A-Z ]+)$/.test(code)){ code = colorcodes[code.toLowerCase()]; }
  if (!code) { code = '90'; }
  return function(){
    process.stdout.write("\x1b["+code+"m-- ");
    console.log.apply(null,arguments);
    process.stdout.write("\x1b[0m");
  };
};

Utils.log = 
  (process.stdout) ? 
    Utils.logger()
  : console.log;

});

require.define("/app.js",function(require,module,exports,__dirname,__filename,process,global){var inheritance = require('./inheritance');
var Events = require('./events');
var MiddlewarePrototype = require('./middleware_prototype');
var Utils = require('./utils');

/**
  @module midsockets
**/

/**
  App is the base class of different things you can connect into your midsockets
  chain. 

  @class App
  @constructor
**/

function App(){
  var _this = this;
  this._in = function(req,res){ _this._in.handle(req,res); };
  this._out = function(req,res){ _this._out.handle(req,res); };
  this._in.stack = [];
  this._out.stack = [];
  Utils.merge(this._in, MiddlewarePrototype);
  Utils.merge(this._out, MiddlewarePrototype);
  this.initialize.apply(this,arguments);
  return this;
}

module.exports = App;

Utils.extends(App, Events);
App.extend = inheritance.extend;

App.prototype.initialize = function(){};

App.prototype.mount = function(route, app){
  if (typeof route != 'string') {
    app = route;
    route = "/";
  }
  var _this = this;
  this._in.use(route, function(req,res,next){
    // wrap the res.out function to push the route on
    var _resOutOld = res.out;
    res.out = function(req,res) {
      var subroute = req.route.replace(/^[\/]+/,''); // strip leading slashes
      req.route = route + (route.charAt(route.length-1)=='/' ? "" : "/") + subroute;
      _resOutOld.apply(this,arguments);
    };
    app._in(req,res);
  });
  app._out.last(function(req,res,next){
    var subroute = req.route.replace(/^[\/]+/,''); // strip leading slashes
    req.route = route + (route.charAt(route.length-1)=='/' ? "" : "/") + subroute;
    _this._out(req,res);
  });
  return this;
};

App.prototype.child = function(route) {
  var app = new App();
  this.mount(route,app);
  return app;
};
});

require.define("/inheritance.js",function(require,module,exports,__dirname,__filename,process,global){var Utils = require('./utils');

/**
  Methods for implementing backbone style inheritance.

  @class Inheritance
  @static
  @constructor
**/

var Inheritance = module.exports = {};

// base constructor
Inheritance.Inheritable = function(options) {
  this.initialize.apply(this, arguments);
};

// override this
Inheritance.Inheritable.prototype.initialize = function(){};

// extend function as seen in backbone.js
Inheritance.extend = function(protoProps, staticProps) {
  var parent = this;
  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent's constructor.
  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ parent.apply(this, arguments); };
  }

  // Add static properties to the constructor function, if supplied.
  Utils.merge(child, parent, staticProps);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function.
  var Surrogate = function(){ this.constructor = child; };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate;

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) Utils.merge(child.prototype, protoProps);

  // Set a convenience property in case the parent's prototype is needed
  // later.
  child.__super__ = parent.prototype;

  return child;
};
});

require.define("/middleware_prototype.js",function(require,module,exports,__dirname,__filename,process,global){/**
  This becomes the prototype of every middleware function.
  This pattern was taken from the connect middleware.

  @class MiddlewarePrototype
  @static
**/

var MiddlewarePrototype = module.exports = {}

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
        if (process && process.nextTick) {
          process.nextTick(function(){ throw err; }) 
        } else {
          setTimeout((function(){ throw err; }),0);
        }
      } else {
        throw new Error("unresolved midsockets request with route: "+req.route);
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
});

require.define("/promises/request_client.js",function(require,module,exports,__dirname,__filename,process,global){var DeferredRequest = require('./deferred_request')

/**
  @module midsockets
  @submodule Promises
**/

/**
  Implements the same request methods as RequestClient. By pasing a route parameter,
  this object will map requested routes as relative to the passed route.

  @class RequestGhost
  @constructor
  @param {String}       route   The route to mount onto
  @param {RequestGhost} parent  The parent RequestGhost or RequestClient to send requests to
**/

var RequestGhost = (function(){

  function RequestGhost(route, parent){
    this.parent = parent;
    // ensure trailing slash
    route = (route.charAt(route.length-1)=='/'?route:route+'/');
    this.route = route;
  };

  RequestGhost.prototype.get = function(route){
    route = route.replace(/^[\/]+/,''); // strip leading slashes
    return this.parent.get(this.route+route);
  };
  RequestGhost.prototype.post = function(route,data){
    route = route.replace(/^[\/]+/,''); // strip leading slashes
    return this.parent.post(this.route+route,data);
  };
  RequestGhost.prototype.requester = function(route){
    route = route.replace(/^[\/]+/,''); // strip leading slashes
    return this.parent.requester(this.route+route);
  };

  return RequestGhost;

})();

/**
  Implements the same request methods as RequestClient. By pasing a route parameter,
  this object will map requested routes as relative to the passed route.

  @class RequestClient
  @constructor
  @param {Object} options
  @param {App}    options.app The parent app to listen on
**/

module.exports = (function(){
  
  /*
   * constructor
   */
  function RequestClient(options) {
    this.app = options.app;
    this._requestPromises = {};
    this.app._in.last(requestMiddleware(this));
  }

  var requestMiddleware = function(_this){
    return function(req,res,next){
      if (req.req_id) {
        _this.handle(req,res,next);
      } else {
        next();
      }
    };
  };

  RequestClient.prototype.handle = function(req,res,next){
    if (!this._requestPromises[req.req_id]) {
      throw new Error("recieved unknown request id "+req.req_id);
    }
    this._requestPromises[req.req_id].handle(req,res,next);
    if (!req.subscribed) {
      delete this._requestPromises[req.req_id];
    }
  };

  RequestClient.prototype.get = function(route){
    return this.post(route,null);
  };

  RequestClient.prototype.post = function(route,data){
    var def = new DeferredRequest();
    var req_id = uuid.v1();
    this._requestPromises[req_id] = def;
    this.app._out({route:route,data:data,req_id:req_id},{});
    return def.promise;
  };

  RequestClient.prototype.requester = function(route){
    return new RequestGhost(route,this);
  };

  return RequestClient;

})();
});

require.define("/promises/deferred_request.js",function(require,module,exports,__dirname,__filename,process,global){var Utils = require('../utils');
var Events = require('../events');
var Deferred = require('./deferred');

/**
  @module midsockets
  @submodule Promises
**/

var eventedMiddleware = function(_this){
  return function(req,res,next){
    if (typeof req.eventName == 'string') {
      var emitArgs = req.data.args;
      emitArgs.unshift(req.eventName);
      _this.emit.apply(_this,emitArgs);
    } else if (req.err) {
      _this.reject(req.err);
    } else {
      _this.fulfill(req.data);
    }
  };
};

/**
  A Deferred object which wraps requests. The return result of
  the request methods is the promise created by a DeferredRequest.

  @class DeferredRequest
  @constructor
**/

function DeferredRequest() {
  DeferredRequest.__super__.constructor.apply(this, arguments);
  this.emit = Events.prototype.emit.bind(this);
  this.promise.on = Events.prototype.on.bind(this);
  this.promise.off = Events.prototype.off.bind(this);
  this.handle = eventedMiddleware(this);
};

Utils.extends(DeferredRequest, Deferred);

module.exports = DeferredRequest;
});

require.define("/promises/deferred.js",function(require,module,exports,__dirname,__filename,process,global){/**
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
});

require.define("/sockjs-client.js",function(require,module,exports,__dirname,__filename,process,global){var Utils = require('./utils');
var App = require('./app');

/**
  Creates and listens to a Sockjs client connection, and acts as an
  App to attach other apps and middleware.

  @class SockjsClient
  @constructor
  @param {Object} options
  @param {String} options.url The url of the midsockets server
**/
function SockjsClient(options) {
  if (!options.url) { 
    throw new Error("midsockets requires a connection url"); 
  }
  SockjsClient.__super__.constructor.apply(this, arguments);
  var _this = this;
  this.sock = new SockJS(options.url);
  this._buffer = [];  
  this.sock.onopen = function(){
    console.info('midsockets.Apps.SockjsClient :: opened '+options.url);
    _this._buffer.forEach(function(message){
      _this.sock.send(message);
    });
    _this._buffer = [];
  };
  this.sock.onclose = function(){ console.info('midsockets.Apps.SockjsClient :: closed '+options.url); };
  this.sock.onmessage = function(e){ 
    if (!e) { throw new Error("midsockets.SockApp :: Strange Message of 'undefined'"); }
    if (e.type !== "message") { throw new Error("midsockets.SockApp :: Strange Message of type: '"+e.type+"'"); }
    try {
      var parsed = JSON.parse(e.data);
    } catch(err) {
      throw new Error("midsockets.SockApp :: Could not parse message data: '"+e.data+"'");
    }
    _this._in(parsed, {});
  };
  this._out.last(function(req,res,next){
    if (_this.sock.readyState===1) { // open
      _this.sock.send(JSON.stringify(req));
    } else {
      _this._buffer.push(JSON.stringify(req));
    }
  });
  return this;
};

module.exports = SockjsClient;

Utils.extends(SockjsClient, App);


SockjsClient.prototype.requestClient = function(){
  if (arguments.length > 0) { throw new Error("Arguments are not supported for SockjsClient#requestClient"); }
  return new midsockets.RequestClient({app: this});
};
});

require.define("/midsockets-client.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * midsockets-client
 */

window.midsockets = (function(){

  // creates an instance of SockjsClient

  function midsockets(options) {
    if (typeof options == "string") { options = {url: options}; }
    return new midsockets.SockjsClient(options);
  }

  // other exports

  midsockets.Events = require('./events');
  midsockets.Utils = require('./utils');
  midsockets.App = require('./app');
  midsockets.RequestClient = require('./promises/request_client');
  midsockets.SockjsClient = require('./sockjs-client');

  return midsockets;

})();
});
require("/midsockets-client.js");
})();
