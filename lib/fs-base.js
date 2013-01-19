/**
 * @fileoverview File and path related functionality as defined in [CommonJS
 * Filesystem/A](http://wiki.commonjs.org/wiki/Filesystem/A).
 * @name fs
 */
var Fiber = require('fibers');
var nodePath = require('path');
var fs = require('fs');

var io = require('./io');
var Stream = io.Stream, TextStream = io.TextStream;
var binary = require('./binary');
var Binary = binary.Binary;

var SEPARATOR = exports.separator = nodePath.sep;
var SEPARATOR_RE = SEPARATOR == '/' ?
                   new RegExp(SEPARATOR) :
                   new RegExp(SEPARATOR.replace("\\", "\\\\") + "|/");
var EXTSEP = '.';
var NON_EXTSEP_RE = new RegExp('[^' + EXTSEP + ']');

function resolveFile(path) {
	if(path == undefined) {
		throw new Error('undefined path argument');
	}
	return absolute(path);
}

/**
 * Open an IO stream for reading/writing to the file corresponding to the given
 * path.
 */
var open = exports.open = function(path, options) {
	options = checkOptions(options);
	var file = resolveFile(path);
	var read = options.read;
	if(!options.read && !options.write && !options.append && !options.update) {
		read = true;
	}
	var stream = new Stream(read ? fs.createReadStream(file) : fs
			.createWriteStream(file, Boolean(options.append)));
	if(options.binary) {
		return stream;
	} else if(read || options.write || options.append) {
		return new TextStream(stream, {
			charset: options.charset
		});
	} else if(exports.update) {
		throw new Error("update not yet implemented");
	}
};

var openRaw = exports.openRaw = function(path, mode, permissions) {
	// TODO things missing here
	var file = resolveFile(path);
	mode = mode || {};
	var read = mode.read;
	if(!mode.read && !mode.write && !mode.append) {
		read = true;
	}
	if(read) {
		return new Stream(fs.createReadStream(file));
	} else {
		return new Stream(fs.createWriteStream(file, Boolean(mode.append)));
	}
};

/**
 * Open, read, and close a file, returning the file's contents.
 */
var read = exports.read = function(path, options) {
	options = options === undefined ? {} : checkOptions(options);
	options.read = true;
	var stream = open(path, options);
	try {
		return stream.read();
	} finally {
		stream.close();
	}
};

/**
 * Open, write, flush, and close a file, writing the given content. If content
 * is a binary.ByteArray or binary.ByteString, binary mode is implied.
 */
var write = exports.write = function(path, content, options) {
	options = options === undefined ? {} : checkOptions(options);
	options.write = true;
	options.binary = content instanceof Binary;
	var stream = open(path, options);

	try {
		stream.write(content);
		stream.flush();
	} finally {
		stream.close();
	}
};

/**
 * Read data from one file and write it into another using binary mode.
 */
var copy = exports.copy = function(from, to) {
	var source = resolveFile(from);
	var target = resolveFile(to);
	var input = new Stream(fs.createReadStream(source));
	var output = new Stream(fs.createWriteStream(target));
	try {
		input.forEach(function(e) {
			output.write(e);
		});
	} finally {
		input.close();
		output.close();
	}
};

/**
 * Copy files from a source path to a target path. Files of the below the source
 * path are copied to the corresponding locations relative to the target path,
 * symbolic links to directories are copied but not traversed into.
 */
var copyTree = exports.copyTree = function(from, to) {
	var source = resolveFile(from).getCanonicalFile();
	var target = resolveFile(to).getCanonicalFile();
	if(String(target) == String(source)) {
		throw new Error("Source and target files are equal in copyTree.");
	} else if(String(target).indexOf(String(source) + SEPARATOR) == 0) {
		throw new Error("Target is a child of source in copyTree");
	}
	if(isDirectory(source)) {
		makeTree(target);
		var files = source.list();
		for( var file in files) {
			var s = join(source, file);
			var t = join(target, file);
			if(isLink(s)) {
				symbolicLink(readLink(s), t);
			} else {
				copyTree(s, t);
			}
		}
	} else {
		copy(source, target);
	}
};

/**
 * Create the directory specified by "path" including any missing parent
 * directories.
 */
var makeTree = exports.makeTree = function(path) {
	var paths = split(resolveFile(path));
	var directory = paths.shift() + SEPARATOR;
	while(paths.length) {
		directory += paths.shift() + SEPARATOR;
		if(!exists(directory)) {
			makeDirectory(directory);
		}
	}
};

