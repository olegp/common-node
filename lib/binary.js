/**
 * @fileoverview Binary, ByteArray and ByteString classes as defined in
 * [CommonJS Binary/B](http://wiki.commonjs.org/wiki/Binary/B).
 */

var encodings = {
	'US-ASCII': 'ascii',
	'UTF-8': 'utf8',
	'ISO-10646-UCS-2': 'ucs2'
};

/**
 * Abstract base class for ByteArray and ByteString
 * 
 * @constructor
 */
var Binary = exports.Binary = function() {
};

/**
 * Constructs a writable and growable byte array.
 * 
 * If the first argument to this constructor is a number, it specifies the
 * initial length of the ByteArray in bytes.
 * 
 * Else, the argument defines the content of the ByteArray. If the argument is a
 * String, the constructor requires a second argument containing the name of the
 * String's encoding. If called without arguments, an empty ByteArray is
 * returned.
 * 
 * The constructor also accepts a <a
 * href="http://nodejs.org/docs/v0.4.8/api/buffers.html#buffers">Node.js Buffer</a>.
 * 
 * Also, if you pass in Number as the first argument and "false" as the second,
 * then the newly created array will not be cleared.
 * 
 * @param {Binary|Array|String|Number|Buffer} contentOrLength content or length
 * of the ByteArray.
 * @param {String} [charset] the encoding name if the first argument is a
 * String.
 * @constructor
 */
var ByteArray = exports.ByteArray = function() {
	if(!(this instanceof ByteArray)) {
		if(arguments.length == 0)
			return new ByteArray();
		if(arguments.length == 1)
			return new ByteArray(arguments[0]);
		if(arguments.length == 2)
			return new ByteArray(arguments[0], arguments[1]);
	}

	// ByteArray() - construct an empty byte string
	if(arguments.length === 0) {
		this.buffer = new Buffer(0);
	}
	// ByteArray(length) - create ByteArray of specified size
	else if(arguments.length === 1 && typeof arguments[0] === "number") {
		this.buffer = new Buffer(arguments[0]);
		this.buffer.fill(0);
	}
	// ByteArray(length) - create ByteArray of specified size, but don't clear
	else if(arguments.length === 2 && typeof arguments[0] === "number"
			&& typeof arguments[1] === "boolean") {
		this.buffer = new Buffer(arguments[0]);
		if(arguments[1] === true) {
			this.buffer.fill(0);
		}
	}
	// ByteArray(byteString or byteArray) - use the contents of byteString or
	// byteArray
	else if(arguments.length === 1
			&& (arguments[0] instanceof ByteString || arguments[0] instanceof ByteArray)) {
		var source = arguments[0];
		this.buffer = new Buffer(source.length);
		source.buffer.copy(this.buffer);
	}
	// ByteArray(arrayOfNumbers) - use the numbers in arrayOfNumbers as the bytes
	else if(arguments.length === 1 && Array.isArray(arguments[0])) {
		this.buffer = new Buffer(arguments[0]);
	}
	// ByteArray(buffer) - use contents of buffer
	else if(arguments.length === 1 && arguments[0] instanceof Buffer) {
		var buffer = arguments[0];
		this.buffer = new Buffer(buffer.length);
		buffer.copy(this.buffer);
	}
	// ByteArray(string, charset) - convert a string - the ByteArray will contain
	// string encoded with charset
	else if((arguments.length === 1 || (arguments.length === 2 && arguments[1] === undefined))
			&& typeof arguments[0] === "string") {
		this.buffer = new Buffer(arguments[0]);
	} else if(arguments.length === 2 && typeof arguments[0] === "string"
			&& typeof arguments[1] === "string") {
		this.buffer = new Buffer(arguments[0], encodings[arguments[1]]);
	} else {
		throw new Error("Illegal arguments to ByteArray constructor");
	}

	return this;
};

ByteArray.prototype = new Binary();

Object.defineProperty(ByteArray.prototype, 'length', {
	get: function() {
		return this.buffer.length;
	},
	set: function(length) {
		var buffer = new Buffer(length);
		length = Math.min(this.buffer.length, length);
		this.buffer.copy(buffer, 0, 0, length);
		buffer.fill(0, length);
		this.buffer = buffer;
	}
});

