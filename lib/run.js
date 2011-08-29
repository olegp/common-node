/**
 * @fileOverview Bootstraps Common Node.
 */

//TODO add REPL support

var run = module.exports = function(main) {
	var path = require('path');
	require('./global');
	spawn(function() {
		try {
			main = main || require(path.resolve(process.cwd(), process.argv[1]));
			if(main.app) {
				require('./jsgi').run(main.app, process.argv[2] || 8080);
			}
		} catch(e) {
			e.stack = e.stack.split('\n').slice(0, -6).join('\n');
			console.error(e.stack);
		}
	});
};

if(require.main == module) {
	process.argv.shift(); // remove node, which is first arg
	if(process.argv.length < 2) {
		console.log('usage: "common-node module [port]", e.g. "common-node main.js"');
		console
				.log('if module has exports.app, an HTTP server is started on the [port] provided or 8080 by default');
	} else {
		run();
	}
}
