/**
 * @fileOverview Bootstraps Common Node.
 */

var remap = {
  'fs': 'fs-base',
  'ringo/httpserver': 'httpserver',
  'ringo/subprocess': 'subprocess'
};

/**
 * Runs the specified module.
 * 
 * @param main
 *            the module to run
 */
var run = module.exports = function(main) {
  var options = {}, argv = [];
  process.argv.forEach(function(arg) {
    if (!arg.indexOf('-')) {
      options[arg.substr(1)] = true;
    } else {
      argv.push(arg);
    }
  });
  var path = require('path');
  var all = require('./all');

  var proto = require('module').prototype;
  var orig = proto.require;
  proto.require = function(path) {
    path = remap[path] || path;
    return ~all.modules.indexOf(path) ? all[path] : orig.call(this, path);
  };

  if (options.v) {
    spawn(function() {
      var fs = require('./fs-base');
      var p = fs.resolve(fs.directory(module.filename), 'package.json');
      console.log('v'
          + JSON.parse(fs.openRaw(p).read().decodeToString()).version);
    });
    return;
  }

  if (argv.length > 1) {
    spawn(function() {
      try {
        if (typeof main == 'function') {
          main();
        } else {
          var module = require(path.resolve(process.cwd(), main || argv[1]));
          if (module.app) {
            require('./jsgi').run(module.app, argv[2] || 8080);
          }
        }
      } catch (e) {
        // e.stack = e.stack.split('\n').slice(0, -7).join('\n');
        console.error(e.stack);
      }
    });
  } else {
    var system = require('./system');
    var line;
    spawn(function() {
      do {
        system.stdout.write('> ');

        if (line = system.stdin.readLine()) {
          try {
            console.log(eval(line));
          } catch (e) {
            console.log(e.toString());
          }
        }
      } while (line);
    });
  }
};

if (require.main == module) {
  process.argv.shift(); // remove node, which is first arg
  run();
}
