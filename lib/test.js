/**
 * @fileoverview Runs tests as defined in
 * [CommonJS Unit Testing](http://wiki.commonjs.org/wiki/Unit_Testing/1.0).
 */
var spawn = require('./system').spawn;

/**
 * Runs the tests in the module provided.
 * @param {Object} tests The module containing the tests.
 */
exports.run = function(tests) {
  spawn(function() {
    for (var test in tests) {
      try {
        tests[test]();
        console.log(test + ' PASSED');
      } catch(e) {
        console.log(test + ' FAILED "' + e.message + '"');
      }
    }
  });
}

if (require.main == module) {
  exports.run(require(process.argv[2]));
}

