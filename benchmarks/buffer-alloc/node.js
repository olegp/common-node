var http = require('http');
var Buffer = require('buffer').Buffer;

http.createServer(function (req, res) {
  var n = 1024, b;
  for (var i = 1; i <= 50; i++)
      b = new Buffer(n);
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end(b);
}).listen(8080);

