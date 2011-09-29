var http = require('http');
var Buffer = require('buffer').Buffer;

http.createServer(function(req, res) {
	var n = 1024, b = new Buffer(n);
	for( var i = 1; i < 50; i++) {
		b = new Buffer(n);
		b.fill(0);
  }
	res.writeHead(200, {
		"Content-Type": "text/plain"
	});
	res.end(b);
}).listen(8080);
