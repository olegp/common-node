/**
 * @fileoverview Collection of all modules.
 */

[
  'assert',
  'binary',
  'fs-base',
  'global',
  'httpclient',
  'httpserver',
  'io',
  'run',
  'socket',
  'subprocess',
  'system',
  'test',
  'ringo/httpclient'
].forEach(function(path) {
  exports[path] = require('./' + path);
});