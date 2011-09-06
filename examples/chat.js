/**
 * @fileoverview Implementation of a Telnet chat server. After running, telnet
 * to port 8080.
 */
var Socket = require("socket").Socket;
var TextStream = require('io').TextStream;

/**
 * Removes the specified items from the array.
 * 
 * @returns {Array}
 */
Array.prototype.remove = function() {
	//TODO inline this to simplify the example
	var a = arguments, l = a.length, what, ax;
	while(l && this.length) {
		what = a[--l];
		while((ax = this.indexOf(what)) != -1) {
			this.splice(ax, 1);
		}
	}
	return this;
};

var clients = [], server = new Socket().bind('localhost', 8080);
while(true) {
	var socket = server.accept(), client = new TextStream(socket.getStream());
	clients.push(client);
	spawn(function() {
		var stream = client, line;
		while((line = stream.readLine()).length) {
			if(line.length > 1) {
				clients.forEach(function(client) {
					client.write(line);
				});
			}
		}
		clients.remove(stream);
	});
}