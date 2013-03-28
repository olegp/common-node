/**
 * @fileoverview Stream and TextStream classes as per [CommonJS
 * IO/A](http://wiki.commonjs.org/wiki/IO/A) as well as a ByteArray based in
 * memory MemoryStream.
 */
var Fiber = require('fibers');
var binary = require('./binary');
var Binary = binary.Binary, ByteArray = binary.ByteArray, ByteString = binary.ByteString;

/**
 * This class implements an I/O stream used to read and write raw bytes.
 *
 * @constructor
 * @param stream a [Node.js
 * Stream](http://nodejs.org/docs/v0.4.8/api/streams.html#streams) that can be
 * readable, writeable or both
 */
var Stream = exports.Stream = function(stream) {
	if (stream instanceof Stream) {
		return stream;
	} else if (!(this instanceof Stream)) {
		return new Stream(arguments[0]);
	}

	this.stream = stream;
	var that = this;

	if (this.writable()) {
		this.drained = true;
		stream.on('drain', function() {
			that.drained = true;
			if (that.flushing) {
				var fiber = that.flushing;
				delete that.flushing;
				fiber.run();
			}
		});
	}

	if (this.readable()) {
		function handleRead() {
			if (that.reading) {
				var fiber = that.reading;
				delete that.reading;
				fiber.run();
			}
		}

		this.ended = false;
		this._end = function() {
			that.ended = true;
			handleRead();
		};
		stream.on('readable', handleRead).on('end', this._end);
	} else {
		this.ended = true;
	}

	return this;
};

/**
 * Returns true if the stream supports reading, false otherwise.
 *
 * @name Stream.prototype.readable
 * @function
 */
Stream.prototype.readable = function() {
	return this.stream && this.stream.readable;
};

/**
 * Returns true if the stream supports writing, false otherwise.
 *
 * @name Stream.prototype.writable
 * @function
 */
Stream.prototype.writable = function() {
	return this.stream && this.stream.writable;
};

/**
 * Returns true if the stream is randomly accessible and supports the length and
 * position properties, false otherwise.
 *
 * @name Stream.prototype.seekable
 * @function
 */
Stream.prototype.seekable = function() {
	return false;
};

/**
 * Read all data from this stream and invoke function `fn` for each chunk of
 * data read. The callback function is called with a ByteArray as single
 * argument. Note that the stream is not closed after reading.
 *
 * @param {Function} fn the callback function
 * @param {Object} [thisObj] optional this-object to use for callback
 */
Stream.prototype.forEach = function(callback, thisObject) {
	while (!this.ended) {
		var data = this.stream.read();
		while (!data && !this.ended) {
			this.reading = Fiber.current;
			Fiber.yield();
			data = this.stream.read();
		}
		if (data) {
			callback.call(thisObject, new ByteArray(data));
		}
	}
};

/**
 * Read up to n bytes from the stream, or until the end of the stream has been
 * reached. If n is null, a block is read with a block-size specific to the
 * underlying device. If n is not specified, the full stream is read until its
 * end is reached. Reading from a stream where the end has been reached returns
 * an empty ByteString.
 *
 * @name Stream.prototype.read
 * @param {Number} n
 * @returns {ByteString}
 * @function
 */
Stream.prototype.read = function(n) {
	var buffer = new MemoryStream();
	while (n !== 0 && !this.ended) {
		var data = this.stream.read(n);
		while (!data && !this.ended) {
			this.reading = Fiber.current;
			Fiber.yield();
			data = this.stream.read(n);
		}
		if (n === null) {
			n = 0;
		}
		if (data) {
			data = new ByteArray(data);
			if (n) {
				n -= data.length;
			}
			buffer.write(data);
		}
	}
	return buffer.content.toByteString();
};

/**
 * Read bytes from this stream into the given buffer. This method does <i>not</i>
 * increase the length of the buffer.
 *
 * @name Stream.prototype.readInto
 * @param {ByteArray} buffer
 * @param {Number} begin
 * @param {Number} end
 * @returns {Number} The number of bytes read or -1 if the end of the stream has
 * been reached
 * @function
 */
Stream.prototype.readInto = function(buffer, begin, end) {
	var length = buffer.length;
	if (!begin && begin !== 0) {
		begin = 0;
	}
	if (!end && end !== 0) {
		end = length;
	}
	if (begin < end) {
		var bytes = this.read(end - begin);
		bytes.copy(0, bytes.length, buffer, begin);
	}
};

