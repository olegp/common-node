var sleep = require('system').sleep;

exports.app = function() {
	sleep(100);
	return {
		status: 200,
		headers: {},
		body: []
	};
};
