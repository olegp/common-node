var io = require("../io");
var TextStream = io.TextStream, MemoryStream = io.MemoryStream;
var Binary = require("../binary").Binary;
var ByteArray = require("../binary").ByteArray;
var HttpClient = require("../httpclient").HttpClient;

/**
 * Creates a new object as the as the keywise union of the provided objects.
 * Whenever a key exists in a later object that already existed in an earlier
 * object, the according value of the earlier object takes precedence.
 *
 * @param {Object} objs ... The objects to merge
 */
function merge(objs) {
	var result = {};
	for (var i = arguments.length; i > 0; --i) {
		var obj = arguments[i - 1];
		for (var property in obj) {
			result[property] = obj[property];
		}
	}
	return result;
}

/**
 * Encode an object's properties into an URL encoded string.
 *
 * @param {Object}
 *          object an object
 * @returns {String} a string containing the URL encoded properties of the
 *          object
 */
function urlEncode(object) {
	var buf = [];
	var key, value;
	for (key in object) {
		value = object[key];
		if (value instanceof Array) {
			for (var i = 0; i < value.length; i++) {
				if (buf.length)
					buf.push("&");
				buf.push(encodeURIComponent(key), "=", encodeURIComponent(value[i]));
			}
		} else {
			if (buf.length)
				buf.push("&");
			buf.push(encodeURIComponent(key), "=", encodeURIComponent(value));
		}
	}
	return buf.join('');
}

/**
 * Returns an object for use as a HTTP header collection. The returned object
 * provides methods for setting, getting, and deleting its properties in a
 * case-insensitive and case-preserving way.
 *
 * This function can be used as mixin for an existing JavaScript object or as a
 * constructor.
 *
 * @param {Object}
 *          headers an existing JS object. If undefined, a new object is created
 */
function Headers(headers) {
	// when is a duck a duck?
	if (headers && headers.get && headers.set) {
		return headers;
	}

	headers = headers || {};
	var keys = {};
	// populate internal lower case to original case map
	for (var key in headers) {
		keys[String(key).toLowerCase()] = key;
	}

	/**
	 * Get the value of the header with the given name
	 *
	 * @param {String}
	 *          name the header name
	 * @returns the header value
	 * @name Headers.instance.get
	 */
	Object.defineProperty(headers, "get", {
		value:function(key) {
			if (key in this) {
				return this[key];
			} else {
				return (key = keys[key.toLowerCase()]) && this[key];
			}
		}
	});

	/**
	 * Set the header with the given name to the given value.
	 *
	 * @param {String}
	 *          name the header name
	 * @param {String}
	 *          value the header value
	 * @name Headers.instance.set
	 */
	Object.defineProperty(headers, "set", {
		value:function(key, value) {
			// JSGI uses \n as separator for mulitple headers
			value = value.replace(/\n/g, "");
			var oldkey = keys[key.toLowerCase()];
			if (oldkey) {
				delete this[oldkey];
			}
			this[key] = value;
			keys[key.toLowerCase()] = key;
		}
	});

	/**
	 * Add a header with the given name and value.
	 *
	 * @param {String}
	 *          name the header name
	 * @param {String}
	 *          value the header value
	 * @name Headers.instance.add
	 */
	Object.defineProperty(headers, "add", {
		value:function(key, value) {
			// JSGI uses \n as separator for mulitple headers
			value = value.replace(/\n/g, "");
			if (this[key]) {
				// shortcut
				this[key] = this[key] + "\n" + value;
				return;
			}
			var lowerkey = key.toLowerCase();
			var oldkey = keys[lowerkey];
			if (oldkey) {
				value = this[oldkey] + "\n" + value;
				if (key !== oldkey)
					delete this[oldkey];
			}
			this[key] = value;
			keys[lowerkey] = key;
		}

	});

	/**
	 * Queries whether a header with the given name is set
	 *
	 * @param {String}
	 *          name the header name
	 * @returns {Boolean} true if a header with this name is set
	 * @name Headers.instance.contains
	 */
	Object.defineProperty(headers, "contains", {
		value:function(key) {
			return Boolean(key in this || (key = keys[key.toLowerCase()]) && key in this);
		}
	});

	/**
	 * Unsets any cookies with the given name
	 *
	 * @param {String}
	 *          name the header name
	 * @name Headers.instance.unset
	 */
	Object.defineProperty(headers, "unset", {
		value:function(key) {
			key = key.toLowerCase();
			if (key in keys) {
				delete this[keys[key]];
				delete keys[key];
			}
		}
	});

	/**
	 * Returns a string representation of the headers in MIME format.
	 *
	 * @returns {String} a string representation of the headers
	 * @name Headers.instance.toString
	 */
	Object.defineProperty(headers, "toString", {
		value:function() {
			var buffer = new Buffer();
			for (var key in this) {
				this[key].split("\n").forEach(function(value) {
					buffer.write(key).write(": ").writeln(value);
				});
			}
			return buffer.toString();
		}
	});

	return headers;
}

/**
 * Defaults for options passable to to request()
 *
 * @param {Object} options
 */
