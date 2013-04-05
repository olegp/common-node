var http = require('http');
var Buffer = require('buffer').Buffer;

var m = 128;
var n = 1024;
var d = [];
for (var i = 0; i < m; i++) {
  var b = new Buffer(n);
  for (var j = 0; j < n; j++) {
    b[j] = Math.floor(256 * Math.random());
  }
  d.push(b);
}
http.createServer(function(req, res) {
  res.writeHead(200, {"Content-Type":"text/plain"});
  d.forEach(function(b) {
    res.write(b);
  });
  res.end();
}).listen(8080);