/**
 * Constructs an immutable byte string.
 * 
 * If the first argument is a String, the constructor requires a second argument
 * containing the name of the String's encoding. If called without arguments, an
 * empty ByteString is returned.
 * 
 * The constructor also accepts a <a
 * href="http://nodejs.org/docs/v0.4.8/api/buffers.html#buffers">Node.js Buffer</a>.
 * 
 * @param {Binary|Array|String|Buffer} content the content of the ByteString.
 * @param {String} charset the encoding name if the first argument is a String.
 * @constructor
 */
var ByteString = exports.ByteString = function() {
	if(!(this instanceof ByteString)) {
		if(arguments.length == 0)
			return new ByteString();
		if(arguments.length == 1)
			return new ByteString(arguments[0]);
		if(arguments.length == 2)
			return new ByteString(arguments[0], arguments[1]);
	}

	// ByteString() - construct an empty byte string
	if(arguments.length === 0) {
		this.buffer = new Buffer(0);
	}
	// ByteString(byteString) - returns byteString, which is immutable
	else if(arguments.length === 1 && arguments[0] instanceof ByteString) {
		return arguments[0];
	}
	// ByteString(byteArray) - use the contents of byteArray
	else if(arguments.length === 1 && arguments[0] instanceof ByteArray) {
		var source = arguments[0];
		this.buffer = new Buffer(source.length);
		source.buffer.copy(this.buffer);
	}
	// ByteString(buffer) - use contents of buffer
	else if(arguments.length === 1 && arguments[0] instanceof Buffer) {
		var buffer = arguments[0];
		this.buffer = new Buffer(buffer.length);
		buffer.copy(this.buffer);
	}
	// ByteString(arrayOfNumbers) - use the numbers in arrayOfNumbers as the bytes
	else if(arguments.length === 1 && Array.isArray(arguments[0])) {
		this.buffer = new Buffer(arguments[0]);
	}
	// ByteString(string, charset) - convert a string - the ByteString will
	// contain string encoded with charset
	else if((arguments.length === 1 || (arguments.length === 2 && arguments[1] === undefined))
			&& typeof arguments[0] === "string") {
		this.buffer = new Buffer(arguments[0]);
	} else if(arguments.length === 2 && typeof arguments[0] === "string"
			&& typeof arguments[1] === "string") {
		this.buffer = new Buffer(arguments[0], encodings[arguments[1]]);
	} else {
		throw new Error("Illegal arguments to ByteString constructor"
				+ JSON.stringify(arguments));
	}

	return this;
};

ByteString.prototype = new Binary();

Object.defineProperty(ByteString.prototype, 'length', {
	get: function() {
		return this.buffer.length;
	},
	set: function() {
	}
});

/**
 * Converts the String to a mutable ByteArray using the specified encoding.
 * 
 * @param {String} charset the name of the string encoding. Defaults to 'UTF-8'
 * @returns a ByteArray representing the string
 */
String.prototype.toByteArray = function(charset) {
	charset = charset || 'UTF-8';
	return new ByteArray(String(this), charset);
};

/**
 * Converts the String to an immutable ByteString using the specified encoding.
 * 
 * @param {String} charset the name of the string encoding. Defaults to 'UTF-8'
 * @returns a ByteArray representing the string
 */
String.prototype.toByteString = function(charset) {
	charset = charset || 'UTF-8';
	return new ByteString(String(this), charset);
};

/**
 * Reverses the content of the ByteArray in-place
 * 
 * @returns {ByteArray} this ByteArray with its elements reversed
 */
ByteArray.prototype.reverse = function() {
	// "limit" is halfway, rounded down. "top" is the last index.
	var limit = Math.floor(this.length / 2), top = this.length - 1;

	// swap each pair of bytes, up to the halfway point
	for( var i = 0; i < limit; i++) {
		var tmp = this.buffer[i];
		this.buffer[i] = this.buffer[top - i];
		this.buffer[top - i] = tmp;
	}

	return this;
};

/**
 * Sorts the content of the ByteArray in-place.
 * 
 * @param {Function} comparator the function to compare entries
 * @returns {ByteArray} this ByteArray with its elements sorted
 */
var numericCompareFunction = function(o1, o2) {
	return o1 - o2;
};

