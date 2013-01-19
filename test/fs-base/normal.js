var assert = require('../../lib/assert');
var fs = require('../../lib/fs-base');
var separator = fs.separator;

var tests;
tests = [['', ''], ['.', ''], ['./', ''], ['../', '../'], ['../a', '../a'],
		['../a/', '../a/'], ['a/..', ''], ['a/../', ''], ['a/../b', 'b'],
		['a/../b/', 'b/'], ];

tests.forEach(function(args) {
	exports['test "' + args[0] + '"'] = function() {
		var result = fs.normal(localize(args[0]));
		assert.strictEqual(localize(args[1]), result);
	};
});

// adapt path to the platform we're running on
function localize(path) {
	return path.replace(/\//g, separator);
}

if(require.main == module) {
	require("../../lib/test").run(exports);
}
