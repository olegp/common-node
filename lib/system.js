/**
 * @fileoverview <p>This module provides an implementation of the system module
 * compliant to the <a href="http://wiki.commonjs.org/wiki/System/1.0">CommonJS
 * System/1.0</a> specification.</p>
 * 
 * Additional non-standard methods for sleeping on the current thread,
 * spawning a new thread and spawning processes are provided.
 */
require('fibers');
var io = require('./io');
var Stream = io.Stream,
    TextStream = io.TextStream;

/**
 * A TextStream to read from stdin.
 * @name stdin
 */
exports.stdin = new TextStream(new Stream(process.stdin));

/**
 * A TextStream to write to stdout.
 * @name stdout
 */
exports.stdout = new TextStream(new Stream(process.stdout));

/**
 * A TextStream to write to stderr.
 * @name stderr
 */
exports.stderr = new TextStream(new Stream(process.stderr));
 
/**
 * A utility function to write to stdout.
 */
exports.print = function() {
  exports.stdout.print.apply(exports.stdout, arguments);
}

/**
 * An array of strings representing the command line arguments passed to the running script.
 */
exports.args = process.argv || [];

/**
 * An object containing our environment variables.
 */
exports.env = process.env;

/**
 * Terminates the current process.
 * @param {number} status The exit status, defaults to 0.
 */
exports.exit = function(status) {
  process.exit(status);
}

// non-standard methods below

/**
 * Spawns a new thread.
 * @param {Function} run entry point of the new thread.
 */
exports.spawn = function(run) {
   Fiber(run).run();
}

/**
 * Suspends the current process for the specified number of milliseconds.
 * @param {number} milliseconds The number of milliseconds to sleep.
 */
exports.sleep = function(milliseconds) {
  var fiber = Fiber.current;
  setTimeout(function() {
      fiber.run();
  }, milliseconds);
  yield();
}

exports.command = function() {
  //TODO implement
}

exports.createProcess = function() {
  //TODO implement
}


