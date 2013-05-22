/**
 * @fileoverview HTTP server interface as defined in [CommonJS JSGI
 * 0.3](http://wiki.commonjs.org/wiki/JSGI/Level0/A/Draft2).
 */
require('fibers');
var fs = require('fs').read;
var parse = require('url').parse;
var http = require('http');
var https = require('https');
var system = require('./system');
var Binary = require('./binary').Binary;
var Stream = require('./io').Stream;

http.IncomingMessage.prototype._addHeaderLine = function(field, values) {
  var dest = this.complete ? this.trailers : this.headers;
  field = field.toLowerCase();
  values = values.split(', ');
  var current = dest[field];
  if (current === undefined) {
    dest[field] = values;
  } else {
    for (var i = 0; i < values.length; i++) {
      current[current.length] = values[i];
    }
  }
};

var CHARSET_PATTERN = /charset=([^;]+)/;
function getCharset(headers) {
  var value = CHARSET_PATTERN.exec(headers['Content-Type']);
  return value && value[1];
}

function receive(request) {
  var url = parse(request.url);
  var host, port;
  var h = request.headers.host[0];
  if (h) {
    h = h.split(':');
    host = h[0];
    port = +h[1] || 80;
  } else {
    host = 'localhost';
    port = 80;
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
    remoteAddress:request.connection.remoteAddress,
    remotePort:request.connection.remotePort
  };
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
  if (options.key !== undefined && options.cert !== undefined) {
    server = https.createServer(options, jsgi(app));
  } else {
    server = http.createServer(jsgi(app));
  }
  server.timeout = options.timeout || 0;
  server.listen(port);
  exports.started = true;
};

if (require.main === module) {
  if (process.argv.length < 2) {
    console.log('usage: common-node httpserver.js app_module [port] [key_file] [cert_file]');
    console.log('port defaults to 8080; if key_file and cert_file are provided, an HTTP server is started');
  } else {
    var options = {};
    if (process.argv[4] && process.argv[5]) {
      options.key = fs.readFileSync(process.argv[4]);
      options.cert = fs.readFileSync(process.argv[5]);
    }
    main(process.argv[2], process.argv[3], options);
  }
}