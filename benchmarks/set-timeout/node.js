require('connect').createServer(function (req, res, next) {
	setTimeout(function() {
		res.writeHead(200, {});
		res.end();
	}, 100);
}).listen(8080);


