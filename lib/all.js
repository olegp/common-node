/**
 * @fileoverview Collection of all modules.
 */

//TODO include example in docs

var modules = ['assert', 'binary', 'fs-base', 'httpclient', 'io', 'jsgi',
		'system', 'test', 'global', 'run'];

for( var i = 0; i < modules.length; i++) {
	exports[modules[i]] = require('./' + modules[i]);
}
