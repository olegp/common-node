var ByteArray = require('binary').ByteArray;

var n = 128 * 1024;
exports.app = function(request) {
  var b = new ByteArray(n);
  return {
    status:200,
    headers:{
      "Content-Type":"text/plain"
    },
    body:[b]
  };
};