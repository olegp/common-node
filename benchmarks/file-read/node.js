var http = require('http');
var fs = require('fs');
var Buffer = require('buffer').Buffer;

fs.writeFileSync('test.dat', new Buffer(128 * 1024));
http.createServer(function(req, res) {
  res.writeHead(200, {"Content-Type":"text/plain; charset=utf-8'"});
  res.end(fs.readFileSync('test.dat'));
}).listen(8080);