/**
 * Return an array with all directories below (and including) the given path, as
 * discovered by depth-first traversal. Entries are in lexically sorted order
 * within directories. Symbolic links to directories are not traversed into.
 */
var listDirectoryTree = exports.listDirectoryTree = function(path) {
	path = path === '' ? '.' : String(path);
	var result = [''];
	list(path).forEach(function(child) {
		var childPath = join(path, child);
		if(isDirectory(childPath)) {
			if(!isLink(childPath)) {
				result.push.apply(result, listDirectoryTree(childPath).map(function(p) {
					return join(child, p);
				}));
			} else { // Don't follow symlinks.
				result.push(child);
			}
		}
	});
	return result.sort();
};

/**
 * Return an array with all paths (files, directories, etc.) below (and
 * including) the given path, as discovered by depth-first traversal. Entries
 * are in lexically sorted order within directories. Symbolic links to
 * directories are returned but not traversed into.
 */
var listTree = exports.listTree = function(path) {
	path = path === '' ? '.' : String(path);
	var result = [''];
	list(path).forEach(function(child) {
		var childPath = join(path, child);
		// Don't follow directory symlinks, but include them
		if(isDirectory(childPath) && !isLink(childPath)) {
			result.push.apply(result, listTree(childPath).map(function(p) {
				return join(child, p);
			}));
		} else {
			// Add file or symlinked directory.
			result.push(child);
		}
	});
	return result.sort();
};

function sync(method) {
	return function() {
		var args = Array.prototype.slice.call(arguments);
		var fiber = Fiber.current;
		args.push(function(err, result) {
			fiber.run(err || result);
		});
		method.apply(null, args);
		var result = Fiber.yield();
		if(result instanceof Error)
			throw new Error(result.message);
		return result;
	};
}

var fss = {};
var methods = ['lstat', 'stat', 'readdir', 'rmdir', 'unlink', 'rename',
		'mkdir', 'symlink', 'link', 'readlink', 'chmod', 'chown', ];
for( var i = 0; i < methods.length; i++) {
	var name = methods[i];
	fss[name] = sync(fs[name]);
}

/**
 * Remove the element pointed to by the given path. If path points to a
 * directory, all members of the directory are removed recursively.
 */
var removeTree = exports.removeTree = function(path) {
	var stats = fss.lstat(path);
	if(stats.isDirectory() && !stats.isSymbolicLink()) {
		var files = fss.readdir(path);
		for( var i = 0; i < files.length; i++) {
			removeTree(join(path, files[i]));
		}
	}
	fss[stats.isDirectory() ? 'rmdir' : 'unlink'](path);
};

/**
 * Make the given path absolute by resolving it against the current working
 * directory.
 */
var absolute = exports.absolute = function(path) {
	return nodePath.resolve(process.cwd(), path);
};

/**
 * Return the basename of the given path. That is the path with any leading
 * directory components removed. If specified, also remove a trailing extension.
 */
var base = exports.base = function(path, ext) {
	return nodePath.basename(path, ext);
};

/**
 * Return the dirname of the given path. That is the path with any trailing
 * non-directory component removed.
 */
var directory = exports.directory = function(path) {
	return nodePath.dirname(path);
};

/**
 * Return the extension of a given path. That is everything after the last dot
 * in the basename of the given path, including the last dot. Returns an empty
 * string if no valid extension exists.
 */
var extension = exports.extension = function(path) {
	var base = nodePath.basename(path);
	var first_non_sep = NON_EXTSEP_RE.exec(base);
	var last_sep = base.lastIndexOf(EXTSEP);
	if (first_non_sep == null || first_non_sep.index > last_sep) {
		return '';
	} else {
		return base.slice(last_sep);
	}
};

/**
 * Join a list of paths using the local file system's path separator. The result
 * is not normalized, so `join("..", "foo")` returns `"../foo"`.
 * 
 * @see http://wiki.commonjs.org/wiki/Filesystem/Join
 * 
 */
var join = exports.join = function() {
	// filter out empty strings to avoid join("", "foo") -> "/foo"
	var args = Array.prototype.slice.call(arguments);
	args = args.filter(function(p) {
		return p != "";
	});
	return args.join(SEPARATOR);
};

/**
 * Split a given path into an array of path components.
 */
