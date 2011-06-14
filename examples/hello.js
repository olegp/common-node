exports.app = function(request) {
  return {
    status : 200,
    headers : {},
    body : ['Hello World!an']
  };
}

if (require.main === module) {
  //TODO get this to work globally as well
  require('../lib/jsgi').run(exports);
}
