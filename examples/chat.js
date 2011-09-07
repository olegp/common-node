/**
 * @fileoverview Implementation of a Telnet chat server. After running, telnet
 * to port 8080.
 */

var server = new require('socket').Socket().bind('localhost', 8080), clients = [], client;
while(clients.push(client = server.accept().getStream())) {
	spawn(function() {
		for( var stream = client, line; (line = stream.read(null)).length;) {
			clients.forEach(function(c) {
				(stream == c) || c.write(line);
			});
		}
		clients.splice(clients.indexOf(stream), 1);
	});
}
