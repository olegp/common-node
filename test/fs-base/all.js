exports.main = require('./main');
exports.path = require('./path');
exports.dirname = require('./dirname');
exports.extension = require('./extension');
exports.iterator = require('./iterator');
exports.normal = require('./normal');
exports.relative = require('./relative');
exports.resolve = require('./resolve');

if (require.main === module) {
  require("../../lib/test").run(exports);
}