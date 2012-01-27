/**
 * @fileOverview Bootstraps Common Node.
 */

/**
 * Runs the specified module.
 * 
 * @param main the module to run
 */
var run = module.exports = function(main) {
	var options = {}, argv = [];
	process.argv.forEach(function(arg) {
		if(!arg.indexOf('-')) {
			options[arg.substr(1)] = true;
		} else {
			argv.push(arg);
		}
	});
	var path = require('path');
	require('./all');
	if(options.v) {
		spawn(function() {
			var fs = require('./fs-base');
			// TODO look into resolve(), this code relies on some odd behavior in it
			var p = fs.resolve(fs.directory(module.filename), 'package.json');
			console.log('v'
					+ JSON.parse(fs.openRaw(p).read().decodeToString()).version);
		});
		return;
	}
	if(options.t) {
		require('traceur');
	}
	if(argv.length > 1) {
		spawn(function() {
			try {
				main = main || require(path.resolve(process.cwd(), argv[1]));
				if(main.app) {
					require('./jsgi').run(main.app, argv[2] || 8080);
				}
			} catch(e) {
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
				if(line = system.stdin.readLine()) {
					try {
						console.log(eval(line));
					} catch(e) {
						console.log(e.toString());
					}
				}
			} while(line);
		});
	}
};

if(require.main == module) {
	process.argv.shift(); // remove node, which is first arg
	run();
}
