exports.app = function() {
	var response = {
		status: 200,
		headers: {
			'Content-Type': 'text/plain'
		},
		body: ['Hello World!\n']
	};
	return response;
};

if(require.main === module) {
	require("ringo/httpserver").main(module.id);
}
