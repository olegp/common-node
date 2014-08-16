/**
 * @fileoverview Runs tests as defined in [CommonJS Unit
 * Testing](http://wiki.commonjs.org/wiki/Unit_Testing/1.0).
 */
var fs = require('fs');
var system = require('./system');
var inspect = require('util').inspect;

function formatException(e) {
  var msg = "";
  if ('message' in e) {
    msg += '"' + e.message + '"';
  }
  if ('operator' in e) {
    msg += '(' + inspect(e.actual);
    msg += ' ' + e.operator + ' ';
    msg += inspect(e.expected) + ')';
  }
  return msg;
}

function testModule(module, breakOnException) {
  var failures = [];
  for (var test in module) {
    var element = module[test];
    if (typeof element === "function") {
      try {
        element();
        console.log('PASSED        ' + test);
      } catch (e) {
        failures.push(test);
        if (breakOnException)
          break;
        console.log('       FAILED ' + test + '\n  ' + formatException(e));
      }
    } else {
      console.log('\n#' + test);
      testModule(element).forEach(function(name) {
        failures.push(test + '\t' + name);
      });
    }
  }
  return failures;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.fs = function(numOfFiles, test) {
  return function() {
    var dir = './tmp';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    var files = [];
    for (var i = 0; i < numOfFiles; i++) {
      files.push(dir + '/test' + getRandomInt(0, 1000000));
    }
    try {
      test.apply(null, files);
    } finally {
      files.forEach(function(file) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
      system.sleep(100);
      try {
        fs.rmdirSync(dir);
      } catch (e) {
        console.warn('test directory is not removed');
      }
    }
  };
};

/**
 * Runs the test function in the module provided. If the module doesn't export
 * function, recursively looks inside the exported objects and runs them as
 * tests as well. See 'test/all.js' for an example.
 *
 * @param {Object} tests The module containing the tests.
 * @param {Boolean} breakOnException Stop upon first failed test.
 */
exports.run = function(tests, breakOnException) {
  var domain = require('domain').create();
  domain.on('error', function(err) {
    console.log(err.stack);
  });
  domain.run(function() {
    system.spawn(function() {
      var failures = testModule(tests, breakOnException);
      console.log();
      console.log();
      if (failures.length === 0) {
        console.log('#### All Tests Passed ####');
      } else {
        console.log('!!!! Some Test Failed !!!!');
        console.log(failures.join('\n'));
      }
      process.exit(failures.length > 0 ? 1 : 0);
    });
  });
};

if (require.main === module) {
  exports.run(require(process.argv[2]));
}
