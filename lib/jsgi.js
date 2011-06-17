/**
 * @fileoverview HTTP server interface as defined in <a href="http://wiki.commonjs.org/wiki/JSGI/Level0/A/Draft2">CommonJS JSGI 0.3</a>.
 */
require('fibers');
var parse = require('url').parse;
var http =  require('http');

var spawn = require('./system').spawn;
var Binary = require('./binary').Binary;
var Stream = require('./io').Stream;

/**
 * Get a parameter from a MIME header value. For example, calling this function
 * with "Content-Type: text/plain; charset=UTF-8" and "charset" will return "UTF-8".
 * @param headerValue a header value
 * @param paramName a MIME parameter name
 */
function getMimeParameter(headerValue, paramName) {
  if (!headerValue)
    return null;
  var start, end = 0;
  paramName = paramName.toLowerCase();
  while((start = headerValue.indexOf(";", end)) > -1) {
    end = headerValue.indexOf(";", ++start);
    if (end < 0)
        end = headerValue.length;
    var eq = headerValue.indexOf("=", start);
    if (eq > start && eq < end) {
      var name = headerValue.slice(start, eq);
      if (name.toLowerCase().trim() == paramName) {
        var value = headerValue.slice(eq + 1, end).trim();
        if (strings.startsWith(value, '"') && strings.endsWith(value, '"')) {
            return value.slice(1, -1).replace('\\\\', '\\').replace('\\"', '"');
        } else if (strings.startsWith(value, '<') && strings.endsWith(value, '>')) {
            return value.slice(1, -1);
        }

        return value;
      }
    }
  }
  return null;
}

function receive(request) {
  //TODO scheme, input, jsgi.errors
  var url = parse(request.url);
  //TODO optimize
  var v = request.httpVersion.split('.');
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
    version: [+v[0], +v[1]],
    method: request.method,
    scriptName: '',
    pathInfo: url.pathname,
    queryString: url.search,
    host: host,
    port: port,
    scheme: 'http',
    input: new Stream(request),
    headers: request.headers,
    jsgi: {
      version: [0, 3],
      errors: new Stream(process.stderr),
      multithread: false, // or are we?
      multiprocess: true,
      runOnce: false,
      async: false, // or are we?
      cgi: false
    },
    env: {}
  };
}

function send(r, response) {
  var body = r.body;
  var headers = r.headers || {};
  response.writeHead(r.status, headers);
  if (body && typeof body.forEach == "function") {
    var charset = getMimeParameter(headers["Content-Type"], "charset");
    //TODO optimize
    body.forEach(function(part) {
      if (!(part instanceof Binary)) {
          part = part.toByteString(charset); //TODO test charset param
      }
      response.write(part.buffer);
    });
    if (typeof body.close == "function") {
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
        //TODO trap exceptions, return status 500
        send(app(receive(request)), response);
      });
  }
}

var run = exports.run = function(module, port) {
  var app;
  if(typeof module == "function") {
    app = module;
  } else {
     app = module.app ?  module.app : require(module).app;
  }
  http.createServer(jsgi(app)).listen(port || 8080);
}

if (require.main === module) {
  run(process.argv[2], process.argv[3]);
}
