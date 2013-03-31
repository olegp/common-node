var assert = require('../../lib/assert');
var fs = require('../../lib/fs-base');

var tests = [
  ['', ''], ['.', ''], ['..', ''], ['.a', ''], ['..a', ''],
  ['.a.b', '.b'], ['a.b', '.b'], ['a.b.c', '.c'], ['/', ''], ['/.', ''],
  ['/..', ''], ['/..a', ''], ['/.a.b', '.b'], ['/a.b', '.b'],
  ['/a.b.c', '.c'], ['foo/', ''], ['foo/.', ''], ['foo/..', ''],
  ['foo/..a', ''], ['foo/.a.b', '.b'], ['foo/a.b', '.b'],
  ['foo/a.b.c', '.c'], ['/foo/', ''], ['/foo/.', ''], ['/foo/..', ''],
  ['/foo/..a', ''], ['/foo/.a.b', '.b'], ['/foo/a.b', '.b'],
  ['/foo/a.b.c', '.c']
];

tests.forEach(function(dirs) {
  exports['test "' + dirs[0] + '"'] = function() {
    var actual = fs.extension(dirs[0]);
    assert.strictEqual(dirs[1], actual);
  };
});

tests.forEach(function(dirs) {
  exports['testPath "' + dirs[0] + '"'] = function() {
    var actual = fs.path(dirs[0]).extension();
    assert.strictEqual(dirs[1], actual.toString());
  };
});

if (require.main === module) {
  require("../../lib/test").run(exports);
}