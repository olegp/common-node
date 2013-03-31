var assert = require("../../lib/assert");
var test = require('../../lib/test');
var fs = require("../../lib/fs-base");
var ByteString = require('../../lib/binary').ByteString;

function getContents(file) {
  return require("fs").readFileSync(file, "utf8");
}

exports.testCopy = test.fs(2, function(file1, file2) {
  fs.path(file1).write(new ByteString('abcd'));
  fs.path(file1).copy(file2);
  var resource = getContents(file2);

  assert.strictEqual(resource, 'abcd');
});

exports.testOpen = function() {
  var resource = getContents('./lib/assert.js');
  var io = fs.path('./lib/assert.js').open();

  assert.strictEqual(io.read().length, resource.length);
};

exports.testOpenRaw = function() {
  var resource = getContents('./lib/assert.js');
  var io = fs.path('./lib/assert.js').openRaw();

  assert.strictEqual(io.read().decodeToString().length, resource.length);
};

exports.testRead = function() {
  var resource = getContents('./lib/assert.js');
  var file = fs.path('./lib/assert.js').read();

  assert.strictEqual(file.length, resource.length);
};

exports.testWrite = test.fs(1, function(file) {
  fs.path(file).write(new ByteString('test'));
  var resource = getContents(file);

  assert.strictEqual('test', resource);
});

if (require.main === module) {
  require("../../lib/test").run(exports);
}