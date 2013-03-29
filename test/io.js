var fs = require('fs');
var assert = require("../lib/assert");
var io = require('../lib/io');
var test = require('../lib/test');
var Stream = io.Stream;
var MemoryStream = io.MemoryStream;
var TextStream = io.TextStream;
var binary = require('../lib/binary');
var ByteArray = binary.ByteArray;
var ByteString = binary.ByteString;

function getStream(file) {
  return new Stream(fs.createReadStream(file));
}

function getContents(file) {
  return fs.readFileSync(file, "utf8");
}

exports.testReadFixed = function() {
  var io = getStream('./lib/io.js');
  var bytes = io.read(7);
  assert.strictEqual(bytes.length, 7);

  bytes = io.read(5);
  assert.strictEqual(bytes.length, 5);
  // assert.strictEqual(bytes.decodeToString(), 'include');
};

exports.testReadIndefinite = function() {
  var resource = getContents('./lib/assert.js');
  var io = getStream('./lib/assert.js');
  var bytes = io.read();
  assert.strictEqual(bytes.length, resource.length);
  assert.strictEqual(bytes.decodeToString(), resource);
};

exports.testStreamForEach = function() {
  var resource = getContents('./lib/assert.js');
  var io = getStream('./lib/assert.js');
  var str = "";
  var read = 0;
  io.forEach(function(data) {
    read += data.length;
    str += data.decodeToString();
  });
  assert.strictEqual(read, resource.length);
  assert.strictEqual(str, resource);
};

exports.testReadInto = function() {
  var resource = getContents('./lib/assert.js');
  var io = getStream('./lib/assert.js');
  var bytes = new ByteArray(7);
  io.readInto(bytes);
  assert.equal(bytes.decodeToString(), resource.substring(0, 7));
};

exports.testReadLine = function() {
  var resource = getContents('./lib/assert.js');
  var io = new TextStream(getStream('./lib/assert.js'));
  var lines = io.readLines();
  assert.equal(lines.length, resource.replace(/\n$/, "").split(/\n/).length);
};

exports.testWrite = test.fs(1, function(file) {
  var io = new Stream(fs.createWriteStream(file));
  io.write(new ByteArray('test'));
  io.flush();
  io.close();
  var resource = getContents(file);
  assert.strictEqual('test', resource);
});

exports.testMemoryStream = function() {
  var resource = getContents('./lib/assert.js');

  function checkRW(readable, writable) {
    assert.strictEqual(io.readable(), readable);
    assert.strictEqual(io.writable(), writable);
  }

  function checkCursors(position, length) {
    assert.strictEqual(io.position, position);
    assert.strictEqual(io.length, length);
  }

  function noWrite() {
    assert.throws(function() {
      io.write('');
    });
  }

  function exercise() {
    io.write(resource);
    checkCursors(resource.length, resource.length);
    io.write(new ByteArray(resource));
    checkCursors(resource.length * 2, resource.length * 2);
    io.position = 0;
    io.write(new ByteString(resource));
    checkCursors(resource.length, resource.length * 2);
    assert.strictEqual(io.read(resource.length).decodeToString(), resource);
    checkCursors(resource.length * 2, resource.length * 2);
  }

  var io = new MemoryStream();
  checkRW(true, true);
  checkCursors(0, 0);
  io.position = 42;
  checkCursors(0, 0);
  exercise();
  io.close();
  noWrite();
  io = new MemoryStream(new ByteArray(resource));
  checkRW(true, true);
  checkCursors(0, resource.length);
  exercise();
  io.close();
  noWrite();
  io = new MemoryStream(new ByteString(resource));
  checkRW(true, false);
  checkCursors(0, resource.length);
  noWrite();
};

if (require.main === module) {
  test.run(exports);
}