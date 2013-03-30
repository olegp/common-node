var path = require("path");
var readline = require("readline");
var http = require("http");

var options = {
  host:'localhost',
  port:8080,
  agent:new http.Agent()
};
var running = true;

function noop() {
}

function poke() {
  if (running) {
    var first = true;
    function next() {
      if (first) {
        first = false;
        count++;
        setTimeout(poke, 0);
      }
    }
    function err() {
      if (first) {
        first = false;
        error++;
        setTimeout(poke, 1000);
      }
    }
    http.get(options, function(response) {
      response.on('error', err).on('end', next).on('close', err).resume();
    }).on('error', err);
  }
}

if (require.main === module) {
  var benchmark = process.argv[2] + '/common-node.js';
  console.log('Launching "' + benchmark + '"...');
  var child = require('child_process').spawn('node', ['../lib/run', benchmark], {
    cwd:path.resolve(process.cwd(), './benchmarks'),
    stdio:'inherit'
  });

  var past = Date.now();
  var count = 0;
  var error = 0;
  var n = process.argv[3] || 20;
  options.agent.maxSockets = n;
  for (var i = 0; i < n; i++) {
    setTimeout(poke, 1000);
  }

  var previous = 0;
  var id = setInterval(function() {
    var now = Date.now();
    var next = count;
    console.log((1e3 * (next - previous) / (now - past)).toFixed(2), ' req/s (' + error + ')');
    past = now;
    previous = next;
  }, 10000);

  var r = readline.createInterface({
    input:process.stdin,
    output:process.stdout
  });
  r.question('Press ENTER to terminate...\n', function() {
    running = false;
    r.close();
    console.log('Cleaning up...');
    clearInterval(id);
    setTimeout(function() {
      child.kill('SIGINT');
    }, 5000);
  });
}