/**
 * Try to skip over num bytes in the stream. Returns the number of acutal bytes
 * skipped or throws an error if the operation could not be completed.
 *
 * @name Stream.prototype.skip
 * @param {Number} num bytes to skip
 * @returns {Number} actual bytes skipped
 * @function
 */
Stream.prototype.skip = function(num) {
	return this.read(num).length;
};

/**
 * Closes the stream, freeing the resources it is holding.
 *
 * @name Stream.prototype.close
 * @function
 */
Stream.prototype.close = function() {
	if (this.writable()) {
		var fiber = Fiber.current;
		this.stream.end(function() {
			fiber.run();
		});
		Fiber.yield();
	}
	this.ended = true;
	delete this.stream;
};

/**
 * Returns true if the stream has been closed, false otherwise.
 *
 * @name Stream.prototype.closed
 * @function
 */
Stream.prototype.closed = function() {
	return !this.stream;
};

/**
 * Write bytes from b to this stream. If begin and end are specified, only the
 * range starting at begin and ending before end is written.
 *
 * @name Stream.prototype.write
 * @param {Binary} source The source to be written from
 * @param {Number} begin optional
 * @param {Number} end optional
 * @function
 */
Stream.prototype.write = function(source, begin, end) {
	if (!this.writable()) {
		throw new Error('stream is not writable');
	} else if (!(source instanceof Binary)) {
		throw new Error('source must be Binary');
	} else {
		if (begin || end) {
			source = source.slice(begin, end);
		}
		this.drained = this.stream.write(source.buffer);
	}
};

/**
 * Flushes the bytes written to the stream to the underlying medium.
 *
 * @name Stream.prototype.flush
 * @function
 */
Stream.prototype.flush = function() {
	if (this.writable() && !this.drained) {
		this.flushing = Fiber.current;
		Fiber.yield();
	}
};

/**
 * Reads all data available from this stream and writes the result to the given
 * output stream, flushing afterwards. Note that this function does not close
 * this stream or the output stream after copying.
 *
 * @param {Stream} output The target Stream to be written to.
 */
Stream.prototype.copy = function(output) {
	this.forEach(function(data) {
		output.write(data);
	});
	output.flush();
};

/**
 * In binary stream that reads from and/or writes to an in-memory byte array. If
 * the stream is writable, its internal buffer will automatically expand on demand.
 *
 * @param {Binary|number} bufferOrCapacity the buffer to use, or the capacity of
 * the buffer to allocate . If this is a number, a ByteArray with the given
 * length is allocated. If this is a ByteArray, the resulting stream is both
 * readable, writable, and seekable. If this is a ByteString, the resulting
 * stream is readable and seekable but not writable. If undefined, a ByteArray
 * of length 1024 is allocated as buffer.
 * @constructor
 */