var split = exports.split = function(path) {
	if(!path) {
		return [];
	}
	return String(path).split(SEPARATOR_RE);
};

/**
 * Normalize a path by removing '.' and simplifying '..' components, wherever
 * possible.
 */
var normal = exports.normal = function(path) {
	var nodeNormalized = nodePath.normalize(path);
	// This is a somewhat "hacky" solution, but these seem to be the
	// only exceptions in node's implementation, so this might suffice
	// until the whole function is re-implemented.
	if(nodeNormalized == '.' || nodeNormalized == '.' + SEPARATOR) {
		return '';
	} else {
		return nodeNormalized;
	}
};

/**
 * Join a list of paths by starting at an empty location and iteratively
 * "walking" to each path given. Correctly takes into account both relative and
 * absolute paths.
 */
var resolve = exports.resolve = function() {
	var paths = Array.prototype.slice.call(arguments);

	var first = relative('', paths.shift());

	if(!paths.length) {
		return first;
	} else {
		var second = paths.shift();
		if(second) {
			var dir = first;
			if(dir.length && dir[dir.length-1] != SEPARATOR) {
				dir = relative('', directory(first));
			}
			if(second[0] != SEPARATOR) {
				first = join(dir, second);
			} else {
				first = dir + relative(dir, second);
			}
		}
		paths.unshift(first);
		return resolve.apply(null, paths);
	}
};

// Adapted from narwhal.
/**
 * Establish the relative path that links source to target by strictly
 * traversing up ('..') to find a common ancestor of both paths. If the target
 * is omitted, returns the path to the source from the current working
 * directory.
 */
var relative = exports.relative = function(source, target) {
	var relativeNormalized = function(source, target) {
		if(source == target) {
			return '';
		}
		if(!target) {
			target = source;
			source = '';
		}
		source = source.split(SEPARATOR_RE);
		target = target.split(SEPARATOR_RE);

		if(source[source.length-1] != '..') {
			// Special case: .. always needs to be treated as a directory
			// even when not followed by a trailing slash.
			source.pop();
		}
		while(source.length && target.length && target[0] == source[0]) {
			source.shift();
			target.shift();
		}
		while(source.length) {
			source.shift();
			target.unshift("..");
		}
		var path = target.join(SEPARATOR);
		if(target.length && target[target.length-1] == '..') {
			path += SEPARATOR;
		}
		return path;
	};

	return relativeNormalized(normal(source), normal(target));
};

/**
 * Move a file from `source` to `target`.
 * 
 * @param {string} source the source path
 * @param {string} target the target path
 * @throws Error
 */
var move = exports.move = function(source, target) {
	var from = resolveFile(source);
	var to = resolveFile(target);
	fss.rename(from, to);
};

/**
 * Remove a file at the given `path`. Throws an error if `path` is not a file or
 * a symbolic link to a file.
 * 
 * @param {string} path the path of the file to remove.
 * @throws Error if path is not a file or could not be removed.
 */
var remove = exports.remove = function(path) {
	var file = resolveFile(path);
	fss.unlink(file);
};

/**
 * Return true if the file denoted by `path` exists, false otherwise.
 * 
 * @param {string} path the file path.
 */
var exists = exports.exists = function(path) {
	var fiber = Fiber.current;
	fs.exists(path, function(e) {
		fiber.run(e);
	});
	return Fiber.yield();
};

/**
 * Return the path name of the current working directory.
 * 
 * @returns {string} the current working directory
 */
var workingDirectory = exports.workingDirectory = function() {
	return process.cwd() + SEPARATOR;
};

/**
 * Set the current working directory to `path`.
 * 
 * @param {string} path the new working directory
 */
var changeWorkingDirectory = exports.changeWorkingDirectory = function(path) {
	process.chdir(path);
};

/**
 * Remove a file or directory identified by `path`. Throws an error if `path` is
 * a directory and not empty.
 * 
 * @param path the directory path
 * @throws Error if the file or directory could not be removed.
 */
var removeDirectory = exports.removeDirectory = function(path) {
	var file = resolveFile(path);
	fss.rmdir(file);
};

/**
 * Returns an array with all the names of files contained in the direcory
 * `path`.
 * 
 * @param {string} path the directory path
 * @returns {Array} a list of file names
 */
var list = exports.list = function(path) {
	var file = resolveFile(path);
	return fss.readdir(file).sort();
};