// sort([compareFunction])
ByteArray.prototype.sort = function(compareFunction) {
	// TODO: inefficient, optimize

	var array = this.toArray();

	if(arguments.length)
		array.sort(compareFunction);
	else
		array.sort(numericCompareFunction);

	for( var i = 0; i < array.length; i++)
		this.set(i, array[i]);
};

/**
 * Apply a function for each element in the ByteArray.
 * 
 * @param {Function} fn the function to call for each element
 * @param {Object} thisObj optional this-object for callback
 */
ByteArray.prototype.forEach = function(callback, thisObject) {
	for( var i = 0, length = this.length; i < length; i++)
		callback.apply(thisObject, [this.get(i), i, this]);
};

/**
 * Return a ByteArray containing the elements of this ByteArray for which the
 * callback function returns true.
 * 
 * @param {Function} callback the filter function
 * @param {Object} thisObj optional this-object for callback
 * @returns {ByteArray} a new ByteArray
 */
ByteArray.prototype.filter = function(callback, thisObject) {
	var result = new ByteArray(this.length);
	for( var i = 0, length = this.length; i < length; i++) {
		var value = this.get(i);
		if(callback.apply(thisObject, [value, i, this]))
			result.push(value);
	}
	return result;
};

/**
 * Tests whether some element in the array passes the test implemented by the
 * provided function.
 * 
 * @param {Function} callback the callback function
 * @param {Object} thisObj optional this-object for callback
 * @returns {Boolean} true if at least one invocation of callback returns true
 */
ByteArray.prototype.some = function(callback, thisObject) {
	for( var i = 0, length = this.length; i < length; i++)
		if(callback.apply(thisObject, [this.get(i), i, this]))
			return true;
	return false;
};

/**
 * Tests whether all elements in the array pass the test implemented by the
 * provided function.
 * 
 * @param {Function} callback the callback function
 * @param {Object} thisObj optional this-object for callback
 * @returns {Boolean} true if every invocation of callback returns true
 */
ByteArray.prototype.every = function(callback, thisObject) {
	for( var i = 0, length = this._length; i < length; i++)
		if(!callback.apply(thisObject, [this.get(i), i, this]))
			return false;
	return true;
};

/**
 * Returns a new ByteArray whose content is the result of calling the provided
 * function with every element of the original ByteArray
 * 
 * @param {Function} callback the callback
 * @param {Object} thisObj optional this-object for callback
 * @returns {ByteArray} a new ByteArray
 */
ByteArray.prototype.map = function(callback, thisObject) {
	var result = new ByteArray(this.length);
	for( var i = 0, length = this.length; i < length; i++)
		result.set(i, callback.apply(thisObject, [this.get(i), i, this]));
	return result;
};

/**
 * Apply a function to each element in this ByteArray as to reduce its content
 * to a single value.
 * 
 * @param {Function} callback the function to call with each element of the
 * ByteArray
 * @param initialValue optional argument to be used as the first argument to the
 * first call to the callback
 * @returns the return value of the last callback invocation
 * @see https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/reduce
 */
ByteArray.prototype.reduce = function(callback, initialValue) {
	var value = initialValue;
	for( var i = 0, length = this.length; i < length; i++)
		value = callback(value, this.get(i), i, this);
	return value;
};

/**
 * Apply a function to each element in this ByteArray starting at the last
 * element as to reduce its content to a single value.
 * 
 * @param {Function} callback the function to call with each element of the
 * ByteArray
 * @param initialValue optional argument to be used as the first argument to the
 * first call to the callback
 * @returns the return value of the last callback invocation
 * @see ByteArray.prototype.reduce
 * @see https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/reduceRight
 */
ByteArray.prototype.reduceRight = function(callback, initialValue) {
	var value = initialValue;
	for( var i = this.length - 1; i > 0; i--)
		value = callback(value, this.get(i), i, this);
	return value;
};

/**
 * Removes the last element from an array and returns that element.
 * 
 * @returns {Number}
 */
ByteArray.prototype.pop = function() {
	if(this.length === 0)
		return undefined;

	var last = this.buffer[this.length - 1];
	// TODO sort this out as it's very expensive, maybe somehow use
	// https://github.com/substack/node-buffers? alternatively could just
	// deprecate this
	this.length--;

	return last;
};

