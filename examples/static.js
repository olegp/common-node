var openRaw = require('fs-base').openRaw;

exports.app = function(request) {
  return {
    status: 200,
    headers: {},
    body: openRaw(module.filename)
  };
}
