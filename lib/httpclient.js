require('fibers');
var protocols = {
  http: require('http'),
  https: require('https')
};
var Stream = require('./io').Stream;

var ports = {
  http: 80,
  https: 443
}

exports.HttpClient = HttpClient;

/* parseUri JS v0.1.1, by Steven Levithan <http://stevenlevithan.com>
Splits any well-formed URI into the following parts (all are optional):
----------------------
- source (since the exec method returns the entire match as key 0, we might as well use it)
- protocol (i.e., scheme)
- authority (includes both the domain and port)
  - domain (i.e., host; can be an IP address)
  - port
- path (includes both the directory path and filename)
  - directoryPath (supports directories with periods, and without a trailing backslash)
  - fileName
- query (does not include the leading question mark)
- anchor (i.e., fragment) */
function parseUri(sourceUri){
  var uriPartNames = ["source","protocol","authority","domain","port","path","directoryPath","fileName","query","anchor"],
		uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri),
		uri = {};

	for(var i = 0; i < 10; i++){
		uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
	}

	/* Always end directoryPath with a trailing backslash if a path was present in the source URI
	Note that a trailing backslash is NOT automatically inserted within or appended to the "path" key */
	if(uri.directoryPath.length > 0){
		uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
	}

	return uri;
}

function HttpClient(settings) {
    if (!(this instanceof HttpClient)) return new HttpClient(settings);
    this.guts = {};
    this.create();
    if (settings) this.setOptions(settings);
}

HttpClient.prototype = {

    create : function () {
        this.setOptions({
            "method" : "GET",
            "headers" : {},
            "body" : []
        });
        return this;
    },

    setOptions : function (settings) {
        for (var key in settings)  if (settings.hasOwnProperty(key)) {
            this.setOption(key, settings[key]);
        }
        return this;
    },

    setOption : function (key, val) {
        switch (key) {
            case "headers":
                if (typeof val !== 'object') throw new Error(
                        "HttpClient: headers must be a simple object."
                );
                return this.setHeaders(val);
            case "body":
                if (typeof val.forEach !== 'function') throw new Error(
                        "HttpClient: body must be iterable."
                );
            // fallthrough
            default:
                this.guts[key] = val;
        }
        return this;
    },

    setHeaders : function (headers) {
        for (var h in headers) if (headers.hasOwnProperty(h)) {
            this.setHeader(h, headers[h]);
        }
        return this;
    },

    setHeader : function (key, val) {
        if (!this.guts.hasOwnProperty("headers")) this.guts.headers = {};
        this.guts.headers[key] = val;
        return this;
    },

    write : function (data) {
        var len = this.guts.headers["Content-Length"] || 0;
        len += data.length;
        this.guts.headers["Content-Length"] = len;
        this.guts.body.push(data);
        return this;
    },

    connect : function (decode) {
        //if (decode) HttpClient.decode(resp);
        return this;
    },

    read : function() {
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
        this.guts.body.forEach(function(block) {
          req.write(block.buffer || block);
        });
        req.end();

        var response = yield();
        return {
            status: response.statusCode,
            headers: response.headers,
            body: new Stream(response)
        };
    },

    finish : function() {
        return this.connect().read();
    }
};
