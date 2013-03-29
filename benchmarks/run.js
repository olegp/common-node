var system = require("system");
var fs = require("fs-base");
var get = require("ringo/httpclient").get;

var running = true;

function poke() {
  while (running) {
    try {
      get('http://localhost:8080/');
      count++;
    } catch (e) {
      error++;
    }
  }
}

if (require.main === module) {
  var benchmark = system.args[2] + '/common-node.js';
  console.log('Launching "' + benchmark + '"...');
  require('child_process').spawn('node', ['../lib/run', benchmark], {
    cwd:fs.absolute('./benchmarks')
  });
  console.log('Attacking...');

  var past = Date.now();
  var count = 0;
  var error = 0;
  for (var i = 0; i < 5; i++) {
    spawn(poke);
  }

  var previous = 0;
  setInterval(function() {
    var now = Date.now();
    var next = count;
    console.log((1e3 * (next - previous) / (now - past)).toFixed(2), ' req/s (' + error + ')');
    past = now;
    previous = next;
  }, 10000).unref();

  system.stdin.readLine();
  running = false;
}