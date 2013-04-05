var sleep = require('system').sleep;

exports.app = function() {
  sleep(20);
  return {
    status:200,
    headers:{},
    body:[]
  };
};