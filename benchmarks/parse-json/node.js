var http = require('http');
var json = require('./common').json;
var jsonBuffer = new Buffer(json);

http.createServer(function(req, res) {
	JSON.parse(json);
	res.writeHead(200, {
		"Content-Type": "text/plain"
	});
	res.end(jsonBuffer);
}).listen(8080);
