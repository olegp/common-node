var assert = require("../lib/assert");
var test = require('../lib/test');
var p = require('../lib/subprocess');
var io = require('../lib/io');
var system = require('../lib/system');
var MemoryStream = io.MemoryStream;

function hijack(run) {
  var stdout = system.stdout;
  var stderr = system.stderr;
  var out = new MemoryStream();
  var err = new MemoryStream();
  system.stdout = {raw:out};
  system.stderr = {raw:err};
  try {
    run();
    return {out:out.content.decodeToString(), err:err.content.decodeToString()};
  } finally {
    system.stdout = stdout;
    system.stderr = stderr;
  }
}

exports.testCreateProcessText = function() {
  [
    {command:'node -v'},
    {command:['node', '-v']},
    {command:['node', '-v'], encoding:'utf-8'}
  ].forEach(function(args) {
    var proc = p.createProcess(args);
    assert.strictEqual(proc.wait(), 0);
    assert.strictEqual(proc.stdout.read().trim(), process.version);
    assert.strictEqual(proc.stderr.read().length, 0);
  });
};

exports.testCreateProcessBinary = function() {
  [
    {command:'node -v', binary:true},
    {command:['node', '-v'], binary:true},
    {command:['node', '-v'], binary:true, encoding:'utf-8'}
  ].forEach(function(args) {
    var proc = p.createProcess(args);
    assert.strictEqual(proc.wait(), 0);
    assert.strictEqual(proc.stdout.read().decodeToString().trim(), process.version);
    assert.strictEqual(proc.stderr.read().length, 0);
  });
};

exports.testCreateProcessError = function() {
  [
    {command:'node nosuchscriptfile'},
    {command:['node', 'nosuchscriptfile']},
    {command:['node', 'nosuchscriptfile'], encoding:'utf-8'},
    {command:'node nosuchscriptfile', binary:true},
    {command:['node', 'nosuchscriptfile'], binary:true},
    {command:['node', 'nosuchscriptfile'], binary:true, encoding:'utf-8'}
  ].forEach(function(args) {
    var proc = p.createProcess(args);
    assert.notStrictEqual(proc.wait(), 0);
    assert.strictEqual(proc.stdout.read().length, 0);
    assert.notStrictEqual(proc.stderr.read().length, 0);
  });
  var proc = p.createProcess({command:'nosuchprocess'});
  assert.notStrictEqual(proc.wait(), 0);
};

exports.testCommandText = function() {
  [
    ['node -v'],
    ['node', '-v'],
    ['node', '-v', {encoding:'utf-8'}]
  ].forEach(function(args) {
    assert.strictEqual(p.command.apply(null, args).trim(), process.version);
  });
};

exports.testCommandBinary = function() {
  [
    ['node -v', {binary:true}],
    ['node', '-v', {binary:true}],
    ['node', '-v', {binary:true, encoding:'utf-8'}]
  ].forEach(function(args) {
    assert.strictEqual(p.command.apply(null, args).decodeToString().trim(), process.version);
  });
};

exports.testCommandError = function() {
  [
    ['node nosuchscriptfile'],
    ['node', 'nosuchscriptfile'],
    ['node', 'nosuchscriptfile', {encoding:'utf-8'}],
    ['node nosuchscriptfile', {binary:true}],
    ['node', 'nosuchscriptfile', {binary:true}],
    ['node', 'nosuchscriptfile', {binary:true, encoding:'utf-8'}]
  ].forEach(function(args) {
    assert.throws(function() {
      p.command.apply(null, args);
    });
  });
  assert.throws(function() {
    p.command('nosuchprocess');
  });
};

exports.testSystem = function() {
  [
    ['node -v'],
    ['node', '-v'],
    ['node', '-v', {encoding:'utf-8'}],
    ['node -v', {binary:true}],
    ['node', '-v', {binary:true}],
    ['node', '-v', {binary:true, encoding:'utf-8'}]
  ].forEach(function(args) {
    var std = hijack(function() {
      assert.strictEqual(p.system.apply(null, args), 0);
    });
    assert.strictEqual(std.out.trim(), process.version);
    assert.strictEqual(std.err.length, 0);
  });
};

exports.testSystemError = function() {
  [
    ['node nosuchscriptfile'],
    ['node', 'nosuchscriptfile'],
    ['node', 'nosuchscriptfile', {encoding:'utf-8'}],
    ['node nosuchscriptfile', {binary:true}],
    ['node', 'nosuchscriptfile', {binary:true}],
    ['node', 'nosuchscriptfile', {binary:true, encoding:'utf-8'}]
  ].forEach(function(args) {
    var std = hijack(function() {
      assert.notStrictEqual(p.system.apply(null, args), 0);
    });
    assert.strictEqual(std.out.length, 0);
    assert.notStrictEqual(std.err.length, 0);
  });
  var std = hijack(function() {
    assert.notStrictEqual(p.system('nosuchprocess'), 0);
  });
  assert.strictEqual(std.out.length, 0);
  assert.strictEqual(std.err.length, 0);
};

if (require.main === module) {
  test.run(exports);
}