var openRaw = require('fs-base').openRaw;

exports.app = function() {
  return {
    status:200,
    headers:{'Content-Type':'text/plain; charset=utf-8'},
    body:openRaw('../README.md')
  };
};