/**
 * Returns the size of a file in bytes, or throws an exception if the path does
 * not correspond to an accessible path, or is not a regular file or a link.
 * 
 * @param {string} path the file path
 * @returns {number} the file size in bytes
 * @throws Error if path is not a file
 */
var size = exports.size = function(path) {
	var file = resolveFile(path);
	return fss.stat(file).size;
};

/**
 * Returns the time a file was last modified as a Date object.
 * 
 * @param {string} path the file path
 * @returns the date the file was last modified
 */
var lastModified = exports.lastModified = function(path) {
	var file = resolveFile(path);
	return fss.stat(file).mtime;
};

/**
 * Create a single directory specified by `path`. If the directory cannot be
 * created for any reason an error is thrown. This includes if the parent
 * directories of `path` are not present. If a `permissions` argument is passed
 * to this function it is used to create a Permissions instance which is applied
 * to the given path during directory creation.
 * 
 * @param {string} path the file path
 * @param {number|object} permissions optional permissions
 */
var makeDirectory = exports.makeDirectory = function(path, permissions) {
	var file = resolveFile(path);
	permissions = permissions != null ? new Permissions(permissions)
			: Permissions["default"];
	fss.mkdir(file, permissions.toNumber());
};

function isCheck(path, operation) {
	var file = resolveFile(path);
	if(exists(file)) {
		var uid = process.getuid(), gid = process.getgid();
		var s = fss.stat(file);
		var permissions = new Permissions(s.mode);
		return permissions.other[operation]
				|| (s.uid == uid && permissions.owner[operation])
				|| (s.gid == gid && permissions.group[operation]);
	}
	return false;
};

/**
 * Returns true if the file specified by path exists and can be opened for
 * reading.
 * 
 * @param {string} path the file path
 * @returns {boolean} whether the file exists and is readable
 */
var isReadable = exports.isReadable = function(path) {
	return isCheck(path, 'read');
};

/**
 * Returns true if the file specified by path exists and can be opened for
 * writing.
 * 
 * @param {string} path the file path
 * @returns {boolean} whether the file exists and is writable
 */
var isWritable = exports.isWritable = function(path) {
	return isCheck(path, 'write');
};

/**
 * Returns true if the file specified by path exists and is a regular file.
 * 
 * @param {string} path the file path
 * @returns {boolean} whether the file exists and is a file
 */
var isFile = exports.isFile = function(path) {
	var file = resolveFile(path);
	return exists(file) && fss.stat(file).isFile();
};

/**
 * Returns true if the file specified by path exists and is a directory.
 * 
 * @param {string} path the file path
 * @returns {boolean} whether the file exists and is a directory
 */
var isDirectory = exports.isDirectory = function(path) {
	var file = resolveFile(path);
	return exists(path) && fss.stat(file).isDirectory();
};

/**
 * Return true if target file is a symbolic link, false otherwise.
 * 
 * @param {string} path the file path
 * @returns true if the given file exists and is a symbolic link
 */
function isLink(path) {
	var file = resolveFile(path);
	return exists(path) && fss.lstat(file).isSymbolicLink();
}

/**
 * Returns whether two paths refer to the same storage (file or directory),
 * either by virtue of symbolic or hard links, such that modifying one would
 * modify the other.
 * 
 * @param {string} pathA the first path
 * @param {string} pathB the second path
 */
var same = exports.same = function(pathA, pathB) {
	pathA = canonical(pathA);
	pathB = canonical(pathB);
	return fss.stat(pathA).ino == fss.stat(pathB).ino;
};

/**
 * Returns whether two paths refer to an entity of the same file system.
 * 
 * @param {string} pathA the first path
 * @param {string} pathB the second path
 */
var sameFilesystem = exports.sameFilesystem = function(pathA, pathB) {
	pathA = canonical(pathA);
	pathB = canonical(pathB);

	return fss.stat(pathA).dev == fss.stat(pathB).dev;
};

/**
 * Returns the canonical path to a given abstract path. Canonical paths are both
 * absolute and intrinsic, such that all paths that refer to a given file
 * (whether it exists or not) have the same corresponding canonical path.
 * 
 * @param {string} path a file path
 * @returns the canonical path
 */
var canonical = exports.canonical = function(path) {
	var file = resolveFile(path);
	if(isLink(file)) {
		return canonical(readLink(file));
	}
	return file;
};

