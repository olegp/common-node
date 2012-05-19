/**
 * @fileoverview Socket class as defined in the [CommonJS
 * Sockets/A](http://wiki.commonjs.org/wiki/Sockets/A) proposal.
 */
var Fiber = require('fibers');
var net = require('net');
var io = require('./io');

exports.Socket = Socket;

var families = {
	AF_INET: "tcp4",
	AF_INET6: "tcp6",
	AF_UNIX: "unix"
};

/**
 * The Socket class is used to create a blocking socket.
 * 
 * @constructor
 * @this {Socket}
 * @param family AF_INET (default), AF_INET6 or AF_UNIX
 * @param type SOCK_STREAM for TCP (default) or SOCK_DGRAM for UDP
 */
function Socket(family, type) {
	if(!(this instanceof Socket))
		return new Socket(family, type);

	if(family instanceof net.Socket) {
		this.client = family;
	} else {
		this.type = families[type];
		this.guts = {};
	}
}

/**
 * Initiate a connection on a socket. Connect to a remote port on the specified
 * host with a connection timeout. Throws an exception in case of failure.
 * 
 * @param host IP address or hostname
 * @param port port number or service name
 * @param timeout timeout value (default X microseconds)
 */
Socket.prototype.connect = function(host, port, timeout) {
	var fiber = Fiber.current;
	// TODO Unix sockets
	// TODO UDP sockets
	// TODO TLS sockets
	var client = this.client = net.createConnection(port, host);
	client.on('connect', function() {
		fiber.run();
	});
	client.on('error', function(error) {
		fiber.run(error);
	});
	var result = Fiber.yield();
	if(result instanceof Error) {
		throw new Error(result.message);
	}
	return this;
};

/**
 * When a new socket is created, it has no address bound to it. Bind assigns the
 * specified address (also known as name) to the socket. Throws an exception in
 * case of failure.
 * 
 * @param host address (interface) to which the socket will be bound. If address
 * is omitted, any address is will match.
 * @param port port number or service name to which socket is to be bound. If
 * port is undefined, the socket wont bind to any port.
 */
Socket.prototype.bind = function(host, port) {
	var server = this.server = net.createServer();
	var fiber = Fiber.current;
	server.on('error', function(error) {
		// on error EADDRINUSE
		fiber.run(error);
	});
	// TODO leave out port or host to use defaults / random
	server.listen(port, host, function() {
		fiber.run();
	});
	// TODO add a listener to queue up connections until accept is called
	var result = Fiber.yield();
	if(result instanceof Error) {
		throw new Error(result.message);
	}
	return this;
};

//TODO add functions to retrieve port and hostname the socket is bound to

/**
 * Accept a connection on a socket. Returns a new (connected) Socket.
 */
Socket.prototype.accept = function() {
	// TODO grab an already accepted connection if there are any?
	var fiber = Fiber.current;
	var onconnection = function(socket) {
		fiber.run(socket);
	};
	this.server.on('connection', onconnection);
	var result = Fiber.yield();
	this.server.removeListener('connection', onconnection);
	return new Socket(result);
};

/**
 * Listen for incoming connections on a socket (use before an accept). Throws an
 * exception in case of failure.
 */
Socket.prototype.listen = function() {
	// TODO figure out what the purpose of this is?
	return this;
};

/**
 * Shut down part of a full-duplex connection on a socket. If [what] is SHUT_RD,
 * further receives will be disallowed. If [what] is SHUT_WR further sends will
 * be disallowed. If what is SHUT_RDWR, further sends and receives will be
 * disallowed.
 * 
 * @param what SHUT_RD, SHUT_WR or SHUT_RDWR
 */
Socket.prototype.shutdown = function(what) {
	// ???
};

/**
 * Close the socket immediately
 */
Socket.prototype.close = function() {
	// socket.end([data], [encoding]);
	// socket.destroy();
};

Socket.prototype.getStream = function() {
	if(!this.stream) {
		this.stream = new io.Stream(this.client || this.server);
	}
	return this.stream;
};

/**
 * Receive a block of bytes from the socket. Returns block of bytes read.
 * 
 * @param maxlen number of bytes to read. Default: X bytes
 */
Socket.prototype.read = function(maxlen) {
	return this.getStream().read(maxlen);
};

/**
 * Receive a block of bytes from the socket. Returns block of bytes read. May
 * receive fewer bytes than requested even if the end of the stream hasn’t been
 * reached.
 * 
 * @param maxlen number of bytes to read. Default: X bytes
 */
Socket.prototype.receive = function(maxlen) {
	// TODO no clear what to do here, but the solution below is clearly broken; we
	// could just deprecate this method
	return this.getStream().read(null);
};

/**
 * Send a block of bytes to the socket.
 * 
 * @param data block of bytes to send
 */
Socket.prototype.send = function(data) {
	// socket.write(data, [encoding], [callback])
	// socket.write(data, [encoding], [fileDescriptor], [callback])
	// TODO deal with the fileDescriptor case
	this.getStream().write(data);
	return this;
};

/**
 * Send a block of bytes to the socket. May send only a part of the data even if
 * the peer hasn’t closed connection.
 * 
 * @param data block of bytes to send
 */
Socket.prototype.write = function(data) {
	// socket.write(data, [encoding], [callback])
	// socket.write(data, [encoding], [fileDescriptor], [callback])
	// TODO deal with the fileDescriptor case
	// TODO this is clearly broken - we could just deprecate this method
	this.getStream().write(data);
	return this;
};

/**
 * Receive all data from socket. Returns object with ip_address and port of
 * sender along with data properties.
 * 
 * @param maxlen number of bytes to read. Default: X bytes
 */
Socket.prototype.receiveFrom = function(maxlen) {
	// UDP?
};

/**
 * Send a block of data to a specific host and port.
 * 
 * @param host IP address or hostname
 * @param port port number or service name
 * @param data block of bytes to send
 */
Socket.prototype.sendTo = function(host, port, data) {
	// UDP?
};

/**
 * Sends a complete File object across a socket.
 * 
 * @param file a File object
 * @deprecated
 */
Socket.prototype.sendFile = function(file) {
	throw new Error('sendFile is deprecated');
};

/**
 * Set socket option value to socket option name.
 * 
 * @param option
 * @param value
 */
Socket.prototype.setOption = function(option, value) {
	this.guts[option] = value;
	return this;
};

/**
 * Get socket option value, option should be socket option name.
 */
Socket.prototype.getOption = function() {
	return this.guts[option];
};
