/**
 * @fileOverview HTTP proxy example. Proxies responses from Google. Note that
 *               rather than first getting the response, storing it in a string
 *               and then passing it on, we are using the Stream directly and
 *               are piping data through as it arrives without unnecessary
 *               buffering.
 */

var HttpClient = require('httpclient').HttpClient;

exports.app = function(request) {
	return {
		status: 200,
		headers: {},
		body: new HttpClient({
			url: 'http://google.com'
		}).finish().body
	};
};
