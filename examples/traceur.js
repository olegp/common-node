var {HttpClient} = require('httpclient');

console.log(new HttpClient({
	url: 'http://google.com'
}).finish().body.read(null).decodeToString());