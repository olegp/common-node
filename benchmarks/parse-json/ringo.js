var json = require('./common').json;

exports.app = function(request) {
	JSON.parse(json);
	var response = {
		status: 200,
		headers: {
			"Content-Type": "text/plain"
		},
		body: [json]
	};
	return response;
};

if(require.main === module) {
	require("ringo/httpserver").main(module.id);
}
