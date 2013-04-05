var ByteArray = require('binary').ByteArray;

var m = 128;
var n = 1024;
var d = [];
for (var i = 0; i < m; i++) {
  var b = new ByteArray(n);
  for (var j = 0; j < n; j++) {
    b[j] = Math.floor(256 * Math.random());
  }
  d.push(b);
}
exports.app = function(request) {
  return {
    status:200,
    headers:{
      "Content-Type":"text/plain"
    },
    body:d
  };
};
