# Common Node

This package implements a number of [CommonJS](http://www.commonjs.org) 
proposals on top of [Node.js](http://nodejs.org) using 
[node-fibers](https://github.com/laverdet/node-fibers). Fibers are used to emulate multi-threading within a single process, allowing one to use a synchronous programming style and as a result:

* write fast CRUD webapps that run on Node.js without messy callbacks
* run webapps, middleware and libraries written for [RingoJS](http://ringojs.org) and [other implementations](http://wiki.commonjs.org/wiki/Implementations)
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

### Installation

If you don't already have them, [install Node](https://github.com/joyent/node/wiki/Installation) and the [Node Package Manager npm](http://npmjs.org):

    curl http://npmjs.org/install.sh | sh

Using `npm` install a global copy of `node-fibers` as root:

    sudo npm install -g fibers 

To install the latest version of `common-node`, clone the repository (an npm package will be made available once we have a stable release):

    git clone git://github.com/olegp/common-node.git

Change to the package directory and run the "Hello World" example server:

    cd common-node; node-fibers examples/hello.js

To test that it's working as expected, make an HTTP request from another prompt:

    curl http://localhost:8080/

To install `common-node` as a global package:

    sudo npm -g install .

### Examples

A number of examples are available in [common-node/examples](https://github.com/olegp/common-node/tree/master/examples):

  * `hello.js` - Hello World webapp using JSGI to return a simple text response
  * `static.js` - streams a static file as a response
  * `http.js` - makes an HTTP request to another server and returns the result in the response
  * `sleep.js` -  sleeps for one second before returning a response
  * `spawn.js` -  spawns a new fiber which prints to stdout ten seconds after processing a request

For more usage examples, please refer to the tests in the  [common-node/test](https://github.com/olegp/common-node/tree/master/test) directory.

### Documentation

The API reference is available at <http://olegp.github.com/common-node/doc/>

### Tests

To run the unit tests execute the following command:

    node-fibers test/all.js

You can also run individual tests or sets of tests, for example:

    node-fibers test/io.js
    node-fibers test/fs-base/all.js

### Benchmarks

Although `common-node` is optimized for developer efficiency rather than performance, a number of benchmarks are included in [common-node/benchmarks](https://github.com/olegp/common-node/tree/master/benchmarks). A `common-node` version and an asynchronous version using Connect of each benchmark are provided.

  * hello - returns a dynamically generated string; common is around 50% of plain, 66% of connect
  * static - returns a file served from the file system; common is a few percent faster than connect
  * http - makes a request to google and returns the response
  
### Contributing

To contribute to this project, you can start by trying to run the tests on your system and posting your results (even if all tests pass) on the issue tracker.
The installation of `node-fibers` has been particularly problematic,
so if you run into problems with it, please post an issue on that project's [issue tracker](https://github.com/laverdet/node-fibers/issues/).

If you run into any issues along the way, whether related to using this library
in your own project or to the documentation, please post your comments on the [issue tracker](https://github.com/olegp/common-node/issues/).

The issue tracker is also a great place to contribute ideas and find out what needs doing.

Finally, to find specific issues not listed on the tracker, you can run the following command from inside the `common-node` directory.

    grep 'TODO' lib/*  

To contribute code: fork the project, make and commit your changes and send a pull request.

### Acknowledgements

  * Hannes Wallnoefer and others from [RingoJS](http://ringojs.org) - this project uses a number of its tests & the Ringo code was used as a starting point for some modules
  * Kris Kowal, Tom Robinson, Isaac Schlueter for [Narwhal](http://narwhaljs.org/) - this project used a number of its modules as a starting point and some methods in e.g. Binary have been copied as is
  * everybody on the [CommonJS](http://groups.google.com/group/commonjs) mailing list 
