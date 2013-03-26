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
  run();
  system.stdout = stdout;
  system.stderr = stderr;
  return {out:out.content.decodeToString(), err:err.content.decodeToString()};
}

exports.testCreateProcess = function() {
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
};

exports.testCommand = function() {
  [
    ['node -v'],
    ['node', '-v'],
    ['node', '-v', {encoding:'utf-8'}]
  ].forEach(function(args) {
    assert.strictEqual(p.command.apply(null, args).trim(), process.version);
  });
  [
    ['node -v', {binary:true}],
    ['node', '-v', {binary:true}],
    ['node', '-v', {binary:true, encoding:'utf-8'}]
  ].forEach(function(args) {
    assert.strictEqual(p.command.apply(null, args).decodeToString().trim(), process.version);
  });
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
      p.system.apply(null, args);
    });
    assert.strictEqual(std.out.trim(), process.version);
    assert.strictEqual(std.err.length, 0);
  });
  [
    ['node nosuchscriptfile'],
    ['node', 'nosuchscriptfile'],
    ['node', 'nosuchscriptfile', {encoding:'utf-8'}],
    ['node nosuchscriptfile', {binary:true}],
    ['node', 'nosuchscriptfile', {binary:true}],
    ['node', 'nosuchscriptfile', {binary:true, encoding:'utf-8'}]
  ].forEach(function(args) {
    var std = hijack(function() {
      p.system.apply(null, args);
    });
    assert.strictEqual(std.out.length, 0);
    assert.notStrictEqual(std.err.length, 0);
  });
};

if (require.main === module) {
  test.run(exports);
}