//exports['Assert']
//exports['Console']
//exports['System']
exports['Binary'] = require('./binary/all');
exports['IO'] = require('./io');
exports['Filesystem'] = require('./fs-base/all');
// exports['JSGI'] = require('./jsgi');
exports['HTTP Client'] = require('./httpclient');

if (require.main == module) {
	require("../lib/test").run(exports);
}
