var fs = require('fs');
var assert = require("../lib/assert");
var io = require('../lib/io');
var Stream = io.Stream;
var TextStream = io.TextStream;
var ByteArray = require('../lib/binary').ByteArray;

function getStream(file) {
	return new Stream(fs.createReadStream(file));
}

function getContents(file) {
	return fs.readFileSync(file, "utf8");
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
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

exports.testReadBlock = function() {
	// var resource = getContents('./lib/assert.js');
	// var io = getStream('./lib/assert.js');
	// var bytes = io.read(null);
	// assert.notEqual(bytes.length, resource.length);
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

exports.testWrite = function() {
	var file = '/tmp/test' + getRandomInt(0, 1000000);
	var io = new Stream(fs.createWriteStream(file));
	io.write(new ByteArray('test'));
	io.flush();
	io.close();
	var resource = getContents(file);
	assert.strictEqual('test', resource);
};

if (require.main == module) {
	require("../lib/test").run(exports);
}
