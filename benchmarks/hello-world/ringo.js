exports.app = function() {
  return { 
    status : 200, 
    headers : {'Content-Type': 'text/plain'}, 
    body : ['Hello World!\n'] 
  };
}

if (require.main === module) {
  require("ringo/httpserver").main(module.id);
}
