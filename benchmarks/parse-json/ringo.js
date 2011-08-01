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

if(require.main === module) {
	require("ringo/httpserver").main(module.id);
}
