/**
 * @fileoverview Stream and TextStream classes as per [CommonJS
 * IO/A](http://wiki.commonjs.org/wiki/IO/A) as well as a ByteArray based in
 * memory MemoryStream.
 */
var Fiber = require('fibers');
var binary = require('./binary');
var Binary = binary.Binary, ByteArray = binary.ByteArray, ByteString = binary.ByteString;

function notWritable() {
  throw new Error('stream is not writable');
}

function notReadable() {
  throw new Error('stream is not readable');
}

function noop() {
  return this;
}

/**
 * This class implements an I/O stream used to read and write raw bytes.
 *
 * @constructor
 * @param stream Node.js stream
 * Stream](http://nodejs.org/docs/v0.4.8/api/streams.html#streams) that can be
 * readable, writeable or both
 */
var Stream = exports.Stream = function(stream) {
  if (stream instanceof Stream) {
    return stream;
  } else if (!(this instanceof Stream)) {
    return new Stream(arguments[0]);
  }

  var error;
  this._resume = function(fiber) {
    if (error) {
      fiber.throwInto(error);
    } else {
      fiber.run();
    }
  };
  this.stream = stream.on('error', function(e) {
    error = e;
  });
  var that = this;

  if (this.writable()) {
    this.drained = true;
    stream.on('drain', function() {
      that.drained = true;
      if (that.flushing) {
        var fiber = that.flushing;
        that.flushing = null;
        that._resume(fiber);
      }
    });
  } else {
    this.write = notWritable;
    this.flush = noop;
  }

  if (this.readable()) {
    function handleRead() {
      if (that.reading) {
        var fiber = that.reading;
        that.reading = null;
        that._resume(fiber);
      }
    }

    this.ended = false;
    this._end = function() {
      that.ended = true;
      handleRead();
    };
    stream.on('readable', handleRead).on('end', this._end);
  } else {
    this.forEach = notReadable;
    this.read = notReadable;
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
 * Read all data from this stream and invoke function `callback` for each chunk of
 * data read. The callback function is called with a ByteArray as single
 * argument. Note that the stream is not closed after reading.
 *
 * @param {Function} callback the callback function
 * @param {Object} [thisObject] optional this-object to use for callback
 */
Stream.prototype.forEach = function(callback, thisObject) {
  while (!this.ended) {
    var data = this.stream.read(null);
    if (!data) {
      this.reading = Fiber.current;
      Fiber.yield();
    } else {
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
  var buffers = [];
  while (n !== 0 && !this.ended) {
    var data = this.stream.read(n);
    if (!data) {
      this.reading = Fiber.current;
      Fiber.yield();
    } else {
      if (n === null) {
        n = 0;
      } else if (typeof n === 'number') {
        n -= data.length;
      }
      buffers.push(new ByteString(data));
    }
  }
  if (buffers.length === 0) {
    return ByteString.EMPTY;
  } else if (buffers.length === 1) {
    return buffers[0];
  } else {
    return buffers.shift().concat(buffers);
  }
};

/**
 * Read bytes from this stream into the given buffer. This method does <i>not</i>
 * increase the length of the buffer.
 *
 * @name Stream.prototype.readInto
 * @param {ByteArray} buffer
 * @param {Number} [begin]
 * @param {Number} [end]
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
    var that = this;
    this.stream.end(function() {
      that._resume(fiber);
    });
    Fiber.yield();
  }
  if (this.stream && typeof this.stream.close === 'function') {
    this.stream.close();
  }
  this.ended = true;
  this.stream = null;
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
 * @param {Number} [begin]
 * @param {Number} [end]
 * @function
 */
Stream.prototype.write = function(source, begin, end) {
  if (begin || end) {
    source = source.slice(begin, end);
  }
  this.drained = this.stream.write(source.buffer);
};

/**
 * Flushes the bytes written to the stream to the underlying medium.
 *
 * @name Stream.prototype.flush
 * @function
 */
Stream.prototype.flush = function() {
  if (!this.drained) {
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
  if (!bufferOrCapacity) {
    this.content = new ByteArray(0);
    this._length = 0;
  } else if (bufferOrCapacity instanceof Binary) {
    this.content = bufferOrCapacity;
    this._length = this.content.length;
  } else if (typeof bufferOrCapacity === "number") {
    this.content = new ByteArray(bufferOrCapacity);
    this._length = 0;
  } else {
    throw new Error("buffer argument must be Binary or undefined");
  }

  this._position = 0;
  /**
   * Returns true if the stream is closed, false otherwise.
   *
   * @name MemoryStream.instance.closed
   * @function
   */
  this.closed = false;

  if (!this.writable()) {
    this.write = notWritable;
    this.flush = noop;
  }

  return this;
};
MemoryStream.prototype = Object.create(Stream.prototype);

MemoryStream.prototype._checkClosed = function() {
  if (this.closed) {
    throw new Error("Stream has been closed");
  }
};

/**
 * @name MemoryStream.instance.length
 */
Object.defineProperty(MemoryStream.prototype, "length", {
  get:function() {
    this._checkClosed();
    return this._length;
  },
  set:function(value) {
    if (this.writable()) {
      this._checkClosed();
      this._length = value;
      this.content.length = value;
      this._position = Math.min(this._position, this._length);
    }
  }
});

/**
 * @name MemoryStream.instance.position
 */
Object.defineProperty(MemoryStream.prototype, "position", {
  get:function() {
    this._checkClosed();
    return this._position;
  },
  set:function(value) {
    this._checkClosed();
    this._position = Math.min(Math.max(0, value), this._length);
  }
});

/**
 * @name MemoryStream.instance.readable
 * @function
 */
MemoryStream.prototype.readable = function() {
  return true;
};

/**
 * @name MemoryStream.instance.writable
 * @function
 */
MemoryStream.prototype.writable = function() {
  return this.content instanceof ByteArray;
};

/**
 * @name MemoryStream.instance.seekable
 * @function
 */
MemoryStream.prototype.seekable = function() {
  return true;
};

/**
 * @name MemoryStream.instance.read
 * @param {Number} num
 * @function
 */
MemoryStream.prototype.read = function(num) {
  this._checkClosed();
  var result;
  if (isFinite(num)) {
    if (num < 0) {
      throw new Error("read(): argument must not be negative");
    }
    var end = Math.min(this._position + num, this._length);
    result = this.content.slice(this._position, end).toByteString();
    this._position = end;
    return result;
  } else {
    result = this.content.slice(this._position, this._length).toByteString();
    this._position = this._length;
  }
  return result;
};

/**
 * @name MemoryStream.instance.readInto
 * @param {ByteArray} target
 * @param {Number} [begin]
 * @param {Number} [end]
 * @function
 */
MemoryStream.prototype.readInto = function(target, begin, end) {
  this._checkClosed();
  if (this._position >= this._length) {
    return -1;
  }
  begin = typeof begin === 'undefined' ? 0 : Math.max(0, begin);
  end = typeof end === 'undefined' ? target.length : Math.min(target.length, end);
  if (begin > end) {
    throw new Error("readInto(): end must be greater than begin");
  }
  var count = Math.min(this._length - this._position, end - begin);
  var pos = this._position + count;
  this.content.copy(this._position, pos, target, begin);
  this._position = pos;
  return count;
};

/**
 * @name MemoryStream.instance.write
 * @param {Binary} source The source to be written from
 * @param {Number} [begin]
 * @param {Number} [end]
 * @function
 */
MemoryStream.prototype.write = function(source, begin, end) {
  this._checkClosed();
  if (typeof source === "string") {
    source = source.toByteString();
  }
  if (!(source instanceof Binary)) {
    throw new Error("write(): first argument must be binary");
  }
  begin = typeof begin === 'undefined' ? 0 : Math.max(0, begin);
  end = typeof end === 'undefined' ? source.length : Math.min(source.length, end);
  if (begin > end) {
    throw new Error("write(): end must be greater than begin");
  }
  var count = end - begin;
  var pos = this._position + count;
  if (this._length < pos) {
    this._length = pos;
    this.content.length = pos;
  }
  source.copy(begin, end, this.content, this._position);
  this._position = pos;
};

/**
 * @name MemoryStream.instance.flush
 * @function
 */
MemoryStream.prototype.flush = MemoryStream.prototype._checkClosed;

/**
 * Closes the stream, freeing the resources it is holding.
 *
 * @name MemoryStream.instance.close
 * @function
 */
MemoryStream.prototype.close = function() {
  this._checkClosed();
  this.closed = true;
};

/**
 * @name MemoryStream.instance.skip
 * @param {Number} num
 * @function
 */
MemoryStream.prototype.skip = function(num) {
  this._checkClosed();
  var pos = this.position;
  this.position += num;
  return this.position - pos;
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

  this.raw = io;
  options = options || {};
  this._charset = binary.toNodeCharset(options.charset);
  this._newline = options.hasOwnProperty("newline") ? options.newline : "\n";
  this._delimiter = options.hasOwnProperty("delimiter") ? options.delimiter : " ";

  if (!this.readable()) {
    this.readLine = notReadable;
  }

  return this;
};
TextStream.prototype = Object.create(Stream.prototype);

Object.defineProperty(TextStream.prototype, "content", {
  get:function() {
    if (this.raw instanceof MemoryStream) {
      return this.raw.content.decodeToString(this._charset);
    } else {
      return '';
    }
  }
});

/** See `Stream.prototype.readable`. */
TextStream.prototype.readable = function() {
  return this.raw.readable();
};

/** See `Stream.prototype.writable`. */
TextStream.prototype.writable = function() {
  return this.raw.writable();
};

/**
 * Always returns false, as a TextStream is not randomly accessible.
 */
TextStream.prototype.seekable = function() {
  return false;
};

/**
 * Returns this stream (which also is an Iterator).
 *
 * @function
 */
TextStream.prototype.iterator = TextStream.prototype.__iterator__ = function() {
  return this;
};

TextStream.prototype._strip = function(line) {
  return line.substr(-this._newline.length) === this._newline ? line.substr(0, line.length - this._newline.length) : line;
};

/**
 * Returns the next line of input without the newline. Throws `StopIteration`
 * if the end of the stream is reached.
 */
TextStream.prototype.next = function() {
  var line = this.readLine();
  if (!line) {
    throw StopIteration;
  }
  return this._strip(line);
};

/**
 * Reads a line from this stream. If the end of the stream is reached before
 * any data is gathered, returns an empty string. Otherwise, returns the line
 * including the newline.
 *
 * @returns {String}
 */
TextStream.prototype.readLine = function() {
  var b, blocks = [];
  while (true) {
    if (this._block) {
      b = this._block;
      this._block = null;
    } else {
      b = this.raw.read(null).decodeToString(this._charset);
    }
    if (!b.length) {
      return blocks.join('');
    }
    var i = b.indexOf(this._newline);
    if (i !== -1) {
      var j = i + this._newline.length;
      blocks.push(b.substr(0, j));
      this._block = b.substr(j);
      return blocks.join('');
    } else {
      blocks.push(b);
    }
  }
};

/**
 * Calls `callback` with each line in the input stream.
 *
 * @param {Function} callback the callback function
 * @param {Object} [thisObj] optional this-object to use for callback
 */
TextStream.prototype.forEach = function(callback, thisObj) {
  var line;
  while ((line = this.readLine()).length) {
    callback.call(thisObj, this._strip(line));
  }
};

/**
 * Returns an Array of Strings, accumulated by calling `readLine` until it
 * returns an empty string. The returned array does not include the final
 * empty string, but it does include a trailing newline at the end of every
 * line.
 */
TextStream.prototype.readLines = function() {
  var lines = [];
  var line;
  while ((line = this.readLine()).length) {
    lines.push(line);
  }
  return lines;
};

/**
 * Read the full stream until the end is reached and return the data read as
 * string.
 *
 * @returns {String}
 */
TextStream.prototype.read = function() {
  //TODO this doesn't work when a null parameter is passed in and the user
  // expects it to behave the same way as a normal stream
  var r = this.raw.read().decodeToString(this._charset);
  if (this._block) {
    var block = this._block;
    this._block = null;
    return block + r;
  }
  return r;
};

/**
 * Not implemented for TextStream. Calling this method will raise an error.
 */
TextStream.prototype.readInto = function() {
  throw new Error("Not implemented");
};

/**
 * Reads from this stream with `readLine`, writing the results to the target
 * stream and flushing, until the end of this stream is reached.
 *
 * @param {Stream} output The target Stream to be written to.
 */
TextStream.prototype.copy = function(output) {
  var line;
  while ((line = this.readLine()).length) {
    output.write(line);
  }
  return this;
};

TextStream.prototype.write = function() {
  for (var i = 0; i < arguments.length; i++) {
    this.raw.write(String(arguments[i]).toByteString());
  }
  return this;
};

/**
 * Writes the given line, followed by a newline.
 *
 * @param {String} line
 */
TextStream.prototype.writeLine = function(line) {
  this.write(line + this._newline);
  return this;
};

/**
 * Writens the given lines, terminating each line with a newline.
 *
 * This is a non-standard extension, not part of CommonJS IO/A.
 *
 * @param {Array} lines
 */
TextStream.prototype.writeLines = function(lines) {
  for (var i = 0; i < lines.length; i++) {
    this.write(lines[i] + this._newline);
  }
  return this;
};

/**
 * Writes all argument values as a single line, delimiting the values using a
 * single blank.
 */
TextStream.prototype.print = function() {
  for (var i = 0; i < arguments.length; i++) {
    this.write(String(arguments[i]));
    if (i < arguments.length - 1) {
      this.write(this._delimiter);
    }
  }
  this.write(this._newline);
  this.flush();
  return this;
};

/** See `Stream.prototype.flush`. */
TextStream.prototype.flush = function() {
  this.raw.flush();
  return this;
};

/** See `Stream.prototype.close`. */
TextStream.prototype.close = function() {
  this.raw.close();
};

/** See `Stream.prototype.closed`. */
TextStream.prototype.closed = function() {
  return this.raw.closed();
};