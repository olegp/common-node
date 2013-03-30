/**
 * @fileoverview HTTP server interface as defined in [CommonJS JSGI
 * 0.3](http://wiki.commonjs.org/wiki/JSGI/Level0/A/Draft2).
 */
require('fibers');
var fs = require('fs').read;
var parse = require('url').parse;
var http = require('http');
var https = require('https');

var spawn = require('./system').spawn;
var Binary = require('./binary').Binary;
var Stream = require('./io').Stream;

function getCharset(headers) {
  var value = headers['Content-Type'];
  if (value) {
    var start = value.indexOf('charset=');
    if (~start) {
      start += 8;
      var end = value.lastIndexOf(';');
      return start < end ? value.substring(start, end) : value.substr(start);
    }
  }
  return null;
}

function receive(request) {
  var url = parse(request.url);
  var host, port;
  var h = request.headers.host;
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
  if (body && typeof body.forEach === "function") {
    var charset = getCharset(headers);
    body.forEach(function(part) {
      if (typeof(part) === 'string' || part instanceof String) {
        response.write(part); // TODO add encoding based on charset
      } else {
        if (!(part instanceof Binary)) {
          part = part.toByteString(charset); // TODO test charset param
        }
        response.write(part.buffer);
      }
    });
    if (typeof body.close === "function") {
      body.close();
    }
  } else {
    throw new Error("Response body doesn't implement forEach: " + body);
  }
  response.end();
}

var jsgi = exports.jsgi = function(app) {
  return function(request, response) {
    spawn(
      function() {
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
  if (options && options.key !== undefined && options.cert !== undefined) {
    // TODO test
    https.createServer(options, jsgi(app)).listen(port || 8080);
  } else {
    http.createServer(jsgi(app)).listen(port || 8080);
  }
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