/**
 * Appends the given elements and returns the new length of the array.
 * 
 * @param {Number} num... one or more numbers to append
 * @returns {Number} the new length of the ByteArray
 */
ByteArray.prototype.push = function() {
	var length, newLength = this.length += length = arguments.length;
	try {
		for( var i = 0; i < length; i++)
			this.set(newLength - length + i, arguments[i]);
	} catch(e) {
		this.length -= length;
		throw e;
	}
	return newLength;
};

/**
 * Removes the first element from the ByteArray and returns that element. This
 * method changes the length of the ByteArray
 * 
 * @returns {Number} the removed first element
 */
ByteArray.prototype.shift = function() {
	if(this.length === 0)
		return undefined;
	var first = this.buffer[0];
	var buffer = new Buffer(this.length - 1);
	this.buffer.copy(buffer, 0, 1);
	this.buffer = buffer;
	return first;
};

/**
 * Adds one or more elements to the beginning of the ByteArray and returns its
 * new length.
 * 
 * @param {Number} num... one or more numbers to append
 * @returns {Number} the new length of the ByteArray
 */
ByteArray.prototype.unshift = function() {
	var copy = this.slice();
	this.length = 0;
	try {
		this.push.apply(this, arguments);
		this.push.apply(this, copy.toArray());
		return this.length;
	} catch(e) {
		this.length = copy.length;
		copy.buffer.copy(this.buffer);
		throw e;
	}
};

/**
 * Changes the content of the ByteArray, adding new elements while removing old
 * elements.
 * 
 * @param {Number} index the index at which to start changing the ByteArray
 * @param {Number} howMany The number of elements to remove at the given
 * position
 * @param {Number} elements... the new elements to add at the given position
 */
ByteArray.prototype.splice = function() {
	if(index === undefined)
		return;
	if(index < 0)
		index += this.length;
	if(howMany === undefined)
		howMany = this.length - index;
	var end = index + howMany;
	var remove = this.slice(index, end);
	var keep = this.slice(end);
	var inject = Array.prototype.slice.call(arguments, 2);
	this.length = index;
	this.push.apply(this, inject);
	this.push.apply(this, keep.toArray());
	return remove;
};

/**
 * Copy a range of bytes between start and stop from this object to another
 * ByteArray at the given target offset.
 * 
 * @param {Number} start
 * @param {Number} end
 * @param {ByteArray} target
 * @param {Number} targetOffset
 * @name ByteArray.prototype.copy
 * @function
 */
ByteArray.prototype.copy = function(start, end, target, targetOffset) {
	//TODO validate parameters
	target.length = targetOffset + (end - start);
	this.buffer.copy(target.buffer, targetOffset, start, end);
};

/**
 * The length in bytes. This property is writable. Setting it to a value higher
 * than the current value fills the new slots with 0, setting it to a lower
 * value truncates the byte array.
 * 
 * @type Number
 * @name ByteArray.prototype.length
 */

/**
 * Returns a new ByteArray containing a portion of this ByteArray.
 * 
 * @param {Number} begin Zero-based index at which to begin extraction. As a
 * negative index, begin indicates an offset from the end of the sequence.
 * @param {Number} end Zero-based index at which to end extraction. slice
 * extracts up to but not including end. As a negative index, end indicates an
 * offset from the end of the sequence. If end is omitted, slice extracts to the
 * end of the sequence.
 * @returns {ByteArray} a new ByteArray
 * @name ByteArray.prototype.slice
 * @function
 */
ByteArray.prototype.slice = function() {
	return new ByteArray(ByteString.prototype.slice.apply(this, arguments));
};

/**
 * Returns a ByteArray composed of itself concatenated with the given
 * ByteString, ByteArray, and Array values.
 * 
 * @param {Binary|Array} arg... one or more elements to concatenate
 * @returns {ByteArray} a new ByteArray
 * @name ByteArray.prototype.concat
 * @function
 */
