var HttpClient = require('httpclient').HttpClient;
var TextStream = require('io').TextStream;
// var spawn = require('system').spawn;
var encode = function() {
}; // require('./base64').encode;

var user = '', pass = '';
var url = 'http://127.0.0.1/1/statuses/filter.json';
var headers = {
	'Authorization': 'Basic ' + encode(user + ':' + pass),
	'Content-Type': 'application/x-www-form-urlencoded'
};
var body = ['track=test'];

var client = new HttpClient({
	method: 'POST',
	url: url,
	headers: headers,
	body: body,
	timeout: 10000
});
var stream = new TextStream(client.finish().body);

var line;
for(;;) {
	line = stream.readLine();
	if(!line.length)
		break;
	if(line.length > 1) {
		var message = JSON.parse(line);
		console.log(message.text);
	}
}