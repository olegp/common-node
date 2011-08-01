var openRaw = require('fs-base').openRaw;
exports.app = function() {
  return { 
    status: 200, 
    headers: {'Content-Type': 'text/plain'}, 
    body:  openRaw('../README.md')
  };
};

if (require.main === module) {
  require("ringo/httpserver").main(module.id);
}
