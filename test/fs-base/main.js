var assert = require("../../lib/assert");
var test = require('../../lib/test');
var fs = require("../../lib/fs-base");
var ByteString = require('../../lib/binary').ByteString;

function getContents(file) {
  return require("fs").readFileSync(file, "utf8");
}

exports.testCopy = test.fs(2, function(file1, file2) {
  fs.write(file1, new ByteString('abcd'));
  fs.copy(file1, file2);
  var resource = getContents(file2);

  assert.strictEqual(resource, 'abcd');
});

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

exports.testWrite = test.fs(1, function(file) {
  fs.write(file, new ByteString('test'));
  var resource = getContents(file);
  assert.strictEqual('test', resource);

  fs.write(file, 'test');
  var resource = getContents(file);
  assert.strictEqual('test', resource);

  fs.write(file, '');
  fs.write(file, new ByteString('test'), {append:true});
  fs.write(file, 'test', {append:true});
  var resource = getContents(file);
  assert.strictEqual('testtest', resource);
});

if (require.main === module) {
  require("../../lib/test").run(exports);
}