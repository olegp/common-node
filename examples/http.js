var HttpClient = require('../lib/httpclient').HttpClient;

exports.app = function(request) {
	return {
			status : 200,
			headers : {},
			body : new HttpClient({url: 'http://google.com'}).finish().body
  };
}

if (require.main === module) {
  require('../lib/jsgi').run(exports);
}
