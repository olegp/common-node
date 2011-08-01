var json = require('./common').json;

exports.app = function(request) {
	JSON.parse(json);
	return {
		status: 200,
		headers: {
			"Content-Type": "text/plain"
		},
		body: [json]
	};
};
