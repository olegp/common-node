var openRaw = require('../lib/fs').openRaw;

exports.app = function(request) {
	return {
			status : 200,
			headers : {},
			body : openRaw('examples/static.js')
  };
}

if (require.main === module) {
  require('../lib/jsgi').run(exports);
}