var prepareOptions = function(options) {
	var defaultValues = {
		"data":{},
		"headers":{},
		"method":"GET",
		"followRedirects":true,
		"binary":false
	};
	var opts = options ? merge(options, defaultValues) : defaultValues;
	Headers(opts.headers);
	opts.contentType = opts.contentType || opts.headers.get("Content-Type")
		|| "application/x-www-form-urlencoded;charset=utf-8";
	return opts;
};

/**
 * Of the 4 arguments to get/post all but the first (url) are optional. This fn
 * puts the right arguments - depending on their type - into the options object
 * which can be used to call request()
 *
 * @param {Array} args Arguments Array
 * @returns {Object<{url, data, success, error}>} Object holding attributes for
 *          call to request()
 */
var extractOptionalArguments = function(args) {
	var types = [];
	for (var key in args) {
		types.push(typeof (args[key]));
	}

	if (types[0] !== 'string') {
		throw new Error('first argument (url) must be string');
	}

	if (args.length === 1) {
		return {
			url:args[0]
		};
	} else if (args.length === 2) {
		if (types[1] === 'function') {
			return {
				url:args[0],
				success:args[1]
			};
		} else {
			return {
				url:args[0],
				data:args[1]
			};
		}
		throw new Error('two argument form must be (url, success) or (url, data)');
	} else if (args.length === 3) {
		if (types[1] === 'function' && types[2] === 'function') {
			return {
				url:args[0],
				success:args[1],
				error:args[2]
			};
		} else if (types[1] === 'object' && types[2] === 'function') {
			return {
				url:args[0],
				data:args[1],
				success:args[2]
			};
		} else {
			throw new Error('three argument form must be (url, success, error) or (url, data, success)');
		}
	}
	throw new Error('unknown arguments');
};

/**
 * @name Exchange
 * @param {String}
 *          url The URL
 * @param {Object}
 *          options The options
 * @param {Object}
 *          callbacks An object containing success, error and complete callback
 *          methods
 * @returns {Exchange} A newly constructed Exchange instance
 * @constructor
 */
var Exchange = function(url, options, callbacks) {
	var reqData = options.data;
	var httpclient = null;
	var url;
	var response;
	var responseContent;
	var responseContentBytes;
	var isDone = false;

	Object.defineProperties(this, {
		/**
		 * The connection used by this Exchange instance
		 *
		 * @name Exchange.prototype.connection
		 */
		"connection":{
			"get":function() {
			},
			"enumerable":true
		},
		/**
		 * True if the request has completed, false otherwise
		 *
		 * @name Exchange.prototype.done
		 */
		"done":{
			"get":function() {
				return isDone;
			},
			enumerable:true
		},
		/**
		 * The response body as String
		 *
		 * @name Exchange.prototype.content
		 */
		"content":{
			"get":function() {
				if (typeof responseContent !== 'undefined') {
					return responseContent;
				}
				return responseContent = this.contentBytes.decodeToString(this.encoding);
			},
			"enumerable":true
		},
		/**
		 * The response body as ByteArray
		 *
		 * @name Exchange.prototype.contentBytes
		 */
		"contentBytes":{
			"get":function() {
				return this.responseContentBytes;
			},
			"enumerable":true
		}
	});

	if ((options.method !== "POST" && options.method !== "PUT") || !(reqData instanceof Binary || reqData instanceof String)) {
		reqData = urlEncode(reqData);
		if (options.method === "POST" || options.method === "PUT") {
			options.headers["Content-Length"] = reqData.length;
		}
		if (typeof (reqData) === "string" && reqData.length > 0) {
			url += "?" + reqData;
		}
	}

	this.httpclient = new HttpClient({
		method:options.method,
		url:url,
		headers:options.headers,
		body:[reqData],
		agent:false
	});

	this.response = this.httpclient.finish();
	this.responseContentBytes = this.response.body.read();
	isDone = true;
	return this;
};

Object.defineProperties(Exchange.prototype, {
	/**
	 * The URL wrapped by this Exchange instance
	 *
	 * @type java.net.URL
	 * @name Exchange.prototype.url
	 */
	"url":{
		"get":function() {
			return this.url;
		},
		"enumerable":true
	},
	/**
	 * The response status code
	 *
	 * @type Number
	 * @name Exchange.prototype.status
	 */
	"status":{
		"get":function() {
			return this.response.status;
		},
		"enumerable":true
	},
	/**
	 * The response status message
	 *
	 * @type String
	 * @name Exchange.prototype.message
	 */
	"message":{
		"get":function() {
		},
		"enumerable":true
	},
	/**
	 * The response headers
	 *
	 * @name Exchange.prototype.headers
	 */
	"headers":{
		"get":function() {
			return this.response.headers;
		},
		enumerable:true
	},
	/**
	 * The cookies set by the server
	 *
	 * @name Exchange.prototype.cookies
	 */
	"cookies":{
		"get":function() {
		},
		enumerable:true
	},
	/**
	 * The response encoding
	 *
	 * @type String
	 * @name Exchange.prototype.encoding
	 */
	"encoding":{
		"get":function() {
		},
		"enumerable":true
	},
	/**
	 * The response content type
	 *
	 * @type String
	 * @name Exchange.prototype.contentType
	 */
	"contentType":{
		"get":function() {
			return this.httpclient.headers["Content-Type"];
		},
		"enumerable":true
	},
	/**
	 * The response content length
	 *
	 * @type Number
	 * @name Exchange.prototype.contentLength
	 */
	"contentLength":{
		"get":function() {
			return this.httpclient.headers["Content-Length"];
		},
		"enumerable":true
	}
});

