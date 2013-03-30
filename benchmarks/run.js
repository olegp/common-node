var path = require("path");
var readline = require("readline");
var get = require("http").get;

var running = true;

function poke() {
  if (running) {
    try {
      get({host:'localhost', port:8080, agent:false}, function() {
        count++;
        setTimeout(poke, 0);
      }, function() {
        error++;
        setTimeout(poke, 0);
      });
    } catch (e) {
      error++;
      setTimeout(poke, 0);
    }
  }
}

if (require.main === module) {
  var benchmark = process.argv[2] + '/common-node.js';
  console.log('Launching "' + benchmark + '"...');
  var child = require('child_process').spawn('node', ['../lib/run', benchmark], {
    cwd:path.resolve(process.cwd(), './benchmarks')
  });

  var past = Date.now();
  var count = 0;
  var error = 0;
  var n = process.argv[3] || 20;
  for (var i = 0; i < n; i++) {
    setTimeout(poke, 0);
  }

  var previous = 0;
  var id = setInterval(function() {
    if (running) {
      var now = Date.now();
      var next = count;
      console.log((1e3 * (next - previous) / (now - past)).toFixed(2), ' req/s (' + error + ')');
      past = now;
      previous = next;
    } else {
      console.log('Cleaning up...');
      clearInterval(id);
      child.kill('SIGINT');
    }
  }, 10000);

  var r = readline.createInterface({
    input:process.stdin,
    output:process.stdout
  });
  r.question('Press ENTER to terminate...\n', function() {
    running = false;
    r.close();
  });
}