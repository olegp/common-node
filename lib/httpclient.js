/**
 * @fileoverview HTTP Client as defined in [CommonJS HTTP
 * Client/A](http://wiki.commonjs.org/wiki/HTTP_Client/A).
 */
var Fiber = require('fibers');

var protocols = {
	http: require('http'),
	https: require('https')
};
var Stream = require('./io').Stream;

var ports = {
	http: 80,
	https: 443
};

exports.HttpClient = HttpClient;

/*
 * parseUri JS v0.1.1, by Steven Levithan <http://stevenlevithan.com> Splits any
 * well-formed URI into the following parts (all are optional):
 * ---------------------- - source (since the exec method returns the entire
 * match as key 0, we might as well use it) - protocol (i.e., scheme) -
 * authority (includes both the domain and port) - domain (i.e., host; can be an
 * IP address) - port - path (includes both the directory path and filename) -
 * directoryPath (supports directories with periods, and without a trailing
 * backslash) - fileName - query (does not include the leading question mark) -
 * anchor (i.e., fragment)
 */
/** @ignore */
function parseUri(sourceUri) {
	var uriPartNames = ["source", "protocol", "authority", "domain", "port",
			"path", "directoryPath", "fileName", "query", "anchor"], uriParts = new RegExp(
			"^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?")
			.exec(sourceUri), uri = {};

	for( var i = 0; i < 10; i++) {
		uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
	}

	/*
	 * Always end directoryPath with a trailing backslash if a path was present in
	 * the source URI Note that a trailing backslash is NOT automatically inserted
	 * within or appended to the "path" key
	 */
	if(uri.directoryPath.length > 0) {
		uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
	}

	return uri;
}

/**
 * If called as a simple function, then return a new HTTPClient(settings). Set
 * all protected members to the default values. If a settings object is
 * included, call this.set(settings).
 * 
 * @constructor
 * @this {HttpClient}
 * @param settings the settings object
 */
function HttpClient(settings) {
	if(!(this instanceof HttpClient))
		return new HttpClient(settings);
	/** @ignore */
	this.guts = {};
	this.create();
	if(settings)
		this.setOptions(settings);
}

/** @ignore */
HttpClient.prototype.create = function() {
	this.setOptions({
		"method": "GET",
		"headers": {},
		"body": []
	});
	return this;
};

/** @ignore */
HttpClient.prototype.setOptions = function(settings) {
	for( var key in settings)
		if(settings.hasOwnProperty(key)) {
			this.setOption(key, settings[key]);
		}
	return this;
};

/**
 * Set the body, headers, method, or url, or any combination thereof in the
 * settings object. Attribute validity is enforced.
 * 
 * @param key one of body, headers, method or url
 * @param val the value to set
 */
HttpClient.prototype.set = HttpClient.prototype.setOption = function(key, val) {
	switch(key) {
	case "headers":
		if(typeof val !== 'object')
			throw new Error("HttpClient: headers must be a simple object.");
		return this.setHeaders(val);
	case "body":
		if(typeof val.forEach !== 'function')
			throw new Error("HttpClient: body must be iterable.");
		// fallthrough
	default:
		this.guts[key] = val;
	}
	return this;
};

/**
 * Set a bunch of headers expressed as name-value pairs.
 * 
 * @param headers headers to set
 */
HttpClient.prototype.setHeaders = function(headers) {
	for( var h in headers)
		if(headers.hasOwnProperty(h)) {
			this.setHeader(h, headers[h]);
		}
	return this;
};

/**
 * Set a header on the header object in a case-insensitive manner. That is, if
 * the user sets "content-type", and then later sets "Content-Type", then the
 * first setting is lost.
 * 
 * @param {String} key header name
 * @param {String} val header value
 */
HttpClient.prototype.setHeader = function(key, val) {
	if(!this.guts.hasOwnProperty("headers"))
		this.guts.headers = {};
	this.guts.headers[key] = val;
	return this;
};

/**
 * Append data to the outgoing request, that is, to the iterable body object.
 * This method returns an error if a body was provided earlier via settings that
 * does not implement push.
 * 
 * @param data {Binary} object to write
 */
HttpClient.prototype.write = function(data) {
	var len = this.guts.headers["Content-Length"] || 0;
	len += data.length;
	this.guts.headers["Content-Length"] = len;
	if(!this.guts.body.push)
		throw new Error("body does not have push()");
	this.guts.body.push(data);
	return this;
};

/**
 * Open the connection to the URL using the method supplied. If the method or
 * url is missing, throw an error. After connecting, write() will have no
 * effect.
 */
HttpClient.prototype.connect = function() {
	// TODO move part of read() in here
	return this;
};

/**
 * Read the request and return a JSGI-style object consisting of
 * {status:Integer, headers:Object, body:Iterable<ByteString>}. Calling read()
 * does not block the application until the request is completed, but it does
 * open the input stream such that the data can be read.
 */
HttpClient.prototype.read = function() {
	var fiber = Fiber.current;
	var uri = parseUri(this.guts.url);
	var path = uri.path || '/';
	if(uri.query) {
		path += '?' + uri.query;
	}
	var options = {
		method: this.guts.method,
		host: uri.domain,
		port: uri.port || ports[uri.protocol],
		path: path,
		headers: this.guts.headers
	};
	var req = protocols[uri.protocol].request(options, function(response) {
		fiber.run(response);
	});
	var timeout = this.guts.timeout || 0;
  req.setTimeout(timeout, function() {
    req.abort();
  });
	req.on('error', function(error) {
		fiber.run(error);
	});
	this.guts.body.forEach(function(block) {
		req.write(block.buffer || block);
	});
	req.end();

	var result = Fiber.yield();
	if(result instanceof Error)
		throw new Error(result.message);
	return {
		status: result.statusCode,
		headers: result.headers,
		body: new Stream(result)
	};
};

/**
 * Alias for .connect().read()
 */
HttpClient.prototype.finish = function() {
	return this.connect().read();
};
