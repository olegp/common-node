var fs = require("fs");
var assert = require("../lib/assert");
var HttpClient = require("../lib/httpclient").HttpClient;
var ByteString = require("../lib/binary").ByteString;
var Stream = require("../lib/io").Stream;

function getStream(file) {
  return new Stream(fs.createReadStream(file));
}

function getContents(file) {
  return fs.readFileSync(file, "utf8");
}

var resource = getContents('./lib/assert.js');

require("../lib/httpserver").main(function(request) {
  return app(request);
});

var app;

function checkHeaders(original, response) {
  for (var key in original) {
    var h1 = original[key];
    if (!Array.isArray(h1) && ~h1.indexOf(', ')) {
      h1 = h1.split(', ');
    }
    var h2 = response[key.toLowerCase()];
    assert.deepEqual(h1, h2);
  }
}

exports.testRead = function() {
  assert.throws(function() {
    new HttpClient({
      method:"GET",
      url:"http://localhost:8080/"
    }).read();
  });
};

exports.testGet = function() {
  var code = 200;
  var method = "gEt";
  var content = "Hello\nWorld!";
  var headers = {
    'Content-Type':'text/plain',
    'Cache-Control':'max-age=42, must-revalidate, private'
  };
  app = function(request) {
    var status = code;
    if (request.method !== method.toUpperCase()) {
      status = 599;
    }
    try {
      checkHeaders(headers, request.headers);
    } catch (e) {
      status = 598;
    }
    return {
      status:status,
      headers:headers,
      body:[content]
    };
  };

  var response = new HttpClient({
    method:method,
    url:"http://localhost:8080/",
    headers:headers
  }).finish();
  assert.notStrictEqual(599, response.status, 'request method mismatch');
  assert.notStrictEqual(598, response.status, 'request header mismatch');
  assert.strictEqual(code, response.status);
  checkHeaders(headers, response.headers);
  assert.strictEqual(content, response.body.read().decodeToString());
  response.body.close();
};

exports.testPost = function() {
  var code = 301;
  var method = "POST";
  var content = "Hello\nWorld!";
  var headers = {
    'Content-Type':'text/plain;charset=utf-16',
    'Cache-Control':['max-age=42', 'must-revalidate', 'private']
  };
  app = function(request) {
    var status = code;
    if (request.method !== method.toUpperCase()) {
      status = 599;
    }
    try {
      checkHeaders(headers, request.headers);
    } catch (e) {
      status = 598;
    }
    return {
      status:status,
      headers:headers,
      body:[content]
    };
  };

  var response = new HttpClient({
    method:method,
    url:"http://localhost:8080/",
    headers:headers
  }).connect().read();
  assert.notStrictEqual(599, response.status, 'request method mismatch');
  assert.notStrictEqual(598, response.status, 'request header mismatch');
  assert.strictEqual(code, response.status);
  checkHeaders(headers, response.headers);
  assert.strictEqual(content, response.body.read().decodeToString('UTF-16'));
  response.body.close();
};

exports.testPut = function() {
  var code = 409;
  var method = "put";
  var headers = {
    'Content-Type':'text/plain'
  };
  app = function(request) {
    var status = code;
    if (request.method !== method.toUpperCase()) {
      status = 599;
    }
    try {
      checkHeaders(headers, request.headers);
    } catch (e) {
      status = 598;
    }
    return {
      status:status,
      headers:headers,
      body:getStream('./lib/assert.js')
    };
  };

  var response = new HttpClient({
    method:method,
    url:"http://localhost:8080/",
    headers:headers
  }).connect().read();
  assert.notStrictEqual(599, response.status, 'request method mismatch');
  assert.notStrictEqual(598, response.status, 'request header mismatch');
  assert.strictEqual(code, response.status);
  checkHeaders(headers, response.headers);
  assert.strictEqual(resource.toString(), response.body.read().decodeToString());
  response.body.close();
};

exports.testHttpsGet = function() {
  var response = new HttpClient({
    method:"GET",
    url:"https://google.com/"
  }).finish();
  response.body.close();
  assert.strictEqual(response.status, 301);
};

if (require.main === module) {
  require("../lib/test").run(exports);
}