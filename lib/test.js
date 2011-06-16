/**
 * @fileoverview Runs tests as defined in
 * [CommonJS Unit Testing](http://wiki.commonjs.org/wiki/Unit_Testing/1.0).
 */
var spawn = require('./system').spawn;

function testModule(module) {
  for (var test in module) {
    var element = module[test];
    if(typeof element == "function") { 
      try {
        element();
        console.log(test + ' PASSED');
      } catch(e) {
        console.log(test + ' FAILED "' + e.message + '"');
      }
    } else {
      console.log('');
      console.log(test);
      console.log('');
      testModule(element);
    }
  }
}

/**
 * Runs the tests in the module provided.
 * @param {Object} tests The module containing the tests.
 */
exports.run = function(tests) {
  spawn(function() {
    testModule(tests);
  });
}

if (require.main == module) {
  exports.run(require(process.argv[2]));
}

