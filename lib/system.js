/**
 * @fileoverview System module compliant with the [CommonJS
 *               System/1.0](http://wiki.commonjs.org/wiki/System/1.0)
 *               specification. Additional non-standard methods for sleeping on
 *               the current thread, spawning a new thread and spawning
 *               processes are provided.
 */
var Fiber = require('fibers');
var io = require('./io');
var Stream = io.Stream, TextStream = io.TextStream;

/**
 * A TextStream to read from stdin.
 * 
 * @name stdin
 */
exports.stdin = new TextStream(new Stream(process.stdin));

/**
 * A TextStream to write to stdout.
 * 
 * @name stdout
 */
exports.stdout = new TextStream(new Stream(process.stdout));

/**
 * A TextStream to write to stderr.
 * 
 * @name stderr
 */
exports.stderr = new TextStream(new Stream(process.stderr));

/**
 * A utility function to write to stdout.
 */
exports.print = function() {
	exports.stdout.print.apply(exports.stdout, arguments);
};

/**
 * An array of strings representing the command line arguments passed to the
 * running script.
 */
exports.args = process.argv || [];

/**
 * An object containing our environment variables.
 */
exports.env = process.env;

/**
 * Terminates the current process.
 * 
 * @param {number}
 *            status The exit status, defaults to 0.
 */
exports.exit = function(status) {
	process.exit(status);
};

// non-standard methods below

/**
 * Used to register a callback which is called when the current process
 * terminates.
 * 
 * @param {Function}
 *            callback The callback to call.
 */
exports.onexit = function(callback) {
	process.on('SIGINT', function() { 
   spawn(callback);
  });
};

/**
 * Spawns a new thread.
 * 
 * @param {Function}
 *            run entry point of the new thread.
 */
var spawn = exports.spawn = function(run) {
	// TODO bring in line with RingoJS
  var fiber = Fiber(function() {
    try {
      run();
    } catch (e) {
      console.error(e.stack);
    }
  });
  fiber.run();
  return fiber;
};

exports.parallel = function(fibers) {
	var fiber = Fiber.current;
	var index = 0;
	fibers.forEach(function(r) {
		Fiber(function() {
			fiber.run([index ++, r()]);
		}).run();
	});
	var result = [];
	while(index --) {
		var r = Fiber.yield();
		result[r[0]] = r[1];
	}
	return result;
}

/**
 * Suspends the current process for the specified number of milliseconds.
 * 
 * @param {Number}
 *            milliseconds The number of milliseconds to sleep.
 */
exports.sleep = function(milliseconds) {
	// TODO bring in line with RingoJS
	var fiber = Fiber.current;
	setTimeout(function() {
		fiber.run();
	}, milliseconds);
	Fiber.yield();
};

global.getResource = function(name) {
	// TODO cache resources?
	var fs = require('fs-base');
	var resource = {
		lastModified : function() {
			return fs.lastModified(name);
		},
		length : fs.exists(name) ? fs.size(name) : 0,
		getInputStream : function() {
			return fs.openRaw(name);
		},
		getContent : function() {
			return this.content;
		},
		exists : function() {
			return fs.exists(name);
		}
	};

	Object.defineProperty(resource, "content", {
		get : function() {
			return fs.openRaw(name).read().decodeToString();
		}
	});

	return resource;
}

global.getRepository = function(name) {
	var fs = require('fs-base');
	return {
		_base : name,
		getResource : function(name) {
			return getResource(fs.normal(fs.join(this._base, name)));
		},
		setRoot : function() {
		}
	};
}
