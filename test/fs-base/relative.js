var assert = require('../../lib/assert');
var fs = require('../../lib/fs-base');
var separator = fs.separator;

var tests = [
  ['', '', ''], ['.', '', ''], ['', '.', ''], ['.', '.', ''],
  ['', '..', '../'], ['', '../', '../'], ['a', 'b', 'b'],
  ['../a', '../b', 'b'], ['../a/b', '../a/c', 'c'], ['a/b', '..', '../../'],
  ['a/b', 'c', '../c'], ['a/b', 'c/d', '../c/d']
];

tests.forEach(function(args) {
  var source = args[0], target = args[1], expected = args[2];
  var name = '"' + source + '" -> "' + target + '" = "' + expected + '"';
  exports['test ' + name] = function() {
    var actual = fs.relative(source, target);
    // expect returned paths to use system-dependent file separator
    assert.strictEqual(expected.replace(/\//g, separator), actual);
  };
});

tests.forEach(function(args) {
  var source = args[0], target = args[1], expected = args[2];
  var name = '"' + source + '" -> "' + target + '" = "' + expected + '"';
  exports['testPath ' + name] = function() {
    var actual = fs.path(source).relative(target);
    // expect returned paths to use system-dependent file separator
    assert.strictEqual(expected.replace(/\//g, separator), actual.toString());
  };
});

if (require.main === module) {
  require("../../lib/test").run(exports);
}