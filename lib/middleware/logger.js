/*
 * middleware to log each request
 */

module.exports = (function(){

  return function logger(display_tag) {
    return function(req,res,next) {
      var line = '\033[90m'
        + display_tag + ' ' + req.route + ' '
        + '\033[0m';
      process.stdout.write(line+"\n");
      next();
    };
  };

})();