var MemoryStream = exports.MemoryStream = function(bufferOrCapacity) {
	var buffer, length;
	if (!bufferOrCapacity) {
		buffer = new ByteArray(0);
		length = 0;
	} else if (bufferOrCapacity instanceof Binary) {
		buffer = bufferOrCapacity;
		length = buffer.length;
	} else if (typeof bufferOrCapacity === "number") {
		buffer = new ByteArray(bufferOrCapacity);
		length = 0;
	} else {
		throw new Error("buffer argument must be Binary or undefined");
	}

	var stream = Object.create(Stream.prototype);
	var position = 0;
	var closed = false;
	var canWrite = buffer instanceof ByteArray;

	function checkClosed() {
		if (closed) {
			throw new Error("Stream has been closed");
		}
	}

	/**
	 * @name MemoryStream.instance.readable
	 * @function
	 */
	stream.readable = function() {
		return true;
	};

	/**
	 * @name MemoryStream.instance.writable
	 * @function
	 */
	stream.writable = function() {
		return buffer instanceof ByteArray;
	};

	/**
	 * @name MemoryStream.instance.seekable
	 * @function
	 */
	stream.seekable = function() {
		return true;
	};

	/**
	 * @name MemoryStream.instance.read
	 * @function
	 */
	stream.read = function(num) {
		checkClosed();
		var result;
		if (isFinite(num)) {
			if (num < 0) {
				throw new Error("read(): argument must not be negative");
			}
			var end = Math.min(position + num, length);
			result = new ByteString(buffer.slice(position, end));
			position = end;
			return result;
		} else {
			result = new ByteString(buffer.slice(position, length));
			position = length;
		}

		return result;
	};

	/**
	 * @name MemoryStream.instance.readInto
	 * @function
	 */
	stream.readInto = function(target, begin, end) {
		checkClosed();
		if (!(target instanceof ByteArray)) {
			throw new Error("readInto(): first argument must be ByteArray");
		}
		if (position >= length) {
			return -1;
		}
		begin = begin === undefined ? 0 : Math.max(0, begin);
		end = end === undefined ? target.length : Math.min(target.length, end);
		if (begin < 0 || end < 0) {
			throw new Error("readInto(): begin and end must not be negative");
		} else if (begin > end) {
			throw new Error("readInto(): end must be greater than begin");
		}
		var count = Math.min(length - position, end - begin);
		buffer.copy(position, position + count, target, begin);
		position += count;
		return count;
	};

	/**
	 * @name MemoryStream.instance.write
	 * @function
	 */
	stream.write = function(source, begin, end) {
		checkClosed();
		if (!this.writable()) {
			throw new Error('stream is not writable');
		}
		if (typeof source === "string") {
			source = source.toByteString();
		}
		if (!(source instanceof Binary)) {
			throw new Error("write(): first argument must be binary");
		}
		begin = begin === undefined ? 0 : Math.max(0, begin);
		end = end === undefined ? source.length : Math.min(source.length, end);
		if (begin > end) {
			throw new Error("write(): end must be greater than begin");
		}
		var count = end - begin;
		source.copy(begin, end, buffer, position);
		position += count;
		if (position > length) {
			length = position;
		}
	};

	//TODO add these to MemoryStream.prototype to speed up object creation

	/**
	 * @name MemoryStream.instance.content
	 */
	Object.defineProperty(stream, "content", {
		get:function() {
			return buffer;
		}
	});

	/**
	 * @name MemoryStream.instance.length
	 */
	Object.defineProperty(stream, "length", {
		get:function() {
			checkClosed();
			return length;
		},
		set:function(value) {
			if (canWrite) {
				checkClosed();
				length = buffer.length = value;
				position = Math.min(position, length);
			}
		}
	});

	/**
	 * @name MemoryStream.instance.position
	 */
	Object.defineProperty(stream, "position", {
		get:function() {
			checkClosed();
			return position;
		},
		set:function(value) {
			checkClosed();
			position = Math.min(Math.max(0, value), length);
		}
	});

	/**
	 * @name MemoryStream.instance.skip
	 * @function
	 */
	stream.skip = function(num) {
		checkClosed();
		num = Math.min(parseInt(num, 10), length - position);
		if (isNaN(num)) {
			throw new Error("skip() requires a number argument");
		} else if (num < 0) {
			throw new Error("Argument to skip() must not be negative");
		}
		position += num;
		return num;
	};

	/**
	 * @name MemoryStream.instance.flush
	 * @function
	 */
	stream.flush = function() {
		checkClosed();
	};

	/**
	 * Closes the stream, freeing the resources it is holding.
	 *
	 * @name MemoryStream.instance.close
	 * @function
	 */
	stream.close = function() {
		checkClosed();
		closed = true;
	};

	/**
	 * Returns true if the stream is closed, false otherwise.
	 *
	 * @name MemoryStream.instance.closed
	 * @function
	 */
	stream.closed = function() {
		return closed;
	};

	return stream;
};

/**
 * A TextStream implements an I/O stream used to read and write strings. It
 * wraps a raw Stream and exposes a similar interface.
 *
 * @param {Stream} io The raw Stream to be wrapped.
 * @param {Object} options the options object. Supports the following
 * properties:
 * <ul>
 * <li>charset: string containing the name of the encoding to use. Defaults to
 * "utf8".</li>
 * <li>newline: string containing the newline character sequence to use.
 * Defaults to "\n".</li>
 * <li>delimiter: string containing the delimiter to use in print(). Defaults
 * to " ".</li>
 * </ul>
 * @constructor
 */
