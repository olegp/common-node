/**
 * @fileoverview Implementation of a Telnet chat server. After running, telnet
 * to port 8080.
 */
var Socket = require('socket').Socket;

var clients = [], server = new Socket().bind('localhost', 8080);
while(true) {
	var client = server.accept().getStream();
	clients.push(client);
	spawn(function() {
		var stream = client, line;
		while((line = stream.read(null)).length) {
			clients.forEach(function(client) {
				if(stream != client) {
					client.write(line);
				}
			});
		}
		clients.splice(clients.indexOf(stream), 1);
	});
}