ByteArray.prototype.concat = function() {
	var components = [this], totalLength = this.length;

	for( var i = 0; i < arguments.length; i++) {
		var component = Array.isArray(arguments[i]) ? arguments[i] : [arguments[i]];

		for( var j = 0; j < component.length; j++) {
			var subcomponent = component[j];
			if(!(subcomponent instanceof ByteString)
					&& !(subcomponent instanceof ByteArray))
				throw "Arguments to ByteArray.concat() must be ByteStrings, ByteArrays, or Arrays of those.";

			components.push(subcomponent);
			totalLength += subcomponent.length;
		}
	}

	var result = new ByteArray(totalLength), offset = 0;

	components.forEach(function(component) {
		component.buffer.copy(result.buffer, offset);
		offset += component.length;
	});

	return result;
};

/**
 * @name ByteArray.prototype.toByteArray
 * @function
 */
ByteArray.prototype.toByteArray = function() {
	return new ByteArray(this.buffer);
};

/**
 * @name ByteArray.prototype.toByteString
 * @function
 */
ByteArray.prototype.toByteString = function() {
	return new ByteString(this.buffer);
};

/**
 * Returns an array containing the bytes as numbers.
 * 
 * @name ByteArray.prototype.toArray
 * @function
 */

/**
 * Returns a String representation of the ByteArray.
 * 
 * @name ByteArray.prototype.toString
 * @function
 */
ByteArray.prototype.toString = function(charset) {
	if(charset)
		return this.decodeToString(charset);

	return "[ByteArray " + this.length + "]";
};

/**
 * Returns the ByteArray decoded to a String using the given encoding
 * 
 * @param {String} encoding the name of the encoding to use
 * @name ByteArray.prototype.decodeToString
 * @function
 */

/**
 * Returns the index of the first occurrence of sequence (a Number or a
 * ByteString or ByteArray of any length) or -1 if none was found. If start
 * and/or stop are specified, only elements between the indexes start and stop
 * are searched.
 * 
 * @param {Number|Binary} sequence the number or binary to look for
 * @param {Number} start optional index position at which to start searching
 * @param {Number} stop optional index position at which to stop searching
 * @returns {Number} the index of the first occurrence of sequence, or -1
 * @name ByteArray.prototype.indexOf
 * @function
 */

/**
 * Returns the index of the last occurrence of sequence (a Number or a
 * ByteString or ByteArray of any length) or -1 if none was found. If start
 * and/or stop are specified, only elements between the indexes start and stop
 * are searched.
 * 
 * @param {Number|Binary} sequence the number or binary to look for
 * @param {Number} start optional index position at which to start searching
 * @param {Number} stop optional index position at which to stop searching
 * @returns {Number} the index of the last occurrence of sequence, or -1
 * @name ByteArray.prototype.lastIndexOf
 * @function
 */

/**
 * Split at delimiter, which can by a Number, a ByteString, a ByteArray or an
 * Array of the prior (containing multiple delimiters, i.e., "split at any of
 * these delimiters"). Delimiters can have arbitrary size.
 * 
 * @param {Number|Binary} delimiter one or more delimiter items
 * @param {Object} options optional object parameter with the following optional
 * properties:
 * <ul>
 * <li>count - Maximum number of elements (ignoring delimiters) to return. The
 * last returned element may contain delimiters.</li>
 * <li>includeDelimiter - Whether the delimiter should be included in the
 * result.</li>
 * </ul>
 * @name ByteArray.prototype.split
 * @function
 */
ByteArray.prototype.split = function() {
	var components = ByteString.prototype.split.apply(this.toByteString(),
			arguments);

	// convert ByteStrings to ByteArrays
	for( var i = 0; i < components.length; i++) {
		components[i] = new ByteArray(components[i]);
	}

	return components;
};

/**
 * Returns a byte for byte copy of this immutable ByteString as a mutable
 * ByteArray.
 * 
 * @name ByteString.prototype.toByteArray
 * @function
 */
ByteString.prototype.toByteArray = function() {
	return new ByteArray(this);
};

/**
 * Returns this ByteString itself.
 * 
 * @name ByteString.prototype.toByteString
 * @function
 */
ByteString.prototype.toByteString = function() {
	return this;
};

/**
 * Returns an array containing the bytes as numbers.
 * 
 * @name ByteString.prototype.toArray
 * @param {String} charset optional the name of the string encoding
 * @function
 */
