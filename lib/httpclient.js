/**
 * @fileoverview HTTP Client as defined in [CommonJS HTTP
 * Client/A](http://wiki.commonjs.org/wiki/HTTP_Client/A).
 */
var Fiber = require('fibers');
var Stream = require('./io').Stream;
var zlib = require('zlib');

var protocols = {
  http:require('http'),
  https:require('https')
};
var ports = {
  http:80,
  https:443
};
Object.keys(protocols).forEach(function(key) {
  protocols[key].globalAgent.maxSockets = 1 / 0;
});

exports.HttpClient = HttpClient;

var URI_PARTS = ["source", "protocol", "authority", "domain", "port", "path", "directoryPath", "fileName", "query", "anchor"];
var URI_REGEX = /^(?:([^:\/?#.]+):)?(?:\/\/)?(([^:\/?#]*)(?::(\d*))?)((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[\?#]|$)))*\/?)?([^?#\/]*))?(?:\?([^#]*))?(?:#(.*))?/;
/**
 * parseUri JS v0.1.1, by Steven Levithan <http://stevenlevithan.com> Splits any
 * well-formed URI into the following parts (all are optional):
 * - source (since the exec method returns the entire match as key 0, we might as well use it)
 * - protocol (i.e., scheme)
 * - authority (includes both the domain and port)
 * - domain (i.e., host; can be an IP address)
 * - port
 * - path (includes both the directory path and filename)
 * - directoryPath (supports directories with periods, and without a trailing backslash)
 * - fileName
 * - query (does not include the leading question mark)
 * - anchor (i.e., fragment)
 *
 * @param {String} sourceUri
 *
 * @ignore
 */
function parseUri(sourceUri) {
  var uriParts = URI_REGEX.exec(sourceUri), uri = {};

  for (var i = 0; i < URI_PARTS.length; i++) {
    uri[URI_PARTS[i]] = (uriParts[i] ? uriParts[i] : "");
  }

  /*
   * Always end directoryPath with a trailing backslash if a path was present in
   * the source URI Note that a trailing backslash is NOT automatically inserted
   * within or appended to the "path" key
   */
  if (uri.directoryPath.length > 0) {
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
 * @param {Object} [settings] the settings object
 */
function HttpClient(settings) {
  if (!(this instanceof HttpClient)) {
    return new HttpClient(settings);
  }
  /** @ignore */
  this._opts = {
    method:"GET"
  };
  /** @ignore */
  this._headers = {};
  /** @ignore */
  this._body = [];
  if (settings) {
    this.setOptions(settings);
  }
}

/**
 * Set the body, headers, method, or url, or any combination thereof in the
 * settings object. Attribute validity is enforced.
 *
 * @param {Object} settings the settings object
 */
HttpClient.prototype.setOptions = function(settings) {
  for (var key in settings) {
    if (settings.hasOwnProperty(key)) {
      this.setOption(key, settings[key]);
    }
  }
  return this;
};

/**
 * Set the body, headers, method, or url, or any combination thereof in the
 * settings object. Attribute validity is enforced.
 *
 * @param {String} key one of body, headers, method or url
 * @param {Object} val the value to set
 */
HttpClient.prototype.set = HttpClient.prototype.setOption = function(key, val) {
  switch (key) {
    case "headers":
      if (typeof val !== 'object') {
        throw new Error("HttpClient: headers must be a simple object.");
      } else {
        this.setHeaders(val);
      }
      break;
    case "body":
      if (typeof val.forEach !== 'function') {
        throw new Error("HttpClient: body must be iterable.");
      } else {
        this._body = val;
      }
      break;
    default:
      this._opts[key] = val;
      break;
  }
  return this;
};

/**
 * Set a bunch of headers expressed as name-value pairs.
 *
 * @param headers headers to set
 */
HttpClient.prototype.setHeaders = function(headers) {
  for (var h in headers) {
    if (headers.hasOwnProperty(h)) {
      this.setHeader(h, headers[h]);
    }
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
  for (var name in this._headers) {
    if (name.toLowerCase() === key.toLowerCase()) {
      delete this._headers[name];
    }
  }
  this._headers[key] = val;
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
  if (!this._body.push) {
    throw new Error("body does not have push()");
  } else {
    this._body.push(data);
    if (this._headers.hasOwnProperty('Content-Length')) {
      this._headers['Content-Length'] += data.length;
    }
  }
  return this;
};

/**
 * Open the connection to the URL using the method supplied. If the method or
 * url is missing, throw an error. After connecting, write() will have no
 * effect.
 */
HttpClient.prototype.connect = function() {
  var uri = parseUri(this._opts.url);
  var path = uri.path || '/';
  if (uri.query) {
    path += '?' + uri.query;
  }
  var options = {
    method:this._opts.method,
    host:uri.domain,
    port:uri.port || ports[uri.protocol],
    path:path,
    headers:this._headers
  };
  if (this._opts.hasOwnProperty('rejectUnauthorized')) {
    options.rejectUnauthorized = this._opts.rejectUnauthorized;
  }
  var that = this;
  var req = protocols[uri.protocol].request(options, function(response) {
    that._response = response;
    if (that._waiting) {
      var fiber = that._waiting;
      delete that._waiting;
      fiber.run();
    }
  }).on('error', function(error) {
    that._response = error;
    if (that._waiting) {
      var fiber = that._waiting;
      delete that._waiting;
      fiber.run();
    }
  });
  if (this._opts.timeout) {
    req.setTimeout(this._opts.timeout, function() {
      req.abort();
    });
  }
  this._body.forEach(function(block) {
    req.write(block.buffer || block);
  });
  req.end();
  this._connected = true;
  return this;
};

/**
 * Read the request and return a JSGI-style object consisting of
 * {status:Integer, headers:Object, body:Iterable<ByteString>}. Calling read()
 * does not block the application until the request is completed, but it does
 * open the input stream such that the data can be read.
 */
HttpClient.prototype.read = function() {
  if (!this._connected) {
    throw new Error("connect() not called yet");
  } else {
    return new Response(this);
  }
};

/**
 * Alias for .connect().read()
 */
HttpClient.prototype.finish = function() {
  return this.connect().read();
};

/**
 * @param {HttpClient} client
 *
 * @ignore
 */
function Response(client) {
  this.client = client;
  return this;
}

Object.defineProperty(Response.prototype, '_response', {
  get:function() {
    if (!this.client._response) {
      this.client._waiting = Fiber.current;
      Fiber.yield();
    }
    var result = this.client._response;
    if (result instanceof Error) {
      throw new Error(result.message);
    } else {
      return result;
    }
  }
});

Object.defineProperty(Response.prototype, 'status', {
  get:function() {
    return this._response.statusCode;
  }
});

Object.defineProperty(Response.prototype, 'headers', {
  get:function() {
    return this._response.headers;
  }
});

Object.defineProperty(Response.prototype, 'body', {
  get:function() {
    if (!this._body) {
      var response = this._response;
      if ((this.headers['content-encoding'] || [])[0] === 'gzip') {
        response = response.pipe(zlib.createGunzip());
        response.writable = false;
      }
      this._body = new Stream(response);
    }
    return this._body;
  }
});