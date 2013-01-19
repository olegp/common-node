var assert = require('../../lib/assert');
var fs = require('../../lib/fs-base');
var separator = fs.separator, roots = [separator];

var tests;
tests = [[['/'], '/'], [['/a'], '/a'], [['/a/'], '/a/'],
		[['/a', '/b'], '/b'], [['/a', '/b/'], '/b/'], [['/', 'a'], '/a'],
		[['/', 'a/'], '/a/'], [['/a', 'a'], '/a'], [['/a', 'a/'], '/a/'],
		[['/a/', 'a'], '/a/a'], [['/a/', 'a/'], '/a/a/'], [['..'], '../'],
		[['..', 'a'], '../a'], [['..', 'a/'], '../a/'], [['.'], ''],
		[['.', 'a'], 'a'], [['.', 'a/'], 'a/'], [['a', '.'], ''],
		[['a', '.', 'a'], 'a'], [['a', '.', 'a/'], 'a/'], [['a', '..'], '../'],
		[['a', '..', 'a'], '../a'], [['a', '..', 'a/'], '../a/'],
		[['a/', '..'], ''], [['a/', '..', 'a'], 'a'], [['a/', '..', 'a/'], 'a/'],
		[['a/b', ''], 'a/b'], ];

tests.forEach(function(args) {
	exports['test ' + JSON.stringify(args[0])] = function() {
		var result = fs.resolve.apply(null, args[0].map(localize));
		assert.strictEqual(localize(args[1]), result);
	};
});

function localize(path) {
	return path.replace(/^\//, roots[0]).replace(/\//g, separator);
}

if(require.main == module) {
	require("../../lib/test").run(exports);
}
