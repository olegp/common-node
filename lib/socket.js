/**
 * @fileoverview Socket class as defined in the [CommonJS
 * Sockets/A](http://wiki.commonjs.org/wiki/Sockets/A) proposal.
 */

exports.Socket = Socket;

/**
 * The Socket class is used to create a blocking socket.
 * 
 * @constructor
 * @this {Socket}
 * @param family AF_INET (default), AF_INET6 or AF_UNIX
 * @param type SOCK_STREAM for TCP (default) or SOCK_DGRAM for UDP
 */
function Socket(family, type) {

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

};

/**
 * Accept a connection on a socket. Returns a new (connected) Socket.
 */
Socket.prototype.accept = function() {

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

};

/**
 * Listen for incoming connections on a socket (use before an accept). Throws an
 * exception in case of failure.
 */
Socket.prototype.listen = function() {

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

};

/**
 * Close the socket immediately
 */
Socket.prototype.close = function() {

};

/**
 * Receive a block of bytes from the socket. Returns block of bytes read. May
 * receive fewer bytes than requested even if the end of the stream hasn’t been
 * reached.
 * 
 * @param maxlen number of bytes to read. Default: X bytes
 */
Socket.prototype.read = Socket.prototype.receive = function(maxlen) {

};

/**
 * Send a block of bytes to the socket. May send only a part of the data even if
 * the peer hasn’t closed connection.
 * 
 * @param data block of bytes to send
 */
Socket.prototype.send = Socket.prototype.write = function(data) {

};

/**
 * Receive all data from socket. Returns object with ip_address and port of
 * sender along with data properties.
 * 
 * @param maxlen number of bytes to read. Default: X bytes
 */
Socket.prototype.receiveFrom = function(maxlen) {

};

/**
 * Send a block of data to a specific host and port.
 * 
 * @param host IP address or hostname
 * @param port port number or service name
 * @param data block of bytes to send
 */
Socket.prototype.sendTo = function(host, port, data) {

};

/**
 * Sends a complete File object across a socket.
 * 
 * @param file a File object
 * @deprecated
 */
Socket.prototype.sendFile = function(file) {

};

/**
 * Set socket option value to socket option name.
 * 
 * @param option
 * @param value
 */
Socket.prototype.setOption = function(option, value) {

};

/**
 * Get socket option value, option should be socket option name.
 */
Socket.prototype.getOption = function() {

};
