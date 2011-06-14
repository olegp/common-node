var openRaw = require('../lib/fs').openRaw;
require('../lib/jsgi').run(function() {
  return { 
    status: 200, 
    headers: {'Content-Type': 'text/plain'}, 
    body:  openRaw('README.md')
  };
}, 8080);
