/**
 * @fileoverview Collection of all modules.
 */

//TODO include example in docs
//TODO deprecate this in favor of require(commonjs + 'fs-base');

var modules = ['assert', 'binary', 'fs-base', 'httpclient', 'io', 'httpserver',
		'system', 'test', 'global', 'run', 'subprocess', 'socket', 'ringo/httpclient'];

for( var i = 0; i < modules.length; i++) {
	exports[modules[i]] = require('./' + modules[i]);
}

exports.modules = modules;
