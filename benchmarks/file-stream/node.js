var http = require('http');
var fs = require('fs');
var Buffer = require('buffer').Buffer;

fs.writeFileSync('test.dat', new Buffer(128 * 1024));
http.createServer(function(req, res) {
  res.writeHead(200, {"Content-Type":"text/plain; charset=utf-8"});
  var input = fs.createReadStream('test.dat').on('error', function() {
    res.end();
  }).on('end', function() {
    res.end();
  }).on('close', function() {
    res.end();
  }).on('readable', function() {
    res.write(input.read());
  });
}).listen(8080);