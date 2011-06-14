var sleep = require('../lib/system').sleep;

exports.app = function(request) {
  sleep(1000);
	return {
			status : 200,
			headers : {},
			body : ['Hello Sleep!\n']
  };
}

if (require.main === module) {
  require('../lib/jsgi').run(exports);
}
