/**
 * @fileOverview Assertion library covering [CommonJS Unit
 *               Testing](http://wiki.commonjs.org/wiki/Unit_Testing/1.0).
 */

module.exports = require('assert');

/*******************************************************************************
* **** E R R O R S *****
******************************************************************************/

/**
* Constructs a new AssertionError instance
* 
* @class Instances of this class represent an assertion error
* @param {Object}
*          options An object containing error details
* @param.message {String} The error message
* @param.actual {Object} The actual value
* @param.expected {Object} The expected value
* @constructor
* @augments Error
* 
* @name AssertionError
*/

/**
* Creates a new ArgumentsError instance
* 
* @class Instances of this class represent an error thrown if insufficient
*        arguments have been passed to an assertion function
* @param {String}
*          message The exception message
* @returns A newly created ArgumentsError instance
* @constructor
* 
* @name ArgumentsError
*/

/*******************************************************************************
* **** C O M M O N J S A S S E R T I O N M E T H O D S *****
******************************************************************************/

/**
* Checks if the value passed as argument is truthy.
* 
* @param {Object}
*          value The value to check for truthiness
* @throws ArgumentsError
* @throws AssertionError
* 
* @name ok
*/


/**
* Checks if the values passed as arguments are equal.
* 
* @param {Object}
*          actual The actual value
* @param {Object}
*          expected The expected value
* @throws ArgumentsError
* @throws AssertionError
* 
* @name equal
*/

/**
* Checks if the values passed as arguments are not equal.
* 
* @param {Object}
*          actual The actual value
* @param {Object}
*          expected The expected value
* @throws ArgumentsError
* @throws AssertionError
* 
* @name notEqual
*/

/**
* Checks if the values passed as arguments are deep equal
* 
* @param {Object}
*          actual The actual value
* @param {Object}
*          expected The expected value
* @throws ArgumentsError
* @throws AssertionError
* 
* @name deepEqual
*/

/**
* Checks if the values passed as arguments are not deep equal
* 
* @param {Object}
*          actual The actual value
* @param {Object}
*          expected The expected value
* @throws ArgumentsError
* @throws AssertionError
* 
* @name notDeepEqual
*/

/**
* Checks if the values passed as arguments are strictly equal
* 
* @param {Object}
*          actual The actual value
* @param {Object}
*          expected The expected value
* @throws ArgumentsError
* @throws AssertionError
* 
* @name strictEqual
*/

/**
* Checks if the values passed as arguments are not strictly equal
* 
* @param {Object}
*          actual The actual value
* @param {Object}
*          expected The expected value
* @throws ArgumentsError
* @throws AssertionError
* 
* @name notStrictEqual
*/

/**
* Checks if the function passed as argument throws a defined exception.
* 
* @param {Object}
*          func The function to call
* @param {Object}
*          expectedError Optional object expected to be thrown when executing
*          the function
* @throws ArgumentsError
* @throws AssertionError
* 
* @name throws
*/