/**
 * Sets the modification time of a file or directory at a given path to a
 * specified time, or the current time. Creates an empty file at the given path
 * if no file or directory exists, using the default permissions.
 * 
 * @param {string} path the file path
 * @param {Date} mtime optional date
 */
var touch = exports.touch = function(path, mtime) {
	mtime = mtime || Date.now();
	// resolveFile(path) ...
	throw new Error("Not yet implemented, will be in Node 0.5");
};

/**
 * Creates a symbolic link at the target path that refers to the source path.
 * 
 * @param {string} source the source file
 * @param {string} target the target link
 */
var symbolicLink = exports.symbolicLink = function(source, target) {
	fss.symlink(resolveFile(source), target);
};

/**
 * Creates a hard link at the target path that refers to the source path.
 * 
 * @param {string} source the source file
 * @param {string} target the target file
 */
var hardLink = exports.hardLink = function(source, target) {
	fss.link(resolveFile(source), target);
};

/**
 * Returns the immediate target of the symbolic link at the given `path`.
 * 
 * @param {string} path a file path
 */
var readLink = exports.readLink = function(path) {
	var file = resolveFile(path);
	return fss.readlink(file);
};

/**
 * The Permissions class describes the permissions associated with a file.
 * 
 * @param {number|object} permissions a number or object representing the
 * permissions.
 * @param constructor
 */
var Permissions = exports.Permissions = function(permissions, constructor) {
	if(!(this instanceof Permissions)) {
		return new Permissions(permissions, constructor);
	}
	this.update(Permissions['default']);
	this.update(permissions);
	/** @ignore */
	this.constructor = constructor;
};

Permissions.prototype.update = function(permissions) {
	var fromNumber = typeof permissions == 'number';
	if(!fromNumber && !(permissions instanceof Object)) {
		return;
	}
	var u = ['owner', 'group', 'other'], p = ['read', 'write', 'execute'];
	for( var i in u) {
		var user = u[i];
		this[user] = this[user] || {};
		for( var j in p) {
			var perm = p[j];
			this[user][perm] = fromNumber ? Boolean((permissions <<= 1) & 512)
					: Boolean(permissions[user] && permissions[user][perm]);
		}
	}
};

Permissions.prototype.toNumber = function() {
	var result = 0;
	var u = ['owner', 'group', 'other'], p = ['read', 'write', 'execute'];
	for( var i in u) {
		var user = u[i];
		for( var j in p) {
			var perm = p[j];
			result <<= 1;
			result |= +this[user][perm];
		}
	}
	return result;
};

if(!Permissions['default']) {
	// TODO clean this up
	/*
	 * try { var POSIX = getPOSIX(); var umask = POSIX.umask(0022); if(umask !=
	 * 0022) { POSIX.umask(umask); } Permissions['default'] = new
	 * Permissions(~umask & 0777); } catch(error) {
	 */
	Permissions['default'] = new Permissions(0755);
	// }
}

var permissions = exports.permissions = function(path) {
	var file = resolveFile(path);
	return new Permissions(fss.stat(file).mode & 0777);
};

var owner = exports.owner = function(path) {
	try {
		var file = resolveFile(path);
		return fss.stat(file).uid;
	} catch(error) {
		return null;
	}
};

var group = exports.group = function(path) {
	try {
		var file = resolveFile(path);
		return fss.stat(file).gid;
	} catch(error) {
		return null;
	}
};

var changePermissions = exports.changePermissions = function(path, permissions) {
	permissions = new Permissions(permissions);
	var file = resolveFile(path);
	var stat = fss.stat(file);
	// do not overwrite set-UID bits etc
	var preservedBits = stat.mode & 07000;
	var newBits = permissions.toNumber();
	fss.chmod(file, preservedBits | newBits);
};

function getUserId(user) {
	// TODO implement
	return -1;
}

function getGroupId(group) {
	// TODO implement
	return -1;
}

// Supports user name string as well as uid int input.
var changeOwner = exports.changeOwner = function(path, user) {
	var file = resolveFile(path);
	return fss.chown(file, typeof user === 'string' ? getUserId(user) : user, -1);
};

// Supports group name string as well as gid int input.
var changeGroup = exports.changeGroup = function(path, group) {
	return fss.chown(path, -1, typeof group === 'string' ? getGroupId(group)
			: group);
};

