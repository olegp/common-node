var HttpClient = require('../lib/httpclient').HttpClient;

exports.app = function() {
  var body = new HttpClient({url: 'http://google.com'}).finish().body;
  return { status : 200, headers : {}, body: body };
}

if (require.main === module) {
  require('../lib/jsgi').run(exports);
}
