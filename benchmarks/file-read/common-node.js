var read = require('fs-base').read;

exports.app = function() {
  return {
    status:200,
    headers:{'Content-Type':'text/plain; charset=utf-8'},
    body:[read('../README.md', {binary:true})]
  };
};