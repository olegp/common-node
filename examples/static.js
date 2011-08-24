/**
 * @fileOverview Serve a static file from disk. The source code of the current
 *               module, i.e. this file is served.
 */

var openRaw = require('fs-base').openRaw;

exports.app = function(request) {
	return {
		status: 200,
		headers: {},
		body: openRaw(module.filename)
	};
};
