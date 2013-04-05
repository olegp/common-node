var http = require('http');
var Buffer = require('buffer').Buffer;

var n = 128 * 1024;
http.createServer(function(req, res) {
  var b = new Buffer(n);
  b.fill(0);
  res.writeHead(200, {
    "Content-Type":"text/plain"
  });
  res.end(b);
}).listen(8080);