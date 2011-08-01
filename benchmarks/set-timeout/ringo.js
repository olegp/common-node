exports.app = function() {
	java.lang.Thread.sleep(100);
  return { 
    status : 200, 
    headers : {}, 
    body : [] 
  };
};

if (require.main === module) {
  require("ringo/httpserver").main(module.id);
}
