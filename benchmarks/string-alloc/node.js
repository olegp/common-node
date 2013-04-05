var http = require('http');
var Buffer = require('buffer').Buffer;

var n = 128 * 1024;
var b = new Buffer(n);
for (var i = 0; i < n; i++) {
  b[i] = Math.floor(32 + (127 - 32) * Math.random());
}
http.createServer(function(req, res) {
  res.writeHead(200, {
    "Content-Type":"text/plain"
  });
  res.end(b.toString("ascii"));
}).listen(8080);
