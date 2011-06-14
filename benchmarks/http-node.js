var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {});
  http.get({host: 'google.com', port: 80, path: '/'}, function(r) {
    var chunks = [];
    r.on('data', function (chunk) {
      chunks.push(chunk);
    });
    r.on('end', function() {
      chunks.forEach(function(chunk) {
        res.write(chunk);
      });
      res.end();
    });
  });
}).listen(8080);
