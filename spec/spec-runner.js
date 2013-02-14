var fs = require('fs');

var vows = require('vows');
global.assert = require('assert');

// require all files which end in _spec.* in all folders recursively
// onto a hash tree
function requireTree(dir) {
  var obj = {};
  fs.readdirSync(dir).forEach(function(filename){
    
    if (fs.statSync(dir+'/'+filename).isDirectory()){
      obj[filename] = requireTree(dir+'/'+filename);
    } else {
      var filesub = filename.substr(0,filename.lastIndexOf('.'));
      if (!filesub.match(/^.*_spec$/)) { return; }
      filesub = filename.substr(0,filename.lastIndexOf('_'));
      obj[filesub] = require(dir+'/'+filename);
    }
  });
  return obj;
};

vows.describe('midsockets').addBatch(
  requireTree(__dirname)
).export(module);