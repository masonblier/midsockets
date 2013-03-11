/**
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
    process.stdout.write("\x1b["+code+"m");
    console.log.apply(null,arguments);
    process.stdout.write("\x1b[0m");
  };
};

Utils.log = 
  (process.stdout) ? 
    Utils.logger()
  : console.log;
