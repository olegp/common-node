/**
 * @fileOverview Bootstraps Common Node.
 */

var remap = {
  'fs':'fs-base',
  'ringo/httpserver':'httpserver',
  'ringo/subprocess':'subprocess'
};

/**
 * Runs the specified module.
 *
 * @param main the module to run
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
  var protoRequire = proto.require;
  proto.require = function(name) {
    if (options.r) {
      name = remap[name] || name;
    }
    return all[name] || protoRequire.call(this, name);
  };
  var mainPath = main || argv[1];
  if (typeof mainPath === 'string') {
    mainPath = path.resolve(process.cwd(), mainPath);
  } else {
    mainPath = process.cwd();
  }
  var protoLoad = proto.load;
  proto.load = function(filename) {
    if (filename === mainPath)
      process.mainModule = this;
    return protoLoad.call(this, filename);
  };

  if (options.u) {
    process.on('uncaughtException', function(err) {
      console.log(err.stack);
    });
  }

  if (options.v) {
    spawn(function() {
      var fs = require('./fs-base');
      var p = fs.resolve(fs.directory(module.filename), 'package.json');
      console.log('v' + JSON.parse(fs.openRaw(p).read().decodeToString()).version);
    });
  } else if (options.e) {
    argv.shift();
    spawn(function() {
      argv.forEach(function(e) {
        eval(e);
      });
    });
  } else if (argv.length > 1) {
    spawn(function() {
      if (typeof main === 'function') {
        main();
      } else {
        var module = require(mainPath);
        if (module.app) {
          var httpserver = require('./httpserver');
          if (!httpserver.started) {
            httpserver.main(module.app, argv[2], {cluster:argv[3]});
          }
        }
      }
    });
  } else {
    var system = require('./system');
    require = function(name) {
      try {
        return proto.require.call(this, name);
      } catch (e) {
        return protoRequire.call(this, path.resolve(process.cwd(), name));
      }
    };
    var line;
    spawn(function() {
      do {
        system.stdout.write('> ');
        line = system.stdin.readLine();
        if (line) {
          try {
            console.log(eval(line));
          } catch (e) {
            console.log(e.stack);
          }
        }
      } while (line);
    });
  }
};

if (require.main === module) {
  process.argv.shift(); // remove node, which is first arg
  run();
}