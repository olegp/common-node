var ByteArray = require('binary').ByteArray;

exports.app = function(request) {
	var n = 1024, b = new ByteArray(n);
	for( var i = 1; i < 50; i++)
		b = new ByteArray(n, true);
	return {
		status: 200,
		headers: {
			"Content-Type": "text/plain"
		},
		body: [b]
	};
};
