/**
 * @fileoverview Provides global functions
 * import, include, export and spawn for RingoJS compatibility.</p>
 */

/**
 * Load a module and include all its properties in the calling scope.
 * 
 * @param {String} moduleName the module name such as 'core.object'
 */
global.include = exports.include = function(moduleName) {
	var module = this.require(moduleName);
	for( var key in module) {
		this[key] = module[key];
	}
};

/**
 * Define the properties to be exported.
 * 
 * @param name one or more names of exported properties
 */
global.export = exports.export = function() {
	var module = this;
	var exports = this.exports;
	if(!exports || typeof exports != "object") {
		// this should never happen
		exports = {};
		Object.defineProperty(module, "exports", {
			value: exports
		});
	}
	Array.forEach(arguments, function(name) {
		Object.defineProperty(exports, name, {
			get: function() {
				return module[name];
			},
			enumerable: true
		});
	});
};

// load system module
var system = global.system = require('./system');

/**
 * spawn() from the system module. Spawns a new thread.
 * 
 * @param {Function} run entry point of the new thread.
 */
global.spawn = exports.spawn = system.spawn;

// make our fiber instance available to other packages
global.Fiber = require("fibers");

// TODO add getResource
