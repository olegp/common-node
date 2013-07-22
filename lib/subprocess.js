/**
 * @fileOverview A module for spawning processes, connecting to their
 * input/output/errput and returning their response codes.
 */
var Fiber = require('fibers');
var childProcess = require('child_process');

var io = require('./io');
var Stream = io.Stream, TextStream = io.TextStream;
var system = require('./system');

function parseArguments(args) {
	args = Array.prototype.slice.call(args);
	// arguments may end with a {dir: "", env: {}} object
	var opts = (args.length > 1 && args[args.length - 1] instanceof Object) ? args.pop() : {};
	// make command either a single string or an array of strings
	opts.command = args.length === 1 ? args[0] : args;
	return opts;
}

function asyncCopy(from, to) {
	system.spawn(function() {
		from.copy(to);
	});
}

/**
 * Low-level function to spawn a new process. The function takes an object
 * argument containing the following properties where all properties except
 * command are optional:
 *
 * `command` a string or array of strings containing the command to execute
 *
 * `dir` the directory to run the process in
 *
 * `env` alternative environment variables. If null the process inherits the
 * environment of the current process.
 *
 * `binary` a boolean flag that uses raw binary streams instead of text streams
 *
 * `encoding` the character encoding to use for text streams
 *
 * @param {Object} args an object containing the process command and options.
 * @returns a Process object
 * @see #Process
 */
var createProcess = exports.createProcess = function(args) {
	var binary = args.binary, encoding = args.encoding;
	var procArgs = args.command;
	if (typeof procArgs === 'string') {
		procArgs = procArgs.split(/\s+/g);
	} else {
		procArgs = Array.prototype.map.call(procArgs, String);
	}

	var code;
	var waiting;

	function handleExit(c) {
		code = c;
		if (waiting) {
			var fiber = waiting;
			waiting = null;
			fiber.run();
		}
	}

	var child = childProcess.spawn(procArgs.shift(), procArgs, {
		cwd:args.dir || process.cwd(),
		env:args.env || system.env
	}).on('error', function(e) {
		// Node.js won't end these streams upon error
		stdout._end();
		stderr._end();
		handleExit(e.code);
	}).on('exit', handleExit);

	var stdin = new Stream(child.stdin);
	var stdout = new Stream(child.stdout);
	var stderr = new Stream(child.stderr);

	function wrapIO(stream) {
		return binary ? stream : new TextStream(stream, {
			charset:encoding
		});
	}

	/**
	 * The Process object can be used to control and obtain information about a
	 * subprocess started using [createProcess()](#createProcess).
	 *
	 * @name Process
	 * @class Process
	 */
	return {
		/**
		 * The PID of the child process. Note: this is not available in Ringo.
		 *
		 * @name Process.prototype.pid
		 */
		pid:child.pid,
		/**
		 * The process's input stream.
		 *
		 * @name Process.prototype.stdin
		 */
		stdin:wrapIO(stdin),
		/**
		 * The process's output stream.
		 *
		 * @name Process.prototype.stdout
		 */
		stdout:wrapIO(stdout),
		/**
		 * The process's error stream.
		 *
		 * @name Process.prototype.stderr
		 */
		stderr:wrapIO(stderr),
		/**
		 * Wait for the process to terminate and return its exit status.
		 *
		 * @name Process.prototype.wait
		 * @function
		 */
		wait:function() {
			if (typeof code === 'undefined') {
				waiting = Fiber.current;
				Fiber.yield();
			}
			return code;
		},
		/**
		 * Kills the subprocess.
		 *
		 * @name Process.prototype.kill
		 * @param signal SIGTERM, SIGHUP
		 * @function
		 */
		kill:function(signal) {
			child.kill(signal);
		},
		/**
		 * Connects the process's steams to the argument streams and starts threads
		 * to copy the data asynchronously.
		 *
		 * @param {Stream} input output stream to connect to the process's input stream
		 * @param {Stream} output input stream to connect to the process's output stream
		 * @param {Stream} errput input stream to connect to the process's error stream
		 * @name Process.prototype.connect
		 */
		connect:function(input, output, errput) {
			// TODO test connect
			if (input) {
				asyncCopy(input, stdin);
			}
			if (output) {
				asyncCopy(stdout, output);
			}
			if (errput) {
				asyncCopy(stderr, errput);
			}
		}
	};
};

/**
 * Executes a given command and returns the standard output. If the exit status
 * is non-zero, throws an Error.
 *
 * @param {String} command ... command and optional arguments as single or
 * multiple string parameters
 * @param {Object} [options] options object. This may contain a `dir` string
 * property specifying the directory to run the process in and a `env` object
 * property specifying additional environment variable mappings.
 * @returns String the standard output of the command
 */
var command = exports.command = function(command, options) {
	var args = parseArguments(arguments);
	var process = createProcess(args);
	var status = process.wait();
	if (status !== 0) {
		throw new Error("(" + status + ")\n" + process.stderr.read());
	}
	return process.stdout.read();
};

/**
 * Executes a given command, attached to this process's output and error
 * streams, and returns the exit status.
 *
 * @param {String} command ... command and optional arguments as single or
 * multiple string parameters
 * @param {Object} [options] options object. This may contain a `dir` string
 * property specifying the directory to run the process in and a `env` object
 * property specifying additional environment variable mappings.
 * @returns Number exit status
 */
exports.system = function(command, options) {
	var args = parseArguments(arguments);
	var process = createProcess(args);
	var output = system.stdout.raw;
	var errput = system.stderr.raw;
	process.connect(null, output, errput);
	return process.wait();
};

/**
 * Executes a given command quietly and returns the exit status.
 *
 * @param {String} command ... command and optional arguments as single or
 * multiple string parameters
 * @param {Object} [options] options object. This may contain a `dir` string
 * property specifying the directory to run the process in and a `env` object
 * property specifying additional environment variable mappings.
 * @returns Number exit status
 * @name status
 */
var status = exports.status = function(command, options) {
	var process = createProcess(parseArguments(arguments));
	process.connect(null, dummyStream(), dummyStream());
	return process.wait();
};

function dummyStream() {
	return {
		writable:function() {
			return true;
		},
		readable:function() {
			return false;
		},
		seekable:function() {
			return false;
		},
		write:function() {
			return this;
		},
		flush:function() {
			return this;
		},
		close:function() {
			return this;
		}
	};
}