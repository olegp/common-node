var fs = require('fs-base');
var ByteArray = require('binary').ByteArray;

fs.write('test.dat', new ByteArray(128 * 1024, false));
exports.app = function() {
  return {
    status:200,
    headers:{'Content-Type':'text/plain; charset=utf-8'},
    body:[fs.read('test.dat', {binary:true})]
  };
};