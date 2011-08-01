var ByteArray = require('binary').ByteArray;

var n = 1024;
var b = new ByteArray(n);
for( var i = 0; i < n; i++)
	b[i] = 100;

exports.app = function(request) {
	return {
		status: 200,
		headers: {
			"Content-Type": "text/plain"
		},
		body: [b]
	};
};
