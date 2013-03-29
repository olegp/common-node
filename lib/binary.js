/**
 * @fileoverview Binary, ByteArray and ByteString classes as defined in
 * [CommonJS Binary/B](http://wiki.commonjs.org/wiki/Binary/B).
 */

var encodings = {
	'US-ASCII':'ascii',
	'UTF-8':'utf8',
	'ISO-10646-UCS-2':'ucs2'
};

/**
 * Abstract base class for ByteArray and ByteString
 *
 * @constructor
 */
var Binary = exports.Binary = function() {
};

var EMPTY_BUFFER = new Buffer(0);

function newBuffer(sizeOrContent) {
	return sizeOrContent === 0 || sizeOrContent.length === 0 ? EMPTY_BUFFER : new Buffer(sizeOrContent);
}

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
 * @param {Binary|Array|String|Number|Buffer} [contentOrLength] content or length
 * of the ByteArray.
 * @param {String|Boolean} [charsetOrClear] the encoding name if the first argument is a
 * String; optional clear operation if the first argument is a Number
 * @constructor
 */
var ByteArray = exports.ByteArray = function(contentOrLength, charsetOrClear) {
	if (!(this instanceof ByteArray)) {
		return ByteArray.apply(Object.create(ByteArray.prototype), arguments);
	}

	// ByteArray() - construct an empty byte string
	if (arguments.length === 0) {
		this._buffer = EMPTY_BUFFER;
		this._length = 0;
	}
	// ByteArray(length) - create ByteArray of specified size
	else if (arguments.length === 1 && typeof arguments[0] === "number") {
		this._buffer = newBuffer(arguments[0]);
		this._length = arguments[0];
		this._buffer.fill(0);
	}
	// ByteArray(length, clear) - create ByteArray of specified size, optional clear operation
	else if (arguments.length === 2 && typeof arguments[0] === "number" && typeof arguments[1] === "boolean") {
		this._buffer = newBuffer(arguments[0]);
		this._length = arguments[0];
		if (arguments[1] === true) {
			this._buffer.fill(0);
		}
	}
	// ByteArray(byteString or byteArray) - use the contents of byteString or byteArray
	else if (arguments.length === 1 && (arguments[0] instanceof ByteString || arguments[0] instanceof ByteArray)) {
		this.buffer = arguments[0].buffer;
		this._length = arguments[0].length;
	}
	// ByteArray(arrayOfNumbers) - use the numbers in arrayOfNumbers as the bytes
	else if (arguments.length === 1 && Array.isArray(arguments[0])) {
		this._buffer = newBuffer(arguments[0]);
		this._length = this._buffer.length;
	}
	// ByteArray(buffer) - use contents of buffer
	else if (arguments.length === 1 && arguments[0] instanceof Buffer) {
		this.buffer = arguments[0];
		this._length = this._buffer.length;
	}
	// ByteArray(string, charset) - convert a string - the ByteArray will contain
	// string encoded with charset
	else if ((arguments.length === 1 || (arguments.length === 2 && arguments[1] === undefined))
		&& typeof arguments[0] === "string") {
		this._buffer = newBuffer(arguments[0]);
		this._length = this._buffer.length;
	} else if (arguments.length === 2 && typeof arguments[0] === "string" && typeof arguments[1] === "string") {
		this._buffer = new Buffer(arguments[0], encodings[arguments[1]]);
		this._length = this._buffer.length;
	} else {
		throw new Error("Illegal arguments to ByteArray constructor\n" + JSON.stringify(arguments));
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
		if ((this._cow ? this._length : this._buffer.length) < length) {
			var buffer = newBuffer(length);
			this._buffer.copy(buffer, 0, 0, this._length);
			this._buffer = buffer;
			delete this._cow;
		}
		if (this._length < length) {
			this._buffer.fill(0, this._length);
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
		return EMPTY_STRING;
	}
	// ByteString(byteString) - returns byteString, which is immutable
	else if (arguments.length === 1 && arguments[0] instanceof ByteString) {
		return arguments[0];
	}
	// ByteString(byteArray) - use the contents of byteArray
	else if (arguments.length === 1 && arguments[0] instanceof ByteArray) {
		this._buffer = arguments[0].buffer;
		this._length = arguments[0].length;
	}
	// ByteString(buffer) - use contents of buffer
	else if (arguments.length === 1 && arguments[0] instanceof Buffer) {
		this._buffer = arguments[0];
	}
	// ByteString(arrayOfNumbers) - use the numbers in arrayOfNumbers as the bytes
	else if (arguments.length === 1 && Array.isArray(arguments[0])) {
		this._buffer = newBuffer(arguments[0]);
	}
	// ByteString(string, charset) - convert a string - the ByteString will
	// contain string encoded with charset
	else if ((arguments.length === 1 || (arguments.length === 2 && arguments[1] === undefined))
		&& typeof arguments[0] === "string") {
		this._buffer = newBuffer(arguments[0]);
	} else if (arguments.length === 2 && typeof arguments[0] === "string"
		&& typeof arguments[1] === "string") {
		this._buffer = new Buffer(arguments[0], encodings[arguments[1]]);
	} else {
		throw new Error("Illegal arguments to ByteString constructor\n" + JSON.stringify(arguments));
	}
	if (this._length === undefined) {
		this._length = this._buffer.length;
	}

	return !this._length && EMPTY_STRING ? EMPTY_STRING : this;
};
ByteString.prototype = Object.create(Binary.prototype);

var EMPTY_STRING = new ByteString(EMPTY_BUFFER);

Object.defineProperty(ByteString.prototype, 'buffer', {
	get:function() {
		return this._buffer;
	},
	set:function() {
	}
});

Object.defineProperty(ByteString.prototype, '_cow', {
	get:function() {
		return true;
	},
	set:function() {
	}
});

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
	return new ByteArray(String(this), charset || 'UTF-8');
};

