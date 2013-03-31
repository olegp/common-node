var http = require('http');
var fs = require('fs');

http.createServer(function(req, res) {
  res.writeHead(200, {"Content-Type":"text/plain"});
  var input = fs.createReadStream('../README.md').on('error', function() {
    res.end();
  }).on('end', function() {
    res.end();
  }).on('close', function() {
    res.end();
  }).on('readable', function() {
    res.write(input.read());
  });
}).listen(8080);