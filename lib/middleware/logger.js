/**
  @module midsockets
**/

/**
  @class Middleware
  @static
**/

/**
  Function to generate a middleware which outputs all midsockets requests
  in the format:

      tag req.route

  @method logger
  @param  {String}   tag
  @return {Function} the middleware
**/

function logger(tag) {
  return function(req,res,next) {
    var line = '\033[90m'
      + tag + ' ' + req.route + ' '
      + '\033[0m';
    process.stdout.write(line+"\n");
    next();
  };
}

module.exports = logger;