var ByteArray = require('binary').ByteArray;

var n = 128 * 1024;
var b = new ByteArray(n);
for (var i = 0; i < n; i++) {
  b[i] = Math.floor(32 + (127 - 32) * Math.random());
}
exports.app = function(request) {
  return {
    status:200,
    headers:{
      "Content-Type":"text/plain"
    },
    body:[b.decodeToString("ascii")]
  };
};
