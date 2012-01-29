/**
 * @fileoverview Runs tests as defined in [CommonJS Unit
 * Testing](http://wiki.commonjs.org/wiki/Unit_Testing/1.0).
 */
var spawn = require('./system').spawn;
var inspect = require('util').inspect;

function formatException(e) {
	var msg = "";
	if (e.message !== undefined) {
		msg += '"' + e.message + '"';
	}
	if (e.operator !== undefined) {
		msg += '(' + inspect(e.actual);
		msg += ' ' + e.operator + ' ';
		msg += inspect(e.expected) + ')';
	}
	return msg;
}

function testModule(module, breakOnException) {
	for( var test in module) {
		var element = module[test];
		if(typeof element == "function") {
			try {
				element();
				console.log(test + ' PASSED');
			} catch(e) {
				if(breakOnException) throw e;
				console.log(test + ' FAILED ' + formatException(e));
			}
		} else {
			console.log('#' + test);
			testModule(element);
		}
	}
}

/**
 * Runs the test function in the module provided. If the module doesn't export
 * function, recursively looks inside the exported objects and runs them as
 * tests as well. See 'test/all.js' for an example.
 *
 * @param {Object} tests The module containing the tests.
 */
exports.run = function(tests, breakOnException) {
	spawn(function() {
		testModule(tests, breakOnException);
	});
};

if(require.main == module) {
	exports.run(require(process.argv[2]));
}
