var read = require('fs').read;

exports.app = function() {
  return {
    status:200,
    headers:{
      'Content-Type':'text/plain'
    },
    body:[read('../README.md', {binary:true})]
  };
};

if (require.main === module) {
  require("ringo/httpserver").main(module.id);
}