/**
 * @fileOverview Hello World example.
 */

exports.app = function(request) {
	return {
		status: 200,
		headers: {},
		body: ['Hello World!\n']
	};
};