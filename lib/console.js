/**
 * @fileOverview This module provides a familiar console object for logging and
 * debugging defined in [CommonJS
 * Console/A](http://wiki.commonjs.org/wiki/Console)
 */

/**
 * Logs a message to the console.
 * 
 * The first argument to log may be a string containing printf-like
 * placeholders. Otherwise, multipel arguments will be concatenated separated by
 * spaces.
 * 
 * @param msg... one or more message arguments
 * 
 * @name log
 */

/**
 * Logs a message with the visual "error" representation, including the file
 * name and line number of the calling code.
 * 
 * @param msg... one or more message arguments
 * @function
 * 
 * @name error
 */

/**
 * Logs a message with the visual "warn" representation, including the file name
 * and line number of the calling code.
 * 
 * @param msg... one or more message arguments
 * @function
 * 
 * @name warn
 */

/**
 * Logs a message with the visual "info" representation, including the file name
 * and line number of the calling code.
 * 
 * @param {...} msg... one or more message arguments
 * @function
 * 
 * @name info
 */

/**
 * Prints a stack trace of JavaScript execution at the point where it is called.
 * 
 * @param {...} msg... optional message arguments
 * @function
 * 
 * @name trace
 */

/**
 * Tests that an expression is true and throws an exception if not.
 * 
 * @param expression the expression to test
 * @param {...} msg... one or more error messages
 * @function
 * 
 * @name assert
 */

/**
 * Creates a new timer under the given name. Call `console.timeEnd(name)` with
 * the same name to stop the timer and log the time elapsed.
 * 
 * @param {String} name the timer name
 * 
 * @name time
 */

/**
 * Stops a timer created by a call to `console.time(name)` and logs the time
 * elapsed.
 * 
 * @param {String} name the timer name
 * 
 * @name timeEnd
 */

/**
 * Prints a list of all properties of an object.
 * 
 * @param {Object} obj the object
 * 
 * @name dir
 */