Binary.prototype.toArray = function(charset) {
	if(charset) {
		return Array.prototype.map.call(this.buffer.toString(encodings[charset]),
				function(x) {
					return x.charCodeAt(0);
				});
	} else {
		return Array.prototype.slice.call(this.buffer, 0);
	}
};

/**
 * Returns a debug representation such as `"[ByteString 10]"` where 10 is the
 * length of this ByteString.
 * 
 * @name ByteString.prototype.toString
 * @function
 */
ByteString.prototype.toString = function() {
	return '[ByteString ' + this.buffer.length + ']';
};

/**
 * Returns this ByteString as string, decoded using the given charset.
 * 
 * @name ByteString.prototype.decodeToString
 * @param {String} charset the name of the string encoding
 * @function
 */
Binary.prototype.decodeToString = function(charset) {
	return this.buffer.toString(encodings[charset]);
};

/**
 * Returns the index of the first occurrence of sequence (a Number or a
 * ByteString or ByteArray of any length), or -1 if none was found. If start
 * and/or stop are specified, only elements between the indexes start and stop
 * are searched.
 * 
 * @param {Number|Binary} sequence the number or binary to look for
 * @param {Number} start optional index position at which to start searching
 * @param {Number} stop optional index position at which to stop searching
 * @returns {Number} the index of the first occurrence of sequence, or -1
 * @name ByteString.prototype.indexOf
 * @function
 */
Binary.prototype.indexOf = function(byteValue, start, stop) {
	// HACK: use ByteString's slice since we know we won't be modifying result
	var array = ByteString.prototype.slice.apply(this, [start, stop]).toArray(), result = array
			.indexOf(byteValue);
	return (result < 0) ? -1 : result + (start || 0);
};

/**
 * Returns the index of the last occurrence of sequence (a Number or a
 * ByteString or ByteArray of any length) or -1 if none was found. If start
 * and/or stop are specified, only elements between the indexes start and stop
 * are searched.
 * 
 * @param {Number|Binary} sequence the number or binary to look for
 * @param {Number} start optional index position at which to start searching
 * @param {Number} stop optional index position at which to stop searching
 * @returns {Number} the index of the last occurrence of sequence, or -1
 * @name ByteString.prototype.lastIndexOf
 * @function
 */
Binary.prototype.lastIndexOf = function(byteValue, start, stop) {
	// HACK: use ByteString's slice since we know we won't be modifying result
	var array = ByteString.prototype.slice.apply(this, [start, stop]).toArray(), result = array
			.lastIndexOf(byteValue);
	return (result < 0) ? -1 : result + (start || 0);
};

/**
 * Returns the byte at the given offset as a ByteString.
 * 
 * @name ByteString.prototype.byteAt
 * @param {Number} offset
 * @returns {Number}
 * @function
 */
ByteString.prototype.byteAt = ByteString.prototype.charAt = function(offset) {
	if(offset < 0 || offset >= this.buffer.length)
		return new ByteString();
	return new ByteString([this.buffer[offset]]);
};

/**
 * Returns the byte at the given offset.
 * 
 * @name ByteString.prototype.get
 * @param {Number} offset
 * @returns {ByteString}
 * @function
 */
Binary.prototype.get = ByteString.prototype.charCodeAt = function(offset) {
	return this.buffer[offset];
};

ByteArray.prototype.set = function(offset, value) {
	this.buffer[offset] = value;
};

/**
 * Copy a range of bytes between start and stop from this ByteString to a target
 * ByteArray at the given targetStart offset.
 * 
 * @param {Number} start
 * @param {Number} end
 * @param {ByteArray} target
 * @param {Number} targetStart
 * @name ByteString.prototype.copy
 * @function
 */
ByteString.prototype.copy = function(start, end, target, targetOffset) {
	//TODO validate parameters
	target.length = targetOffset + (end - start);
	this.buffer.copy(target.buffer, targetOffset, start, end);
};

/**
 * Split at delimiter, which can by a Number, a ByteString, a ByteArray or an
 * Array of the prior (containing multiple delimiters, i.e., "split at any of
 * these delimiters"). Delimiters can have arbitrary size.
 * 
 * @param {Number|Binary} delimiter one or more delimiter items
 * @param {Object} options optional object parameter with the following optional
 * properties:
 * <ul>
 * <li>count - Maximum number of elements (ignoring delimiters) to return. The
 * last returned element may contain delimiters.</li>
 * <li>includeDelimiter - Whether the delimiter should be included in the
 * result.</li>
 * </ul>
 * @name ByteString.prototype.split
 * @function
 */
