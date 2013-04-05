var http = require('http');

http.createServer(function(req, res) {
  setTimeout(function() {
    res.writeHead(200);
    res.end();
  }, 20);
}).listen(8080);