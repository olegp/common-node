/**
 * @fileoverview Binary, ByteArray and ByteString classes as defined in
 * [CommonJS Binary/B](http://wiki.commonjs.org/wiki/Binary/B).
 */

var CHARSET_MAP = {
	usascii:'ascii',
	utf16:'utf16le'
};

var toNodeCharset = exports.toNodeCharset = function(charset) {
	if (charset) {
		charset = charset.replace('-', '').toLowerCase();
		return CHARSET_MAP[charset] || charset;
	}
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
 * @param {Binary|Array|String|Number|Buffer} [c] content or length of the ByteArray.
 * @param {String|Boolean} [s] the encoding name if the first argument is a String;
 * optional clear operation if the first argument is a Number
 * @constructor
 */
var ByteArray = exports.ByteArray = function(c, s) {
	if (!(this instanceof ByteArray)) {
		return ByteArray.apply(Object.create(ByteArray.prototype), arguments);
	}

	// ByteArray() - construct an empty byte string
	if (arguments.length === 0) {
		this._buffer = new Buffer(0);
	}
	// ByteArray(length) - create ByteArray of specified size
	else if (arguments.length === 1 && typeof c === 'number') {
		this._buffer = new Buffer(c);
		this._buffer.fill(0);
	}
	// ByteArray(length, clear) - create ByteArray of specified size, optional clear operation
	else if (arguments.length === 2 && typeof c === 'number' && typeof s === 'boolean') {
		this._buffer = new Buffer(c);
		if (s === true) {
			this._buffer.fill(0);
		}
	}
	// ByteArray(byteString or byteArray) - use the contents of byteString or byteArray
	else if (arguments.length === 1 && (c instanceof ByteString || c instanceof ByteArray)) {
		this.buffer = c.buffer;
		this._length = c.length;
	}
	// ByteArray(arrayOfNumbers) - use the numbers in arrayOfNumbers as the bytes
	else if (arguments.length === 1 && Array.isArray(c)) {
		this._buffer = new Buffer(c);
	}
	// ByteArray(buffer) - use contents of buffer
	else if (arguments.length === 1 && c instanceof Buffer) {
		this.buffer = c;
	}
	// ByteArray(string, charset) - convert a string - the ByteArray will contain
	// string encoded with charset
	else if (arguments.length <= 2 && typeof c === 'string' && (typeof s === 'undefined' || s === null)) {
		this._buffer = new Buffer(c);
	} else if (arguments.length === 2 && typeof c === 'string' && typeof s === 'string') {
		this._buffer = new Buffer(c, toNodeCharset(s));
	} else {
		throw new Error('Illegal arguments to ByteArray constructor\n' + JSON.stringify(arguments));
	}
	if (!('_length' in this)) {
		this._length = this._buffer.length;
	}

	return this;
};
ByteArray.prototype = Object.create(Binary.prototype);

Object.defineProperty(ByteArray.prototype, 'buffer', {
	get:function() {
		this._cow = true;
		return this._buffer;
	},
	set:function(buffer) {
		this._cow = true;
		this._buffer = buffer;
	}
});

/**
 * The length in bytes. This property is writable. Setting it to a value higher
 * than the current value fills the new slots with 0, setting it to a lower
 * value truncates the byte array.
 *
 * @type Number
 * @name ByteArray.prototype.length
 */
Object.defineProperty(ByteArray.prototype, 'length', {
	get:function() {
		return this._length;
	},
	set:function(length) {
		if (this._length < length && (this._cow || this._buffer.length < length)) {
			var buffer = new Buffer(length);
			this._buffer.copy(buffer, 0, 0, this._length);
			this._buffer = buffer;
			delete this._cow;
		}
		if (this._length < length) {
			this._buffer.fill(0, this._length, length);
		}
		this._length = length;
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
 * @param {String} [charset] the encoding name if the first argument is a String.
 * @constructor
 */
var ByteString = exports.ByteString = function(content, charset) {
	if (!(this instanceof ByteString)) {
		return ByteString.apply(Object.create(ByteString.prototype), arguments);
	}

	// ByteString() - construct an empty byte string
	if (arguments.length === 0) {
		return ByteString.EMPTY;
	}
	// ByteString(byteString) - returns byteString, which is immutable
	else if (arguments.length === 1 && content instanceof ByteString) {
		return content;
	}
	// ByteString(byteArray) - use the contents of byteArray
	else if (arguments.length === 1 && content instanceof ByteArray) {
		this._buffer = content.buffer;
		this._length = content.length;
	}
	// ByteString(buffer) - use contents of buffer
	else if (arguments.length === 1 && content instanceof Buffer) {
		this._buffer = content;
	}
	// ByteString(arrayOfNumbers) - use the numbers in arrayOfNumbers as the bytes
	else if (arguments.length === 1 && Array.isArray(content)) {
		this._buffer = new Buffer(content);
	}
	// ByteString(string, charset) - convert a string - the ByteString will
	// contain string encoded with charset
	else if (arguments.length <= 2 && typeof content === 'string' && (typeof charset === 'undefined' || charset === null)) {
		this._buffer = new Buffer(content);
	} else if (arguments.length === 2 && typeof content === 'string' && typeof charset === 'string') {
		this._buffer = new Buffer(content, toNodeCharset(charset));
	} else {
		throw new Error('Illegal arguments to ByteString constructor\n' + JSON.stringify(arguments));
	}
	if (!('_length' in this)) {
		this._length = this._buffer.length;
	}

	return !this._length ? ByteString.EMPTY : this;
};
ByteString.prototype = Object.create(Binary.prototype);

Object.defineProperty(ByteString, 'EMPTY', {
	value:function() {
		var result = Object.create(ByteString.prototype);
		result._buffer = new Buffer(0);
		result._length = 0;
		return result;
	}()
});

Object.defineProperty(ByteString.prototype, 'buffer', {
	get:function() {
		return this._buffer;
	},
	set:function() {
	}
});

Object.defineProperty(ByteString.prototype, '_cow', {value:true});

Object.defineProperty(ByteString.prototype, 'length', {
	get:function() {
		return this._length;
	},
	set:function() {
	}
});

/**
 * Converts the String to a mutable ByteArray using the specified encoding.
 *
 * @param {String} charset the name of the string encoding. Defaults to 'UTF-8'
 * @returns a ByteArray representing the string
 */
String.prototype.toByteArray = function(charset) {
	return new ByteArray(String(this), charset);
};

/**
 * Converts the String to an immutable ByteString using the specified encoding.
 *
 * @param {String} charset the name of the string encoding. Defaults to 'UTF-8'
 * @returns a ByteArray representing the string
 */
String.prototype.toByteString = function(charset) {
	return new ByteString(String(this), charset);
};

/**
 * Reverses the content of the ByteArray in-place
 *
 * @returns {ByteArray} this ByteArray with its elements reversed
 */
ByteArray.prototype.reverse = function() {
	var limit = Math.floor(this._length / 2);
	var buffer;
	if (this._cow) {
		buffer = new Buffer(this._length);
		buffer[limit] = this._buffer[limit];
	} else {
		buffer = this._buffer;
	}
	for (var i = 0, j = this._length - 1; i < limit; i++, j--) {
		var tmp = this._buffer[i];
		buffer[i] = this._buffer[j];
		buffer[j] = tmp;
	}
	this._buffer = buffer;
	delete this._cow;

	return this;
};

function defaultComparator(o1, o2) {
	return o1 < o2 ? -1 : o1 > o2 ? 1 : 0;
}

/**
 * Sorts the content of the ByteArray in-place.
 *
 * @param {Function} comparator the function to compare entries
 * @returns {ByteArray} this ByteArray with its elements sorted
 */
ByteArray.prototype.sort = function(comparator) {
	var buffer;
	if (this._cow) {
		buffer = new Buffer(this._length);
		this._buffer.copy(buffer);
	} else {
		buffer = this._buffer;
	}
	Array.prototype.sort.call(buffer, comparator || defaultComparator);
	this._buffer = buffer;
	delete this._cow;
	return this;
};

/**
 * Apply a function for each element in the ByteArray.
 *
 * @param {Function} callback the function to call for each element
 * @param {Object} [thisObject] this-object for callback
 */
ByteArray.prototype.forEach = function(callback, thisObject) {
	for (var i = 0, length = this._length; i < length; i++) {
		callback.call(thisObject, this._buffer[i], i, this);
	}
};

/**
 * Return a ByteArray containing the elements of this ByteArray for which the
 * callback function returns true.
 *
 * @param {Function} callback the filter function
 * @param {Object} [thisObject] this-object for callback
 * @returns {ByteArray} a new ByteArray
 */
ByteArray.prototype.filter = function(callback, thisObject) {
	var result = [];
	for (var i = 0, length = this._length; i < length; i++) {
		var value = this._buffer[i];
		if (callback.call(thisObject, value, i, this)) {
			result.push(value);
		}
	}
	return new ByteArray(result);
};

/**
 * Tests whether some element in the array passes the test implemented by the
 * provided function.
 *
 * @param {Function} callback the callback function
 * @param {Object} [thisObject] this-object for callback
 * @returns {Boolean} true if at least one invocation of callback returns true
 */
ByteArray.prototype.some = function(callback, thisObject) {
	for (var i = 0, length = this._length; i < length; i++) {
		if (callback.call(thisObject, this._buffer[i], i, this)) {
			return true;
		}
	}
	return false;
};

/**
 * Tests whether all elements in the array pass the test implemented by the
 * provided function.
 *
 * @param {Function} callback the callback function
 * @param {Object} [thisObject] this-object for callback
 * @returns {Boolean} true if every invocation of callback returns true
 */
ByteArray.prototype.every = function(callback, thisObject) {
	for (var i = 0, length = this._length; i < length; i++) {
		if (!callback.call(thisObject, this._buffer[i], i, this)) {
			return false;
		}
	}
	return true;
};

/**
 * Returns a new ByteArray whose content is the result of calling the provided
 * function with every element of the original ByteArray
 *
 * @param {Function} callback the callback
 * @param {Object} [thisObject] this-object for callback
 * @returns {ByteArray} a new ByteArray
 */
ByteArray.prototype.map = function(callback, thisObject) {
	var length = this._length;
	var result = new ByteArray(length);
	for (var i = 0; i < length; i++) {
		result._buffer[i] = callback.call(thisObject, this._buffer[i], i, this);
	}
	return result;
};

/**
 * Apply a function to each element in this ByteArray as to reduce its content
 * to a single value.
 *
 * @param {Function} callback the function to call with each element of the
 * ByteArray
 * @param [initialValue] argument to be used as the first argument to the
 * first call to the callback
 * @returns the return value of the last callback invocation
 * @see https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/reduce
 */
ByteArray.prototype.reduce = function(callback, initialValue) {
	var value = initialValue;
	for (var i = 0, length = this._length; i < length; i++) {
		value = callback(value, this._buffer[i], i, this);
	}
	return value;
};

/**
 * Apply a function to each element in this ByteArray starting at the last
 * element as to reduce its content to a single value.
 *
 * @param {Function} callback the function to call with each element of the
 * ByteArray
 * @param [initialValue] argument to be used as the first argument to the
 * first call to the callback
 * @returns the return value of the last callback invocation
 * @see ByteArray.prototype.reduce
 * @see https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/reduceRight
 */
ByteArray.prototype.reduceRight = function(callback, initialValue) {
	var value = initialValue;
	for (var i = this._length - 1; i > 0; i--) {
		value = callback(value, this._buffer[i], i, this);
	}
	return value;
};

/**
 * Removes the last element from an array and returns that element.
 *
 * @returns {Number}
 */
ByteArray.prototype.pop = function() {
	if (this._length > 0) {
		return this._buffer[--this.length];
	}
};

/**
 * Appends the given elements and returns the new length of the array.
 *
 * @param {Number} num ... one or more numbers to append
 * @returns {Number} the new length of the ByteArray
 */
ByteArray.prototype.push = function(num) {
	var length = arguments.length;
	var j = this._length;
	this.length += length;
	try {
		for (var i = 0; i < length; i++, j++) {
			this._buffer[j] = arguments[i];
		}
		return j;
	} catch (e) {
		this.length -= length;
		throw e;
	}
};

/**
 * Removes the first element from the ByteArray and returns that element. This
 * method changes the length of the ByteArray
 *
 * @returns {Number} the removed first element
 */
ByteArray.prototype.shift = function() {
	if (this._length > 0) {
		var first = this._buffer[0];
		this.length--;
		var buffer = this._cow ? new Buffer(this._length) : this._buffer;
		this._buffer.copy(buffer, 0, 1);
		this._buffer = buffer;
		delete this._cow;
		return first;
	}
};

/**
 * Adds one or more elements to the beginning of the ByteArray and returns its
 * new length.
 *
 * @param {Number} num ... one or more numbers to append
 * @returns {Number} the new length of the ByteArray
 */
ByteArray.prototype.unshift = function(num) {
	var length = arguments.length;
	var newLength = this._length + length;
	var buffer;
	if (this._cow || this._buffer.length < newLength) {
		buffer = new Buffer(newLength);
	} else {
		buffer = this._buffer;
	}
	this._buffer.copy(buffer, length, 0, this._length);
	for (var i = 0; i < length; i++) {
		buffer[i] = arguments[i];
	}
	this._buffer = buffer;
	delete this._cow;
	this._length = newLength;
	return newLength;
};

/**
 * Changes the content of the ByteArray, adding new elements while removing old
 * elements.
 *
 * @param {Number} index the index at which to start changing the ByteArray
 * @param {Number} [howMany] The number of elements to remove at the given
 * position
 * @param {Number} elements ... the new elements to add at the given position
 */
ByteArray.prototype.splice = function(index, howMany, elements) {
	if (arguments.length === 0) {
		index = 0;
		howMany = 0;
	} else {
		if (typeof index === 'number') {
			index = Math.max(0, Math.min(this._length, index < 0 ? index + this._length : index));
		} else {
			index = 0;
		}
		if (typeof howMany === 'undefined') {
			howMany = this._length - index;
		}
		if (howMany > 0) {
			howMany = Math.min(this._length, howMany);
		} else {
			howMany = 0;
		}
	}
	var added = Math.max(0, arguments.length - 2);
	var newLength = this._length + added - howMany;
	var buffer = new Buffer(newLength);
	this._buffer.copy(buffer, 0, 0, index);
	var end = index + howMany;
	var removed = this._buffer.slice(index, end);
	this._buffer.copy(buffer, index + added, end);
	for (var i = 2, j = index; i < arguments.length; i++, j++) {
		buffer[j] = arguments[i];
	}
	this._buffer = buffer;
	delete this._cow;
	this._length = newLength;
	return new ByteArray(removed);
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
	var buffer;
	if (target._cow) {
		buffer = new Buffer(target.length);
		target._buffer.copy(buffer, 0, 0, target.length);
	} else {
		buffer = target._buffer;
	}
	this._buffer.copy(buffer, targetOffset, start, end);
	target._buffer = buffer;
	delete target._cow;
};

function slice(that, begin, end) {
	if (typeof end !== 'undefined' && typeof end !== 'number') {
		end = 0;
	}
	return that.buffer.slice(0, that._length).slice(begin, end);
}

/**
 * Returns a new ByteArray containing a portion of this ByteArray.
 *
 * @param {Number} [begin] Zero-based index at which to begin extraction. As a
 * negative index, begin indicates an offset from the end of the sequence.
 * @param {Number} [end] Zero-based index at which to end extraction. slice
 * extracts up to but not including end. As a negative index, end indicates an
 * offset from the end of the sequence. If end is omitted, slice extracts to the
 * end of the sequence.
 * @returns {ByteArray} a new ByteArray
 * @name ByteArray.prototype.slice
 * @function
 */
ByteArray.prototype.slice = function(begin, end) {
	return new ByteArray(slice(this, begin, end));
};

function concat(that, args) {
	if (args.length === 0) {
		return that;
	} else {
		var components = [that], totalLength = that._length;

		for (var i = 0; i < args.length; i++) {
			var arg = args[i];
			if (Array.isArray(arg)) {
				for (var j = 0; j < arg.length; j++) {
					var e = arg[j];
					components.push(e);
					totalLength += e._length;
				}
			} else {
				components.push(arg);
				totalLength += arg._length;
			}
		}

		var buffer = new Buffer(totalLength), offset = 0;

		for (var i = 0; i < components.length; i++) {
			var c = components[i];
			c._buffer.copy(buffer, offset);
			offset += c._length;
		}

		return buffer;
	}
}

/**
 * Returns a ByteArray composed of itself concatenated with the given
 * ByteString, ByteArray, and Array values.
 *
 * @param {Binary|Array} arg ... one or more elements to concatenate
 * @returns {ByteArray} a new ByteArray
 * @name ByteArray.prototype.concat
 * @function
 */
ByteArray.prototype.concat = function(arg) {
	var result = new ByteArray(concat(this, arguments));
	delete result._cow;
	return result;
};

/**
 * @name ByteArray.prototype.toByteArray
 * @function
 */
ByteArray.prototype.toByteArray = function() {
	return new ByteArray(this);
};

/**
 * @name ByteArray.prototype.toByteString
 * @function
 */
ByteArray.prototype.toByteString = function() {
	return new ByteString(this);
};

/**
 * Returns an array containing the bytes as numbers.
 *
 * @name ByteArray.prototype.toArray
 * @function
 */

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
 * Returns a String representation of the ByteArray.
 *
 * @name ByteArray.prototype.toString
 * @param {String} [charset] the name of the encoding to use
 * @function
 */
ByteArray.prototype.toString = function(charset) {
	if (charset) {
		return this.decodeToString(charset);
	} else {
		return "[ByteArray " + this._length + "]";
	}
};

function split(length, buffer, delimiters, options) {
	// taken from https://github.com/kriskowal/narwhal-lib/
	options = options || {};

	var includeDelimiter = options.includeDelimiter || false;

	// standardize delimiters into an array of ByteStrings:
	if (!Array.isArray(delimiters)) {
		delimiters = [delimiters];
	}
	delimiters = delimiters.map(function(delimiter) {
		if (typeof delimiter === "number") {
			delimiter = [delimiter];
		}
		return new ByteString(delimiter);
	});

	var components = [], startOffset = 0, currentOffset = 0;

	// loop until there's no more bytes to consume
	bytes_loop: while (currentOffset < length) {
		// try each delimiter until we find a match
		delimiters_loop: for (var i = 0; i < delimiters.length; i++) {
			var d = delimiters[i];
			if (!d.length) {
				currentOffset = length;
				continue bytes_loop;
			}
			for (var j = 0; j < d.length; j++) {
				// reached the end of the bytes, OR bytes not equal
				if (currentOffset + j > length || buffer[currentOffset + j] !== d._buffer[j]) {
					continue delimiters_loop;
				}
			}
			// push the part before the delimiter
			components.push(buffer.slice(startOffset, currentOffset));
			// optionally push the delimiter
			if (includeDelimiter) {
				components.push(buffer.slice(currentOffset, currentOffset + d.length));
			}
			// reset the offsets
			startOffset = currentOffset = currentOffset + d.length;
			continue bytes_loop;
		}
		// if there was no match, increment currentOffset to try the next one
		currentOffset++;
	}
	// push the remaining part, if any
	if (currentOffset > startOffset) {
		components.push(buffer.slice(startOffset, currentOffset));
	}
	return components;
}

/**
 * Split at delimiter, which can by a Number, a ByteString, a ByteArray or an
 * Array of the prior (containing multiple delimiters, i.e., "split at any of
 * these delimiters"). Delimiters can have arbitrary size.
 *
 * @param {Number|Binary} delimiter one or more delimiter items
 * @param {Object} [options] object parameter with the following optional
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
ByteArray.prototype.split = function(delimiter, options) {
	return split(this._length, this.buffer, delimiter, options).map(function(component) {
		return new ByteArray(component);
	});
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
	if (charset) {
		var value = this._buffer.toString(toNodeCharset(charset), 0, this._length);
		return Array.prototype.map.call(value, function(x) {
			return x.charCodeAt(0);
		});
	} else {
		return Array.prototype.slice.call(this._buffer, 0, this._length);
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
	return '[ByteString ' + this._length + ']';
};

/**
 * Returns this ByteString as string, decoded using the given charset.
 *
 * @name ByteString.prototype.decodeToString
 * @param {String} charset the name of the string encoding
 * @function
 */
Binary.prototype.decodeToString = function(charset) {
	return this._buffer.toString(toNodeCharset(charset), 0, this._length);
};

/**
 * Returns the index of the first occurrence of sequence (a Number or a
 * ByteString or ByteArray of any length), or -1 if none was found. If start
 * and/or stop are specified, only elements between the indexes start and stop
 * are searched.
 *
 * @param {Number|Binary} byteValue the number or binary to look for
 * @param {Number} [start] index position at which to start searching
 * @param {Number} [stop] index position at which to stop searching
 * @returns {Number} the index of the first occurrence of sequence, or -1
 * @name ByteString.prototype.indexOf
 * @function
 */
Binary.prototype.indexOf = function(byteValue, start, stop) {
	var buffer = this._buffer.slice(0, this._length);
	if (typeof stop !== 'undefined') {
		buffer = buffer.slice(0, stop);
	}
	return Array.prototype.indexOf.call(buffer, byteValue, start);
};

/**
 * Returns the index of the last occurrence of sequence (a Number or a
 * ByteString or ByteArray of any length) or -1 if none was found. If start
 * and/or stop are specified, only elements between the indexes start and stop
 * are searched.
 *
 * @param {Number|Binary} byteValue the number or binary to look for
 * @param {Number} [start] index position at which to start searching
 * @param {Number} [stop] index position at which to stop searching
 * @returns {Number} the index of the last occurrence of sequence, or -1
 * @name ByteString.prototype.lastIndexOf
 * @function
 */
Binary.prototype.lastIndexOf = function(byteValue, start, stop) {
	var buffer = slice(this, start, stop);
	var result = Array.prototype.lastIndexOf.call(buffer, byteValue);
	return result + (~result && start || 0);
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
	if (offset < 0 || offset >= this._length) {
		return ByteString.EMPTY;
	} else {
		return new ByteString([this._buffer[offset]]);
	}
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
	if (0 <= offset && offset < this._length) {
		return this._buffer[offset];
	}
};

ByteArray.prototype.set = function(offset, value) {
	if (this._cow) {
		var buffer = new Buffer(this._length);
		this._buffer.copy(buffer, 0, 0, this._length);
		this._buffer = buffer;
		delete this._cow;
	}
	this._buffer[offset] = value;
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
ByteString.prototype.copy = ByteArray.prototype.copy;

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
ByteString.prototype.split = function(delimiter, options) {
	return split(this._length, this._buffer, delimiter, options).map(function(component) {
		return new ByteString(component);
	});
};

/**
 * Returns a new ByteString containing a portion of this ByteString.
 *
 * @param {Number} [begin] Zero-based index at which to begin extraction. As a
 * negative index, begin indicates an offset from the end of the sequence.
 * @param {Number} [end] Zero-based index at which to end extraction. slice
 * extracts up to but not including end. As a negative index, end indicates an
 * offset from the end of the sequence. If end is omitted, slice extracts to the
 * end of the sequence.
 * @returns {ByteString} a new ByteString
 * @name ByteString.prototype.slice
 * @function
 */
ByteString.prototype.slice = function(begin, end) {
	return new ByteString(slice(this, begin, end));
};

/**
 * Returns a ByteString composed of itself concatenated with the given
 * ByteString, ByteArray, and Array values.
 *
 * @param {Binary|Array} arg ... one or more elements to concatenate
 * @returns {ByteString} a new ByteString
 * @name ByteString.prototype.concat
 * @function
 */
ByteString.prototype.concat = function(arg) {
	return new ByteString(concat(this, arguments));
};