/**
 * Make a generic request.
 *
 * #### Generic request options
 *
 * The `options` object may contain the following properties:
 *  - `url`: the request URL - `method`: request method such as GET or POST -
 * `data`: request data as string, object, or, for POST or PUT requests, Stream
 * or Binary. - `headers`: request headers - `username`: username for HTTP
 * authentication - `password`: password for HTTP authentication -
 * `contentType`: the contentType - `binary`: if true if content should be
 * delivered as binary, else it will be decoded to string
 *
 * #### Callbacks
 *
 * The `options` object may also contain the following callback functions:
 *  - `complete`: called when the request is completed - `success`: called when
 * the request is completed successfully - `error`: called when the request is
 * completed with an error - `beforeSend`: called with the Exchange object as
 * argument before the request is sent
 *
 * The following arguments are passed to the `complete`, `success` and `part`
 * callbacks: 1. `content`: the content as String or ByteString 2. `status`: the
 * HTTP status code 3. `contentType`: the content type 4. `exchange`: the
 * exchange object
 *
 * The following arguments are passed to the `error` callback: 1. `message`: the
 * error message. This is either the message from an exception thrown during
 * request processing or an HTTP error message 2. `status`: the HTTP status
 * code. This is `0` if no response was received 3. `exchange`: the exchange
 * object
 *
 * @param {Object}
 *          options
 * @returns {Exchange} exchange object
 * @see #get
 * @see #post
 * @see #put
 * @see #del
 */
var request = exports.request = function(options) {
	var opts = prepareOptions(options);
	return new Exchange(opts.url, {
		"method":opts.method,
		"data":opts.data,
		"headers":opts.headers,
		"username":opts.username,
		"password":opts.password,
		"contentType":opts.contentType,
		"followRedirects":opts.followRedirects,
		"binary":opts.binary
	}, {
		"beforeSend":opts.beforeSend,
		"success":opts.success,
		"complete":opts.complete,
		"error":opts.error
	});
};

/**
 * Creates an options object based on the arguments passed
 *
 * @param {String}
 *          method The request method
 * @param {String}
 *          url The URL
 * @param {String|Object|Stream|Binary}
 *          data Optional data to send to the server
 * @param {Function}
 *          success Optional success callback
 * @param {Function}
 *          error Optional error callback
 * @returns An options object
 */
var createOptions = function(method, url, data, success, error) {
	var args = Array.prototype.slice.call(arguments, 1);
	if (args.length < 4) {
		var optArgs = extractOptionalArguments(args);
		var url = optArgs.url, data = optArgs.data, success = optArgs.success, error = optArgs.error;
	}
	return {
		method:method,
		url:url,
		data:data,
		success:success,
		error:error
	};
};

/**
 * Executes a GET request
 *
 * @param {String}
 *          url The URL
 * @param {Object|String}
 *          data The data to append as GET parameters to the URL
 * @param {Function}
 *          success Optional success callback
 * @param {Function}
 *          error Optional error callback
 * @returns The Exchange instance representing the request and response
 * @type Exchange
 */
var get = exports.get = function(url, data, success, error) {
	return request(createOptions("GET", url, data, success, error));
};

/**
 * Executes a POST request
 *
 * @param {String}
 *          url The URL
 * @param {Object|String|Stream|Binary}
 *          data The data to send to the server
 * @param {Function}
 *          success Optional success callback
 * @param {Function}
 *          error Optional error callback
 * @returns The Exchange instance representing the request and response
 * @type Exchange
 */
var post = exports.post = function(url, data, success, error) {
	return request(createOptions("POST", url, data, success, error));
};

/**
 * Executes a DELETE request
 *
 * @param {String}
 *          url The URL
 * @param {Object|String}
 *          data The data to append as GET parameters to the URL
 * @param {Function}
 *          success Optional success callback
 * @param {Function}
 *          error Optional error callback
 * @returns The Exchange instance representing the request and response
 * @type Exchange
 */
var del = exports.del = function(url, data, success, error) {
	return request(createOptions("DELETE", url, data, success, error));
};

/**
 * Executes a PUT request
 *
 * @param {String}
 *          url The URL
 * @param {Object|String|Stream|Binary}
 *          data The data send to the server
 * @param {Function}
 *          success Optional success callback
 * @param {Function}
 *          error Optional error callback
 * @returns The Exchange instance representing the request and response
 * @type Exchange
 */
var put = exports.put = function(url, data, success, error) {
	return request(createOptions("PUT", url, data, success, error));
};
