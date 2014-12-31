/**
 * @fileoverview HTTP server interface as defined in [CommonJS JSGI
 * 0.3](http://wiki.commonjs.org/wiki/JSGI/Level0/A/Draft2).
 */
var Fiber = require('fibers');
var fs = require('fs').read;
var parse = require('url').parse;
var http = require('http');
var https = require('https');
var cluster = require('cluster');
var cpus = require('os').cpus().length;
var system = require('./system');
var Binary = require('./binary').Binary;
var Stream = require('./io').Stream;

http.IncomingMessage.prototype._addHeaderLine = function(field, values, dest) {
  if (!dest) {
    dest = this.complete ? this.trailers : this.headers;
  }
  field = field.toLowerCase();
  values = values.split(', ');
  if (field in dest) {
    Array.prototype.push.apply(dest[field], values);
  } else {
    dest[field] = values;
  }
};

function receive(request) {
  var url = parse(request.url);
  var host, port;
  var c = request.connection;
  var h = request.headers.host;
  if (h && h.length) {
    h = h[0].split(':');
    host = h[0];
    port = +h[1] || 80;
  } else {
    host = c.localAddress;
    port = c.localPort;
  }
  return {
    version:[request.httpVersionMajor, request.httpVersionMinor],
    method:request.method,
    scriptName:'',
    pathInfo:url.pathname,
    queryString:url.search ? url.search.substr(1) : "",
    host:host,
    port:port,
    scheme:'http',
    input:new Stream(request),
    headers:request.headers,
    jsgi:{
      version:[0, 3],
      errors:system.stderr,
      multithread:false,
      multiprocess:false,
      runOnce:false,
      async:false,
      cgi:false
    },
    env:{},
    // non standard fields below
    remoteAddress:c.remoteAddress,
    remotePort:c.remotePort
  };
}

var CHARSET_PATTERN = /charset=([^;]+)/;
function getCharset(headers) {
  var value = CHARSET_PATTERN.exec(headers['Content-Type']);
  return value && value[1];
}

function send(r, response) {
  var body = r.body;
  var headers = r.headers || {};
  response.writeHead(r.status, headers);
  var charset = getCharset(headers);
  body.forEach(function(part) {
    if (!(part instanceof Binary)) {
      part = part.toByteString(charset);
    }
    response.write(part.buffer);
  });
  if (body.close) {
    body.close();
  }
  response.end();
}

var jsgi = exports.jsgi = function(app) {
  return function(request, response) {
    system.spawn(function() {
      try {
        send(app(receive(request)), response);
      } catch (e) {
        console.error(e.stack);
        send({status:503, body:[], headers:{}}, response);
      }
      request.resume();
    });
  };
};

exports.started = false;
var main = exports.main = function(module, port, options) {
  if (cluster.isMaster && options && options.cluster) {
    if (options.cluster === 0) {
      options.cluster = cpus;
    }
    for (var i = 0; i < options.cluster; i++) {
      cluster.fork(process.env);
    }
  } else {
    options = options || {};
    var app;
    if (typeof module === "function") {
      app = module;
    } else {
      app = module.app ? module.app : require(module).app;
    }
    if (!app) {
      throw new Error('No app found');
    }
    port = port || 8080;
    var server;
    if ('key' in options && 'cert' in options) {
      server = https.createServer(options, jsgi(app));
    } else {
      server = http.createServer(jsgi(app));
    }
    server.timeout = options.timeout || 0;
    server.listen(port);
    exports.started = true;
  }
};