/**
 * Converts the String to an immutable ByteString using the specified encoding.
 *
 * @param {String} charset the name of the string encoding. Defaults to 'UTF-8'
 * @returns a ByteArray representing the string
 */
String.prototype.toByteString = function(charset) {
	return new ByteString(String(this), charset || 'UTF-8');
};

/**
 * Reverses the content of the ByteArray in-place
 *
 * @returns {ByteArray} this ByteArray with its elements reversed
 */
ByteArray.prototype.reverse = function() {
	var limit = Math.floor(this.length / 2);
	var buffer;
	if (this._cow) {
		buffer = newBuffer(this.length);
		buffer[limit] = this._buffer[limit];
	} else {
		buffer = this._buffer;
	}
	for (var i = 0, j = this.length - 1; i < limit; i++, j--) {
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
	var array = this.toArray();

	array.sort(comparator || defaultComparator);
	this._buffer = newBuffer(array);
	delete this._cow;
};

/**
 * Apply a function for each element in the ByteArray.
 *
 * @param {Function} callback the function to call for each element
 * @param {Object} [thisObject] this-object for callback
 */
ByteArray.prototype.forEach = function(callback, thisObject) {
	for (var i = 0, length = this.length; i < length; i++) {
		callback.call(thisObject, this.get(i), i, this);
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
	for (var i = 0, length = this.length; i < length; i++) {
		var value = this.get(i);
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
	for (var i = 0, length = this.length; i < length; i++) {
		if (callback.call(thisObject, this.get(i), i, this)) {
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
		if (!callback.call(thisObject, this.get(i), i, this)) {
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
	var result = new ByteArray(this.length);
	for (var i = 0, length = this.length; i < length; i++) {
		result._buffer[i] = callback.call(thisObject, this.get(i), i, this);
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
	for (var i = 0, length = this.length; i < length; i++) {
		value = callback(value, this.get(i), i, this);
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
	for (var i = this.length - 1; i > 0; i--) {
		value = callback(value, this.get(i), i, this);
	}
	return value;
};

/**
 * Removes the last element from an array and returns that element.
 *
 * @returns {Number}
 */
ByteArray.prototype.pop = function() {
	if (this.length > 0) {
		return this.get(--this.length);
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
	var j = this.length;
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
	if (this.length > 0) {
		var first = this._buffer[0];
		this.length--;
		var buffer = this._cow ? newBuffer(this.length) : this._buffer;
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
	var newLength = this.length + length;
	var buffer;
	if (this._cow || this._buffer.length < newLength) {
		buffer = newBuffer(newLength);
	} else {
		buffer = this._buffer;
	}
	this._buffer.copy(buffer, length, 0, this.length);
	for (var i = 0; i < length; i++) {
		buffer[i] = arguments[i];
	}
	this._buffer = buffer;
	delete this._cow;
	this._length = newLength;
	return this.length;
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
	if (index === undefined) {
		return [];
	}
	if (index < 0) {
		index += this.length;
	}
	if (howMany === undefined) {
		howMany = this.length - index;
	}
	var end = index + howMany;
	var remove = this.slice(index, end);
	var inject = Array.prototype.slice.call(arguments, 2);
	var newLength = this.length - howMany + inject.length;
	var buffer;
	if (this._cow || this._buffer.length < newLength) {
		buffer = newBuffer(newLength);
	} else {
		buffer = this._buffer;
	}
	this._buffer.copy(buffer, index + inject.length, end);
	for (var i = 0, j = index; i < inject.length; i++, j++) {
		buffer[j] = inject[i];
	}
	this._buffer = buffer;
	delete this._cow;
	this._length = newLength;
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
	var buffer;
	if (target._cow) {
		buffer = newBuffer(target.length);
		target._buffer.copy(buffer, 0, 0, target.length);
	} else {
		buffer = target._buffer;
	}
	this._buffer.copy(buffer, targetOffset, start, end);
	target._buffer = buffer;
	delete target._cow;
};

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
ByteArray.prototype.slice = function(begin, end) {
	return new ByteArray(ByteString.prototype.slice.apply(this, arguments));
};

function concat() {
	var components = [this], totalLength = this.length;

	Array.prototype.forEach.call(arguments, function(argument) {
		(Array.isArray(argument) ? argument : [argument]).forEach(function(component) {
			if (component instanceof ByteString || component instanceof ByteArray) {
				components.push(component);
				totalLength += component.length;
			} else {
				throw "Arguments to concat() must be ByteStrings, ByteArrays, or Arrays of those.";
			}
		});
	});

	var buffer = newBuffer(totalLength), offset = 0;

	components.forEach(function(component) {
		component._buffer.copy(buffer, offset);
		offset += component.length;
	});

	return buffer;
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
	var result = new ByteArray(concat.apply(this, arguments));
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
		return "[ByteArray " + this.length + "]";
	}
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
	return ByteString.prototype.split.apply(this, arguments).map(function(component) {
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
		var value = this._buffer.toString(encodings[charset]);
		return Array.prototype.slice.call(value, 0, this._length).map(function(x) {
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
	return '[ByteString ' + this.length + ']';
};

/**
 * Returns this ByteString as string, decoded using the given charset.
 *
 * @name ByteString.prototype.decodeToString
 * @param {String} charset the name of the string encoding
 * @function
 */
Binary.prototype.decodeToString = function(charset) {
	return this._buffer.toString(encodings[charset]);
};

/**
 * Returns the index of the first occurrence of sequence (a Number or a
 * ByteString or ByteArray of any length), or -1 if none was found. If start
 * and/or stop are specified, only elements between the indexes start and stop
 * are searched.
 *
 * @param {Number|Binary} byteValue the number or binary to look for
 * @param {Number} start optional index position at which to start searching
 * @param {Number} stop optional index position at which to stop searching
 * @returns {Number} the index of the first occurrence of sequence, or -1
 * @name ByteString.prototype.indexOf
 * @function
 */
Binary.prototype.indexOf = function(byteValue, start, stop) {
	// HACK: use ByteString's slice since we know we won't be modifying result
	var array = ByteString.prototype.slice.call(this, start, stop).toArray();
	var result = array.indexOf(byteValue);
	return result < 0 ? -1 : result + (start || 0);
};

/**
 * Returns the index of the last occurrence of sequence (a Number or a
 * ByteString or ByteArray of any length) or -1 if none was found. If start
 * and/or stop are specified, only elements between the indexes start and stop
 * are searched.
 *
 * @param {Number|Binary} byteValue the number or binary to look for
 * @param {Number} start optional index position at which to start searching
 * @param {Number} stop optional index position at which to stop searching
 * @returns {Number} the index of the last occurrence of sequence, or -1
 * @name ByteString.prototype.lastIndexOf
 * @function
 */
Binary.prototype.lastIndexOf = function(byteValue, start, stop) {
	// HACK: use ByteString's slice since we know we won't be modifying result
	var array = ByteString.prototype.slice.call(this, start, stop).toArray();
	var result = array.lastIndexOf(byteValue);
	return result < 0 ? -1 : result + (start || 0);
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
	if (offset < 0 || offset >= this.length) {
		return new ByteString();
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
	if (offset < this.length) {
		return this._buffer[offset];
	}
};

ByteArray.prototype.set = function(offset, value) {
	if (this._cow) {
		var buffer = newBuffer(this.length);
		this._buffer.copy(buffer, 0, 0, this.length);
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
 * @param {Number|Binary} delimiters one or more delimiter items
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
	bytes_loop: while (currentOffset < this.length) {
		// try each delimiter until we find a match
		delimiters_loop: for (var i = 0; i < delimiters.length; i++) {
			var d = delimiters[i];
			if (!d.length) {
				currentOffset = this.length;
				continue bytes_loop;
			}
			for (var j = 0; j < d.length; j++) {
				// reached the end of the bytes, OR bytes not equal
				if (currentOffset + j > this.length || this._buffer[currentOffset + j] !== d._buffer[j]) {
					continue delimiters_loop;
				}
			}
			// push the part before the delimiter
			components.push(this.slice(startOffset, currentOffset));
			// optionally push the delimiter
			if (includeDelimiter) {
				components.push(this.slice(currentOffset, currentOffset + d.length));
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
		components.push(this.slice(startOffset, currentOffset));
	}
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
	if (!begin || typeof begin !== "number")
		begin = 0;
	var length = this.length;
	if (begin < 0)
		begin += length;
	if (!end)
		end = length;
	if (typeof end !== "number")
		end = begin;
	if (end < 0)
		end += length;
	if (begin < 0)
		begin = 0;
	if (end < begin)
		end = begin;
	if (begin > length)
		begin = length;
	if (end > length)
		end = length;
	length = end - begin;
	if (begin === 0) {
		var result = new ByteString(this.buffer);
		result._length = end;
		return result;
	} else {
		var buffer = newBuffer(end - begin);
		this._buffer.copy(buffer, 0, begin, end);
		return new ByteString(buffer);
	}
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
	return new ByteString(concat.apply(this, arguments));
};