var TextStream = exports.TextStream = function(io, options) {
	if (!(this instanceof TextStream)) {
		return new TextStream(io, options);
	}

	options = options || {};
	var charset = options.charset || "utf8";
	var newline = options.hasOwnProperty("newline") ? options.newline : "\n";
	var delimiter = options.hasOwnProperty("delimiter") ? options.delimiter : " ";

	/** See `Stream.prototype.readable`. */
	this.readable = function() {
		return io.readable();
	};

	/** See `Stream.prototype.writable`. */
	this.writable = function() {
		return io.writable();
	};

	/**
	 * Always returns false, as a TextStream is not randomly accessible.
	 */
	this.seekable = function() {
		return false;
	};

	/**
	 * Reads a line from this stream. If the end of the stream is reached before
	 * any data is gathered, returns an empty string. Otherwise, returns the line
	 * including the newline.
	 *
	 * @returns {String}
	 */
	this.readLine = function() {
		var b, blocks = [];
		while (true) {
			if (this.block) {
				b = this.block;
				delete this.block;
			} else {
				b = io.read(null).decodeToString(charset);
			}
			if (!b.length) {
				return blocks.join('');
			}
			var i = b.indexOf(newline);
			if (i !== -1) {
				var j = i + newline.length;
				blocks.push(b.substr(0, j));
				this.block = b.substr(j);
				return blocks.join('');
			} else {
				blocks.push(b);
			}
		}
	};

	/**
	 * Returns this stream (which also is an Iterator).
	 *
	 * @function
	 */
	this.iterator = this.__iterator__ = function() {
		return this;
	};

	function stripNewLine(line) {
		return line.substr(-newline.length) === newline ? line.substr(0, line.length - newline.length) : line;
	}

	/**
	 * Returns the next line of input without the newline. Throws `StopIteration`
	 * if the end of the stream is reached.
	 */
	this.next = function() {
		var line = this.readLine();
		if (!line) {
			throw StopIteration;
		}
		return stripNewLine(line);
	};

	this.forEach = function(callback, thisObj) {
		do {
			var line = this.readLine();
			if (line.length) {
				// TODO optimize by passing an arg into readline to strip newline
				callback.call(thisObj, stripNewLine(line));
			}
		} while (line.length);
	};

	/**
	 * Returns an Array of Strings, accumulated by calling `readLine` until it
	 * returns an empty string. The returned array does not include the final
	 * empty string, but it does include a trailing newline at the end of every
	 * line.
	 */
	this.readLines = function() {
		var lines = [];
		do {
			var line = this.readLine();
			if (line.length)
				lines.push(line);
		} while (line.length);
		return lines;
	};

	/**
	 * Read the full stream until the end is reached and return the data read as
	 * string.
	 *
	 * @returns {String}
	 */
	this.read = function() {
		//TODO this doesn't work when a null parameter is passed in and the user
		// expects it to behave the same way as a normal stream
		var r = io.read().decodeToString(charset);
		if (this.block) {
			var block = this.block;
			delete this.block;
			return block + r;
		}
		return r;
	};

	/**
	 * Not implemented for TextStream. Calling this method will raise an error.
	 */
	this.readInto = function(buffer) {
		throw new Error("Not implemented");
	};

	/**
	 * Reads from this stream with `readLine`, writing the results to the target
	 * stream and flushing, until the end of this stream is reached.
	 */
	this.copy = function(output) {
		while (true) {
			var line = this.readLine();
			if (!line.length)
				break;
			output.write(line);
		}
		return this;
	};

	this.write = function() {
		for (var i = 0; i < arguments.length; i++) {
			io.write(String(arguments[i]).toByteString());
		}
		return this;
	};

	/**
	 * Writes the given line, followed by a newline.
	 */
	this.writeLine = function(line) {
		this.write(line + newline);
		return this;
	};

	/**
	 * Writens the given lines, terminating each line with a newline.
	 *
	 * This is a non-standard extension, not part of CommonJS IO/A.
	 */
	this.writeLines = function(lines) {
		lines.forEach(this.writeLine, this);
		return this;
	};

	/**
	 * Writes all argument values as a single line, delimiting the values using a
	 * single blank.
	 */
	this.print = function() {
		for (var i = 0; i < arguments.length; i++) {
			this.write(String(arguments[i]));
			if (i < arguments.length - 1) {
				this.write(delimiter);
			}
		}
		this.write(newline);
		this.flush();
		return this;
	};

	/** See `Stream.prototype.flush`. */
	this.flush = function() {
		io.flush();
		return this;
	};

	/** See `Stream.prototype.close`. */
	this.close = function() {
		io.close();
	};

	/** See `Stream.prototype.closed`. */
	this.closed = function() {
		return io.closed();
	};

	Object.defineProperty(this, "content", {
		get:function() {
			// TODO figure out whether we can actually io.content to equal something,
			// currently this breaks
			var wrappedContent = new ByteString(io.content.buffer);
			if (!wrappedContent) {
				return "";
			}
			return wrappedContent.decodeToString(charset);
		}
	});

	Object.defineProperty(this, "raw", {
		get:function() {
			return io;
		}
	});

	return this;
};
TextStream.prototype = Object.create(Stream.prototype);