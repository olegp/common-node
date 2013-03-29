var assert = require("../lib/assert");
var test = require('../lib/test');
var p = require('../lib/subprocess');

exports.testCommand = function() {
  var textArgs = [
    ['node -v'],
    ['node', '-v'],
    ['node', '-v', {encoding:'utf-8'}]
  ];
  var binaryArgs = [
    ['node -v', {binary:true}],
    ['node', '-v', {binary:true}],
    ['node', '-v', {binary:true, encoding:'utf-8'}]
  ];
  textArgs.forEach(function(args) {
    assert.strictEqual(p.command.apply(null, args).trim(), process.version);
  });
  binaryArgs.forEach(function(args) {
    assert.strictEqual(p.command.apply(null, args).decodeToString().trim(), process.version);
  });
};

if (require.main === module) {
  test.run(exports);
}