exports.app = function(request) {
  return {
    status : 200,
    headers : {},
    body : ['Hello World!\n']
  };
}

if (require.main === module) {
  //TODO get this to work globally as well
  require('../lib/jsgi').run(exports, 1443, {key: null, cert: null});
}
