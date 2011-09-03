/**
 * @fileOverview HTTP proxy example. Note that rather than first getting the
 * response, storing it in a string and then passing it on, we are using the
 * Stream directly and are piping data through as it arrives without unnecessary
 * buffering.
 */

var HttpClient = require('httpclient').HttpClient;

exports.app = function(req) {
	req.url = 'http://nodejs.org';
	return new HttpClient(req).finish();
};
