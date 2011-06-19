var modules = ['assert', 'binary', 'fs-base', 'httpclient', 
                'io', 'jsgi', 'system', 'test', 'global'];
                
for(var i = 0; i < modules.length; i ++) {
  exports[modules[i]] = require('./' + modules[i]);
}

