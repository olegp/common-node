var HttpClient = require('httpclient').HttpClient;

exports.app = function(request) {
  return {
      status : 200,
      headers : {},
      body : new HttpClient({url: 'http://google.com'}).finish().body
  };
}
