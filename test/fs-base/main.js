var assert = require("../../lib/assert");
var fs = require("../../lib/fs-base");
var ByteString = require('../../lib/binary').ByteString;

function getContents(file) {
  return require("fs").readFileSync(file, "utf8");
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//TODO cleanup files after use, don't use tmp dir
exports.testCopy = function() {
  var file1 = '/tmp/test' + getRandomInt(0, 1000000);
  var file2 = '/tmp/test' + getRandomInt(0, 1000000);
  fs.write(file1, new ByteString('abcd'));
  fs.copy(file1, file2);
  var resource = getContents(file2);
  
  assert.strictEqual(resource, 'abcd');
};

exports.testOpen = function() {
  var resource = getContents('./lib/assert.js');
  var io = fs.open('./lib/assert.js');
  
  assert.strictEqual(io.read().length, resource.length);
};

exports.testOpenRaw = function() {
  var resource = getContents('./lib/assert.js');
  var io = fs.openRaw('./lib/assert.js');
  
  assert.strictEqual(io.read().decodeToString().length, resource.length);
};

exports.testRead = function() {
  var resource = getContents('./lib/assert.js');
  var file = fs.read('./lib/assert.js');
  
  assert.strictEqual(file.length, resource.length);
};

exports.testWrite = function() {
  var file = '/tmp/test' + getRandomInt(0, 1000000);
  fs.write(file, new ByteString('test'));
  var resource = getContents(file);
  
  assert.strictEqual('test', resource);
};

if (require.main == module) {
  require("../../lib/test").run(exports);
}
