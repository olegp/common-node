var http = require('http');
var jsgi = require('../lib/jsgi').jsgi;

exports.testServer = function() {
	http.createServer(jsgi(function(request) {
		return {
			status: 200,
			headers: {
				"Content-Type": "text/plain"
			},
			body: request.input
		};
	})).listen(8080);
};

if (require.main == module) {
	require("../lib/test").run(exports);
}
