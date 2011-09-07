/**
 * @fileoverview Implementation of a Telnet chat server. After running, telnet
 * to port 8080.
 */
var Socket = require('socket').Socket;
var TextStream = require('io').TextStream;

var clients = [], server = new Socket().bind('localhost', 8080);
while(true) {
	var socket = server.accept(), client = new TextStream(socket.getStream());
	clients.push(client);
	spawn(function() {
		var stream = client, line;
		while((line = stream.readLine()).length) {
			if(line.length > 1) {
				clients.forEach(function(client) {
					if(stream != client) {
						client.write(line);
					}
				});
			}
		}
		clients.splice(clients.indexOf(stream), 1);
	});
}