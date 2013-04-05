var readline = require("readline");
var http = require("http");
var spawn = require("child_process").spawn;

var options = {
  host:'localhost',
  port:8080,
  agent:new http.Agent()
};
var launchers = {
  c:function(test) {
    var benchmark = test + '/common-node.js';
    console.log('Launching "' + benchmark + '"...');
    return spawn('node', ['../lib/run', benchmark], {
      stdio:'inherit'
    });
  },
  n:function(test) {
    var benchmark = test + '/node.js';
    console.log('Launching "' + benchmark + '"...');
    return spawn('node', [benchmark], {
      stdio:'inherit'
    });
  }
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
  var launcher = process.argv[2] && process.argv[2].length > 0 && launchers[process.argv[2].charAt(0).toLowerCase()];
  if (process.argv.length < 3 || !launcher) {
    console.log('node run.js <common-node|node> <test name> [<concurrency>]');
    process.exit(1);
  }
  var child = launcher(process.argv[3]);
  process.on('uncaughtException', function(e) {
    console.error(e.stack);
    child.kill('SIGINT');
    process.exit(1);
  });

  var past = Date.now();
  var count = 0;
  var error = 0;
  var n = process.argv[4] || 20;
  console.log('Concurrency = ' + n);
  options.agent.maxSockets = n;
  for (var i = 0; i < n; i++) {
    setTimeout(poke, 1000);
  }

  var cur = 0, max = 10, pts = [];
  pts.sum = 0;
  pts.sqSum = 0;

  function pad(string, length) {
    return (new Array(Math.max(length + 1 - string.length, 0))).join(' ') + string;
  }

  var previous = 0;
  var id = setInterval(function() {
    var now = Date.now();
    var next = count;
    var p = 1e3 * (next - previous) / (now - past);
    var q = pts[cur] || 0;
    pts.sum += p - q;
    pts.sqSum += Math.pow(p, 2) - Math.pow(q, 2);
    pts[cur] = p;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    var s = pad(pts[cur].toFixed(2), 8);
    var mean = pts.sum / pts.length;
    s += '     ' + pad(mean.toFixed(2), 8);
    var sd = Math.sqrt(pts.sqSum / pts.length - Math.pow(mean, 2));
    s += ' +/- ' + pad(sd.toFixed(2), 6);
    process.stdout.write(s + ' req/s     (' + error + ')');
    past = now;
    previous = next;
    cur = (cur + 1) % max;
  }, 3000);

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