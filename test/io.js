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

var resource = getContents('./lib/assert.js');

exports.testStreamReadFixed = function() {
  var io = getStream('./lib/io.js');
  var bytes = io.read(7);
  assert.strictEqual(bytes.length, 7);
  assert.strictEqual(bytes.decodeToString(), resource.substr(0, 7));
  bytes = io.read(5);
  assert.strictEqual(bytes.length, 5);
  assert.strictEqual(bytes.decodeToString(), resource.substr(7, 5));
};

exports.testStreamReadIndefinite = function() {
  var io = getStream('./lib/assert.js');
  var bytes = io.read();
  assert.strictEqual(bytes.length, resource.length);
  assert.strictEqual(bytes.decodeToString(), resource);
};

exports.testStreamForEach = function() {
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

exports.testStreamReadInto = function() {
  var io = getStream('./lib/assert.js');
  var bytes = new ByteArray(7);
  io.readInto(bytes);
  assert.equal(bytes.decodeToString(), resource.substring(0, 7));
};

exports.testStreamWrite = test.fs(1, function(file) {
  var io = new Stream(fs.createWriteStream(file));
  io.write(new ByteArray('test'));
  io.flush();
  io.close();
  assert.strictEqual('test', getContents(file));
});

function checkRW(io, readable, writable) {
  assert.strictEqual(io.readable(), readable);
  assert.strictEqual(io.writable(), writable);
}

function checkCursors(io, position, length) {
  assert.strictEqual(io.position, position);
  assert.strictEqual(io.length, length);
}

function noWrite(io) {
  assert.throws(function() {
    io.write('');
  });
}

function write(io) {
  io.write(resource);
  checkCursors(io, resource.length, resource.length);
  io.write(new ByteArray(resource));
  checkCursors(io, resource.length * 2, resource.length * 2);
  io.position = 0;
  io.write(new ByteString(resource));
  checkCursors(io, resource.length, resource.length * 2);
}

function read(io) {
  var position = io.position;
  var length = io.length;
  var bytes = io.read(resource.length);
  assert.strictEqual(bytes.length, resource.length);
  assert.strictEqual(bytes.decodeToString(), resource);
  checkCursors(io, position + resource.length, length);
  var bytes = new ByteArray(7);
  io.position = position;
  io.readInto(bytes);
  assert.equal(bytes.decodeToString(), resource.substring(0, 7));
  checkCursors(io, position + 7, length);
}

exports.testMemoryStreamEmpty = function() {
  [new MemoryStream(), new MemoryStream(resource.length)].forEach(function(io) {
    checkRW(io, true, true);
    checkCursors(io, 0, 0);
    write(io);
    read(io);
    var length = io.length;
    io.position = 42;
    checkCursors(io, 42, length);
    io.length = 1;
    checkCursors(io, 1, 1);
    io.position = 42;
    checkCursors(io, 1, 1);
    io.close();
    noWrite(io);
  });
};

exports.testMemoryStreamArray = function() {
  var io = new MemoryStream(new ByteArray(resource));
  checkRW(io, true, true);
  checkCursors(io, 0, resource.length);
  write(io);
  read(io);
  var length = io.length;
  io.position = 42;
  checkCursors(io, 42, length);
  io.length = 1;
  checkCursors(io, 1, 1);
  io.position = 42;
  checkCursors(io, 1, 1);
  io.close();
  noWrite(io);
};

exports.testMemoryStreamString = function() {
  var io = new MemoryStream(new ByteString(resource));
  checkRW(io, true, false);
  checkCursors(io, 0, resource.length);
  read(io);
  var length = io.length;
  io.position = 42;
  checkCursors(io, 42, length);
  io.length = 1;
  checkCursors(io, 42, length);
  noWrite(io);
};

exports.testTextStreamRead = function() {
  var io = new TextStream(getStream('./lib/assert.js'));
  var text = io.read();
  assert.strictEqual(text.length, resource.length);
  assert.strictEqual(text, resource);
};

exports.testTextStreamForEach = function() {
  var resource = getContents('./lib/assert.js');
  var io = new TextStream(getStream('./lib/assert.js'));
  var trimmed = resource.replace(/\n$/, '');
  var lines = trimmed.split(/\n/g);
  var i = 0;
  io.forEach(function(read) {
    assert.strictEqual(read, lines[i]);
    i++;
  });
  assert.strictEqual(i, lines.length);
};

exports.testTextStreamReadLine = function() {
  var resource = getContents('./lib/assert.js');
  var io = new TextStream(getStream('./lib/assert.js'));
  var trimmed = resource.replace(/\n$/, '');
  var lines = trimmed.split(/\n/g);
  var last = resource === trimmed ? '' : '\n';
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i] + (i === lines.length - 1 ? last : '\n');
    assert.strictEqual(io.readLine(), line);
  }
  assert.strictEqual(io.readLine(), '');
};

exports.testTextStreamReadLines = function() {
  var resource = getContents('./lib/assert.js');
  var io = new TextStream(getStream('./lib/assert.js'));
  var read = io.readLines();
  var trimmed = resource.replace(/\n$/, '');
  var lines = trimmed.split(/\n/g);
  assert.strictEqual(read.length, lines.length);
  var last = resource === trimmed ? '' : '\n';
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i] + (i === lines.length - 1 ? last : '\n');
    assert.strictEqual(read[i], line);
  }
};

exports.testTextStreamWrite = function() {
  var resource = getContents('./lib/assert.js');
  var stream = new MemoryStream();
  var io = new TextStream(stream);
  io.write(resource);
  assert.strictEqual(stream.content.decodeToString().length, resource.length);
  assert.strictEqual(stream.content.decodeToString(), resource);
};

exports.testTextStreamWriteLine = function() {
  var resource = getContents('./lib/assert.js');
  var stream = new MemoryStream();
  var io = new TextStream(stream);
  var trimmed = resource.replace(/\n$/, '');
  trimmed.split(/\n/g).forEach(function(line) {
    io.writeLine(line);
  });
  resource = trimmed + '\n';
  assert.strictEqual(stream.content.decodeToString().length, resource.length);
  assert.strictEqual(stream.content.decodeToString(), resource);
};

exports.testTextStreamWriteLines = function() {
  var resource = getContents('./lib/assert.js');
  var stream = new MemoryStream();
  var io = new TextStream(stream);
  var trimmed = resource.replace(/\n$/, '');
  io.writeLines(trimmed.split(/\n/g));
  resource = trimmed + '\n';
  assert.strictEqual(stream.content.decodeToString().length, resource.length);
  assert.strictEqual(stream.content.decodeToString(), resource);
};

if (require.main === module) {
  test.run(exports);
}