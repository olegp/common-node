# Common Node

This package implements a number of [CommonJS](http://www.commonjs.org) 
proposals on top of [Node.js](http://nodejs.org) using 
[node-fibers](https://github.com/laverdet/node-fibers). Fibers are used to emulate multi-threading within a single process, allowing one to use a synchronous programming style and as a result:

* write fast CRUD webapps that run on Node.js without messy callbacks
* run [webapps, middleware and libraries](https://github.com/olegp/common-node/wiki) written for [RingoJS](http://ringojs.org), [Narwhal](http://narwhaljs.org/), [Akshell](http://www.akshell.com), [Erbix](http://www.erbix.com/), [Wakanda](http://www.wakanda.org/), [v8cgi](http://code.google.com/p/v8cgi/) and [other implementations](http://wiki.commonjs.org/wiki/Implementations)
* mix & match synchronous/asynchronous styles and use the best tool for the job by writing maintainable business logic in a synchronous manner
* write concise, legible shell scripts

The following modules are included:

* assert - [Unit Testing/1.0](httprin://wiki.commonjs.org/wiki/Unit_Testing/1.0) & a suite for running tests
* console - [Console](http://wiki.commonjs.org/wiki/Console) - partial implementation available in Node
* system - [System/1.0](http://wiki.commonjs.org/wiki/System/1.0) & methods for managing "threads" and child processes
* binary - [Binary/B](http://wiki.commonjs.org/wiki/Binary/B)
* io - [IO/A](http://wiki.commonjs.org/wiki/IO/A), including a `ByteArray` backed `MemoryStream`
* fs - [Filesystem/A](http://wiki.commonjs.org/wiki/Filesystem/A)
* jsgi - [JSGI 0.3](http://wiki.commonjs.org/wiki/JSGI/Level0/A/Draft2)
* httpclient - [HTTP Client/A](http://wiki.commonjs.org/wiki/HTTP_Client/A)
* subprocess - methods for launching subprocesses modeled after Ringo (work in progress)

### Installation

If you don't already have them, [install Node version 0.5.2 or later](https://github.com/joyent/node/wiki/Installation) (for Node 0.4.X check out the v0.4 branch of Common Node) and [Node Package Manager](http://npmjs.org). Install `common-node` as a global package:

    sudo npm -g install common-node  

Run the "Hello World" example:

    common-node $NODE_PATH/common-node/examples/hello.js

You shouldn't see any output. To test that it's working, make an HTTP request from another prompt:

    curl http://localhost:8080/


### Examples

A number of examples are available in [common-node/examples](https://github.com/olegp/common-node/tree/master/examples):

  * `hello.js` - Hello World webapp using JSGI to return a simple text response
  * `static.js` - streams a static file as a response
  * `http.js` - makes an HTTP request to another server and returns the result in the response
  * `sleep.js` -  sleeps for one second before returning a response
  * `spawn.js` -  spawns a new fiber which prints to stdout ten seconds after processing a request
  * `twitter.js` - an example of using Twitter's streaming API, uses HttpClient & TextStream for reading one line at a time

For more usage examples, please refer to the tests in the  [common-node/test](https://github.com/olegp/common-node/tree/master/test) directory.

### Documentation

The API reference is available at <http://olegp.github.com/common-node/doc/>

### Tests

To run the unit tests run:

    node test/all.js

You can also run individual tests or sets of tests, for example:

    node test/io.js
    node test/fs-base/all.js

### Benchmarks

Although `common-node` is optimized for development efficiency rather than performance, 
a number of benchmarks are included in [common-node/benchmarks](https://github.com/olegp/common-node/tree/master/benchmarks). 
A `common-node` version, an asynchronous Node version using Connect & a RingoJS version of each benchmark is provided. 
The scripts are based on the [Ringo/Node benchmark scripts](https://github.com/hns/ringo-node-benchmark), with a couple of additions.

The benchmarks have the following dependencies:

  * `connect` for Node which can be installed via npm
  * `ringo` which can be installed by following the instructions in the [RingoJS repository](https://github.com/ringo/ringojs)
  * `ab` - installed with `sudo apt-get install apache2-utils` on Debian/Ubuntu
  * `gnuplot` - installed with `sudo apt-get install gnuplot-nox`
  
To run them and generate graphs, execute the following command:

    cd benchmarks/; ./run; ./graph
    
This will generate PNG images of the graphs in `benchmarks/results/graphs/`. Some results are provided below: 

  * [buffer-alloc](http://olegp.github.com/common-node/graphs/buffer-alloc.png) - creates a number of byte arrays per request; the difference in performance compared to Node is due to the [array being cleared](https://github.com/olegp/common-node/issues/6)
  * [hello-world](http://olegp.github.com/common-node/graphs/hello-world.png) - returns a dynamically generated string
  * [no-alloc](http://olegp.github.com/common-node/graphs/no-alloc.png)
  * [parse-json](http://olegp.github.com/common-node/graphs/parse-json.png) 
  * [set-timeout](http://olegp.github.com/common-node/graphs/set-timeout.png) - sleep for 100ms before returning a response
  * [static-file](http://olegp.github.com/common-node/graphs/static-file.png) - returns a file served from the file system
  * [string-alloc](http://olegp.github.com/common-node/graphs/string-alloc.png)
  
As you can see from the results and given no profiling or optimization work has been done so far, there's room for improvement. 
Any patches or suggestions on how to improve performance would be greatly appreciated.
  
### Embedding

To use the package in your existing app, you will need to:

  * run your app with `node` instead of `common-node`
  * change the way in which you require modules from `var io = require('io');` to `var io = require('common-node').io;`
  
For example the following modified version of `examples/http.js` can be run directly via `node http.js`

    var HttpClient = require('httpclient').HttpClient;
    
    exports.app = function(request) {
  	  return {
    		status: 200,
    		headers: {},
    		body: new HttpClient({
    			url: 'http://google.com'
    		}).finish().body
    	};
    };
    
    if(require.main == module) {
    	require('common-node').run(exports);
    }

### Contributing

To contribute to this project, you can start by trying to run the tests on your system and posting your results (even if all tests pass) on the issue tracker.

If you run into any issues along the way, whether related to using this library
in your own project or to the documentation, please post your comments on the [issue tracker](https://github.com/olegp/common-node/issues/). The tracker is also a great place to contribute ideas and find out what needs doing.

If you're coming from Ringo or Narwhal, please try running the tests for some of your existing packages. If the tests pass and the packages is compatible with Common Node, feel free to add it to the [wiki](https://github.com/olegp/common-node/wiki).

Finally, to find specific issues not listed on the tracker, you can run the following command from inside the `common-node` directory.

    grep 'TODO' lib/*  

To contribute code: fork the project, make and commit your changes and send a pull request.

### Acknowledgements

  * Hannes Wallnoefer and others from [RingoJS](http://ringojs.org) - this project uses a number of its tests & the Ringo code was used as a starting point for some modules
  * Kris Kowal, Tom Robinson, Isaac Schlueter for [Narwhal](http://narwhaljs.org/) - this project used a number of its modules as a starting point and some methods in e.g. Binary have been copied as is
  * everybody on the [CommonJS](http://groups.google.com/group/commonjs) mailing list
    
### License 

(The MIT License)

Copyright (c) 2011 Oleg Podsechin

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

