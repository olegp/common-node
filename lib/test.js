var spawn = require('./system').spawn;

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