ByteString.prototype.split = function(delimiters, options) {
	// taken from https://github.com/kriskowal/narwhal-lib/
	options = options || {};

	var includeDelimiter = options.includeDelimiter || false;

	// standardize delimiters into an array of ByteStrings:
	if(!Array.isArray(delimiters))
		delimiters = [delimiters];

	delimiters = delimiters.map(function(delimiter) {
		if(typeof delimiter === "number") {
			delimiter = [delimiter];
		}
		return new ByteString(delimiter);
	});

	var components = [], startOffset = 0, currentOffset = 0;

	// loop until there's no more bytes to consume
	bytes_loop: while(currentOffset < this.length) {

		// try each delimiter until we find a match
		delimiters_loop: for( var i = 0; i < delimiters.length; i++) {
			var d = delimiters[i];
			if(!d.length) {
				currentOffset = this.length;
				continue bytes_loop;
			}
			for( var j = 0; j < d.length; j++) {

				// reached the end of the bytes, OR bytes not equal
				if(currentOffset + j > this.length
						|| this.buffer[currentOffset + j] !== d.buffer[j]) {

					continue delimiters_loop;
				}
			}

			// push the part before the delimiter
			components.push(this.slice(startOffset, currentOffset));

			// optionally push the delimiter
			if(includeDelimiter)
				components.push(this.slice(currentOffset, currentOffset + d.length));

			// reset the offsets
			startOffset = currentOffset = currentOffset + d.length;

			continue bytes_loop;
		}

		// if there was no match, increment currentOffset to try the next one
		currentOffset++;
	}

	// push the remaining part, if any
	if(currentOffset > startOffset)
		components.push(this.slice(startOffset, currentOffset));

	return components;
};

/**
 * Returns a new ByteString containing a portion of this ByteString.
 * 
 * @param {Number} begin Zero-based index at which to begin extraction. As a
 * negative index, begin indicates an offset from the end of the sequence.
 * @param {Number} end Zero-based index at which to end extraction. slice
 * extracts up to but not including end. As a negative index, end indicates an
 * offset from the end of the sequence. If end is omitted, slice extracts to the
 * end of the sequence.
 * @returns {ByteString} a new ByteString
 * @name ByteString.prototype.slice
 * @function
 */
ByteString.prototype.slice = function(begin, end) {
	if(!begin || typeof begin !== "number")
		begin = 0;
	var length = this.buffer.length;
	if(begin < 0)
		begin += length;
	if(!end)
		end = length;
	if(typeof end !== "number")
		end = begin;
	if(end < 0)
		end += length;
	if(begin < 0)
		begin = 0;
	if(end < begin)
		end = begin;
	if(begin > length)
		begin = length;
	if(end > length)
		end = length;
	var buffer = new Buffer(end - begin);
	this.buffer.copy(buffer, 0, begin, end);
	return new ByteString(buffer);
};

/**
 * Returns a ByteString composed of itself concatenated with the given
 * ByteString, ByteArray, and Array values.
 * 
 * @param {Binary|Array} arg... one or more elements to concatenate
 * @returns {ByteString} a new ByteString
 * @name ByteString.prototype.concat
 * @function
 */
ByteString.prototype.concat = function(arg) {
	var components = [this], totalLength = this.length;

	for( var i = 0; i < arguments.length; i++) {
		var component = Array.isArray(arguments[i]) ? arguments[i] : [arguments[i]];

		for( var j = 0; j < component.length; j++) {
			var subcomponent = component[j];
			if(!(subcomponent instanceof ByteString)
					&& !(subcomponent instanceof ByteArray))
				throw "Arguments to ByteString.concat() must be ByteStrings, ByteArrays, or Arrays of those.";

			components.push(subcomponent);
			totalLength += subcomponent.length;
		}
	}

	var result = new Buffer(totalLength), offset = 0;

	components.forEach(function(component) {
		component.buffer.copy(result, offset);
		offset += component.length;
	});

	return new ByteString(result);
};