var optionsMask = {
	read: 1,
	write: 1,
	append: 1,
	update: 1,
	binary: 1,
	exclusive: 1,
	canonical: 1,
	charset: 1
};

/**
 * Internal.
 */
function checkOptions(options) {
	if(!options) {
		options = {};
	} else if(typeof options != 'object') {
		if(typeof options == 'string') {
			// if options is a mode string convert it to options object
			options = applyMode(options);
		} else {
			throw new Error('unsupported options argument');
		}
	} else {
		// run sanity check on user-provided options object
		for( var key in options) {
			if(!(key in optionsMask)) {
				throw new Error("unsupported option: " + key);
			}
			options[key] = key == 'charset' ? String(options[key])
					: Boolean(options[key]);
		}
	}
	return options;
}

/**
 * Internal. Convert a mode string to an options object.
 */
function applyMode(mode) {
	var options = {};
	for( var i = 0; i < mode.length; i++) {
		switch(mode[i]) {
		case 'r':
			options.read = true;
			break;
		case 'w':
			options.write = true;
			break;
		case 'a':
			options.append = true;
			break;
		case '+':
			options.update = true;
			break;
		case 'b':
			options.binary = true;
			break;
		case 'x':
			options.exclusive = true;
			break;
		case 'c':
			options.canonical = true;
			break;
		default:
			throw new Error("unsupported mode argument: " + options);
		}
	}
	return options;
}

// Path object

/**
 * A shorthand for creating a new `Path` without the `new` keyword.
 */
var path = exports.path = function() {
	return new Path(join.apply(null, arguments));
};

/**
 * Path constructor. Path is a chainable shorthand for working with paths.
 * 
 * @augments String
 */
var Path = exports.Path = function() {
	if(!(this instanceof Path)) {
		return new Path(join.apply(null, arguments));
	}
	var path = join.apply(null, arguments);
	this.toString = function() {
		return path;
	};
	return this;
};

/** @ignore */
Path.prototype = new String();

/**
 * This is a non-standard extension, not part of CommonJS Filesystem/A.
 */
Path.prototype.valueOf = function() {
	return this.toString();
};

/**
 * Join a list of paths to this path.
 */
Path.prototype.join = function() {
	return new Path(join.apply(null, [this.toString()].concat(Array
			.slice(arguments))));
};

/**
 * Resolve against this path.
 */
Path.prototype.resolve = function() {
	return new Path(resolve.apply(null, [this.toString()].concat(Array
			.slice(arguments))));
};

/**
 * Return the relative path from this path to the given target path. Equivalent
 * to `fs.Path(fs.relative(this, target))`.
 */
Path.prototype.to = function(target) {
	return exports.Path(relative(this.toString(), target));
};

/**
 * Return the relative path from the given source path to this path. Equivalent
 * to `fs.Path(fs.relative(source, this))`.
 */
Path.prototype.from = function(target) {
	return exports.Path(relative(target, this.toString()));
};

/**
 * Return the names of all files in this path, in lexically sorted order and
 * wrapped in Path objects.
 */
Path.prototype.listPaths = function() {
	return this.list().map(function(file) {
		return [new Path(this, file), this];
	});
};

var pathed = ['absolute', 'base', 'canonical', 'directory', 'normal',
		'relative'];

for( var i = 0; i < pathed.length; i++) {
	var name = pathed[i];
	Path.prototype[name] = (function(name) {
		return function() {
			return new Path(exports[name].apply(this, [this.toString()].concat(Array
					.slice(arguments))));
		};
	})(name);
}

var trivia = ['copy', 'copyTree', 'exists', 'extension', 'isDirectory',
		'isFile', 'isLink', 'isReadable', 'isWritable', 'iterate', 'iterateTree',
		'lastModified', 'link', 'list', 'listDirectoryTree', 'listTree',
		'makeDirectory', 'makeTree', 'move', 'open', 'read', 'remove',
		'removeTree', 'rename', 'size', 'split', 'symbolicLink', 'touch', 'write'];

for( var i = 0; i < trivia.length; i++) {
	var name = trivia[i];
	Path.prototype[name] = (function(name) {
		return function() {
			var fn = exports[name];
			if(!fn)
				throw new Error("Not found: " + name);
			var result = exports[name].apply(this, [this.toString()]
					.concat(Array.prototype.slice.call(arguments)));
			if(result === undefined)
				result = this;
			return result;
		};
	})(name);
}
