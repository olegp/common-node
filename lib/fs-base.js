/**
 * @fileoverview File and path related functionality as
 * defined in <a href="http://wiki.commonjs.org/wiki/Filesystem/A">CommonJS
 * Filesystem/A</a> .
 */
require('fibers');
var p = require('path');
var fs = require('fs');

var io = require('./io');
var Stream = io.Stream, 
    TextStream = io.TextStream;
var binary = require('./binary');
var Binary = binary.Binary;

var SEPARATOR = '/';
var SEPARATOR_RE = new RegExp(SEPARATOR);

/*
export('absolute',
        'base',
        'copy',
        'copyTree',
*        'directory',
*        'extension',
        'join',
        'makeTree',
        'listDirectoryTree',
        'listTree',
        'normal',
*        'open',
*        'path',
*        'Path',
*        'read',
*        'relative',
*        'removeTree',
*        'resolve',
*        'write',
*        'split',
        
        // fs-base
*        'canonical',
*        'changeWorkingDirectory',
*        'workingDirectory',
*        'exists',
?        'isDirectory',
?        'isFile',
-        'isReadable',
-        'isWritable',
        'list',
-        'makeDirectory',
-        'move',
-        'lastModified',
*        'openRaw',
-        'remove',
-        'removeDirectory',
-        'size',
x        'touch',

-        'symbolicLink',
-        'hardLink',
-        'readLink',

-        'isLink',
-        'same',
-        'sameFilesystem',

-        'iterate',
         
        
-        'Permissions',
-        'owner',
-        'group',
-        'changePermissions',
-        'changeOwner',
-        'changeGroup',
-        'permissions');
*/

function resolveFile(path) {
  if (path == undefined) {
      throw new Error('undefined path argument');
  }
  return absolute(path);
}

/**
 * Open an IO stream for reading/writing to the file corresponding to the given
 * path.
 */
var open = exports.open = function (path, options) {
  options = checkOptions(options);
  var file = resolveFile(path);
  //var {read, write, append, update, binary, charset} = options;
  var read = options.read;
  if (!options.read && !options.write && !options.append && !options.update) {
    read = true;
  }
  var stream = new Stream(read ?
    fs.createReadStream(file) : fs.createWriteStream(file, Boolean(options.append)));
  if (options.binary) {
    return stream;
  } else if (read || options.write || options.append) {
    return new TextStream(stream, {charset: options.charset});
  } else if (exports.update) {
    throw new Error("update not yet implemented");
  }
}

var openRaw = exports.openRaw = function (path, mode, permissions) {
  // TODO many things missing here
  var file = resolveFile(path);
  mode = mode || {};
  var read =  mode.read;
  if (!mode.read && !mode.write && !mode.append) {
    read = true;
  }
  if (read) {
    return new Stream(fs.createReadStream(file));
  } else {
    return new Stream(fs.createWriteStream(file, Boolean(mode.append)));
  }
}


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
}

/**
 * Open, write, flush, and close a file, writing the given content. If
 * content is a binary.ByteArray or binary.ByteString, binary mode is implied.
 */
var write = exports.write = function (path, content, options) {
    options = options === undefined ? {} : checkOptions(options)
    options.write = true
    options.binary = content instanceof Binary;
    var stream = open(path, options);
    
    try {
      stream.write(content);
      stream.flush();
    } finally {
      stream.close();
    }
}

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
}

/**
 * Copy files from a source path to a target path. Files of the below the
 * source path are copied to the corresponding locations relative to the target
 * path, symbolic links to directories are copied but not traversed into.
 */
function copyTree(from, to) {
    var source = resolveFile(from).getCanonicalFile();
    var target = resolveFile(to).getCanonicalFile();
    if (String(target) == String(source)) {
        throw new Error("Source and target files are equal in copyTree.");
    } else if (String(target).indexOf(String(source) + SEPARATOR) == 0) {
        throw new Error("Target is a child of source in copyTree");
    }
    if (source.isDirectory()) {
        makeTree(target);
        var files = source.list();
        for (var file in files) {
            var s = join(source, file);
            var t = join(target, file);
            if (isLink(s)) {
                symbolicLink(readLink(s), t);
            } else {
                copyTree(s, t);
            }
        }
    } else {
        copy(source, target);
    }
}

/**
 * Create the directory specified by "path" including any missing parent
 * directories.
 */
function makeTree(path) {
    var file = resolveFile(path);
    if (!file.isDirectory() && !file.mkdirs()) {
        throw new Error("failed to make tree " + path);
    }
}

/**
 * Return an array with all directories below (and including) the given path,
 * as discovered by depth-first traversal. Entries are in lexically sorted
 * order within directories. Symbolic links to directories are not traversed
 * into.
 */
function listDirectoryTree(path) {
    path = path === '' ? '.' : String(path);
    var result = [''];
    list(path).forEach(function (child) {
        var childPath = join(path, child);
        if (isDirectory(childPath)) {
            if (!isLink(childPath)) {
                result.push.apply(result,
                        listDirectoryTree(childPath).map(function (p) { return join(child, p); } ));
            } else { // Don't follow symlinks.
                result.push(child);
            }
        }
    });
    return result;
}

/**
 * Return an array with all paths (files, directories, etc.) below (and
 * including) the given path, as discovered by depth-first traversal. Entries
 * are in lexically sorted order within directories. Symbolic links to
 * directories are returned but not traversed into.
 */
function listTree(path) {
    path = path === '' ? '.' : String(path);
    var result = [''];
    list(path).forEach(function (child) {
        var childPath = join(path, child);
        // Don't follow directory symlinks, but include them
        if (isDirectory(childPath) && !isLink(childPath)) {
            result.push.apply(result,
                    listTree(childPath).map(function (p) { return join(child, p); } ));
        } else {
            // Add file or symlinked directory.
            result.push(child);
        }
    });
    return result;
}

function sync(method) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var fiber = Fiber.current;
    args.push(function(err, result) {
      fiber.run(err || result);
    });
    method.apply(null, args);
    var result = yield();
    if(result instanceof Error) throw result;
    return result;
  }
}

var fss = {};
var methods = ['lstat', 'readdir', 'rmdir', 'unlink'];
for(var i = 0; i < methods.length; i ++) {
  var name = methods[i];
  fss[name] = sync(fs[name]);
}

/**
 * Remove the element pointed to by the given path. If path points to a
 * directory, all members of the directory are removed recursively.
 */
var removeTree = exports.removeTree = function (path) {
  var stats = fss.lstat(path);
  if (stats.isDirectory() && !stats.isSymbolicLink()) {
    var files = fss.readdir(path);
    for (var i = 0; i < files.length; i ++ ) {
      removeTree(join(path, files[i]));
    }
  }
  //fss[stats.isDirectory() ? 'rmdir' : 'unlink'](path);
}

/**
 * Make the given path absolute by resolving it against the current working
 * directory.
 */
var absolute = exports.absolute = function(path) {
    return p.resolve(process.cwd(), path);
}

/**
 * Return the basename of the given path. That is the path with any leading
 * directory components removed. If specified, also remove a trailing
 * extension.
 */
var base = exports.base = function(path, ext) {
  return p.basename(path, ext);
}

/**
 * Return the dirname of the given path. That is the path with any trailing
 * non-directory component removed.
 */
var directory = exports.directory = function(path) {
  return p.dirname(path);
}

/**
 * Return the extension of a given path. That is everything after the last dot
 * in the basename of the given path, including the last dot. Returns an empty
 * string if no valid extension exists.
 */
var extension = exports.extension = function(path) {
  return p.extname(path);
}

/**
 * Join a list of paths using the local file system's path separator.
 * The result is not normalized, so `join("..", "foo")` returns `"../foo"`.
 * @see http://wiki.commonjs.org/wiki/Filesystem/Join
 *
 */
var join = exports.join = function() {
  // filter out empty strings to avoid join("", "foo") -> "/foo"
  var args = Array.prototype.slice.call(arguments);
  args = args.filter(function(p) { return p != ""; } )
  return args.join(SEPARATOR);
}

/**
 * Split a given path into an array of path components.
 */
var split = exports.split = function(path) {
  if (!path) {
    return [];
  }
  return String(path).split(SEPARATOR_RE);
}

/**
 * Normalize a path by removing '.' and simplifying '..' components, wherever
 * possible.
 */
var normal = exports.normal = function(path) {
    return p.normalize(path);
}

/**
 * Join a list of paths by starting at an empty location and iteratively
 * "walking" to each path given. Correctly takes into account both relative and
 * absolute paths.
 */
var resolve = exports.resolve = function () {
  return p.resolve.apply(null, arguments);
}

// Adapted from narwhal.
/**
 * Establish the relative path that links source to target by strictly
 * traversing up ('..') to find a common ancestor of both paths. If the target
 * is omitted, returns the path to the source from the current working
 * directory.
 */
var relative = exports.relative = function(source, target) {
    if (!target) {
        target = source;
        source = workingDirectory();
    }
    source = absolute(source);
    target = absolute(target);
    source = source.split(SEPARATOR_RE);
    target = target.split(SEPARATOR_RE);
    source.pop();
    while (
            source.length &&
                    target.length &&
                    target[0] == source[0]) {
        source.shift();
        target.shift();
    }
    while (source.length) {
        source.shift();
        target.unshift("..");
    }
    return target.join(SEPARATOR);
}

/**
 * Move a file from `source` to `target`.
 * @param {string} source the source path
 * @param {string} target the target path
 * @throws Error
 */
function move(source, target) {
    var from = resolveFile(source);
    var to = resolveFile(target);
    if (!from.renameTo(to)) {
        throw new Error("Failed to move file from " + source + " to " + target);
    }
}

/**
 * Remove a file at the given `path`. Throws an error if `path` is not a file
 * or a symbolic link to a file.
 * @param {string} path the path of the file to remove.
 * @throws Error if path is not a file or could not be removed.
 */
function remove(path) {
    var file = resolveFile(path);
    if (!file.isFile()) {
        throw new Error(path + " is not a file");
    }
    if (!file['delete']()) {
        throw new Error("failed to remove file " + path);
    }
}

/**
 * Return true if the file denoted by `path` exists, false otherwise.
 * @param {string} path the file path.
 */
var exists = exports.exists = function (path) {
  var fiber = Fiber.current;
  p.exists(path, function (e) {
    fiber.run(e);
  });
  return yield();
}

/**
 * Return the path name of the current working directory.
 * @returns {string} the current working directory
 */
var workingDirectory = exports.workingDirectory = function() {
  return process.cwd() + SEPARATOR;
}

/**
 * Set the current working directory to `path`.
 * @param {string} path the new working directory
 */
var changeWorkingDirectory = exports.changeWorkingDirectory = function (path) {
  process.chdir(path);
}

/**
 * Remove a file or directory identified by `path`. Throws an error if
 * `path` is a directory and not empty.
 * @param path the directory path
 * @throws Error if the file or directory could not be removed.
 */
function removeDirectory(path) {
    var file = resolveFile(path);
    if (!file['delete']()) {
        throw new Error("failed to remove directory " + path);
    }
}

/**
 * Returns an array with all the names of files contained in the direcory `path`.
 * @param {string} path the directory path
 * @returns {Array} a list of file names
 */
function list(path) {
    var file = resolveFile(path);
    var list = file.list();
    if (list == null) {
        throw new Error("failed to list directory " + path);
    }
    var result = [];
    for (var i = 0; i < list.length; i++) {
        result[i] = list[i];
    }
    return result;
}

/**
 * Returns the size of a file in bytes, or throws an exception if the path does
 * not correspond to an accessible path, or is not a regular file or a link.
 * @param {string} path the file path
 * @returns {number} the file size in bytes
 * @throws Error if path is not a file
 */
function size(path) {
    var file = resolveFile(path);
    if (!file.isFile()) {
        throw new Error(path + " is not a file");
    }
    return file.length();
}

/**
 * Returns the time a file was last modified as a Date object.
 * @param {string} path the file path
 * @returns the date the file was last modified
 */
function lastModified(path) {
    var file = resolveFile(path);
    return new Date(file.lastModified());
}

/**
 * Create a single directory specified by `path`. If the directory cannot be
 * created for any reason an error is thrown. This includes if the parent
 * directories of `path` are not present. If a `permissions` argument is passed
 * to this function it is used to create a Permissions instance which is
 * applied to the given path during directory creation.
 * @param {string} path the file path
 * @param {number|object} permissions optional permissions
 */
function makeDirectory(path, permissions) {
    if (security) security.checkWrite(path);
    permissions = permissions != null ?
            new Permissions(permissions) : Permissions["default"];
    var POSIX = getPOSIX();
    if (POSIX.mkdir(path, permissions.toNumber()) != 0) {
        throw new Error("failed to make directory " + path);
    }
}

/**
 * Returns true if the file specified by path exists and can be opened for reading.
 * @param {string} path the file path
 * @returns {boolean} whether the file exists and is readable
 */
var isReadable = exports.isReadable = function(path) {
    //return resolveFile(path).canRead();
}

/**
 * Returns true if the file specified by path exists and can be opened for writing.
 * @param {string} path the file path
 * @returns {boolean} whether the file exists and is writable
 */
var isWritable = exports.isWritable = function(path) {
    //return resolveFile(path).canWrite();
}

/**
 * Returns true if the file specified by path exists and is a regular file.
 * @param {string} path the file path
 * @returns {boolean} whether the file exists and is a file
 */
var isFile = exports.isFile = function(path) {
    //return resolveFile(path).isFile();
}

/**
 * Returns true if the file specified by path exists and is a directory.
 * @param {string} path the file path
 * @returns {boolean} whether the file exists and is a directory
 */
var isDirectory = exports.isDirectory = function(path) {
    //return resolveFile(path).isDirectory();
}

/**
 * Return true if target file is a symbolic link, false otherwise.
 * @param {string} path the file path
 * @returns true if the given file exists and is a symbolic link
 */
function isLink(path) {
    if (security) security.checkRead(path);
    try {
        var POSIX = getPOSIX();
        var stat = POSIX.lstat(path);
        return stat.isSymlink();
    } catch (error) {
        // fallback if POSIX is no available
        path = resolveFile(path);
        var parent = path.getParentFile();
        if (!parent) return false;
        parent = parent.getCanonicalFile();
        path = new File(parent, path.getName());
        return !path.equals(path.getCanonicalFile())
    }
}

/**
 * Returns whether two paths refer to the same storage (file or directory),
 * either by virtue of symbolic or hard links, such that modifying one would
 * modify the other.
 * @param {string} pathA the first path
 * @param {string} pathB the second path
 */
function same(pathA, pathB) {
    if (security) {
        security.checkRead(pathA);
        security.checkRead(pathB);
    }
    // make canonical to resolve symbolic links
    pathA = canonical(pathA);
    pathB = canonical(pathB);
    // check inode to test hard links
    var POSIX = getPOSIX();
    var stat1 = POSIX.stat(pathA);
    var stat2 = POSIX.stat(pathB);
    return stat1.isIdentical(stat2);
}

/**
 * Returns whether two paths refer to an entity of the same file system.
 * @param {string} pathA the first path
 * @param {string} pathB the second path
 */
function sameFilesystem(pathA, pathB) {
    if (security) {
        security.checkRead(pathA);
        security.checkRead(pathB);
    }
    // make canonical to resolve symbolic links
    pathA = canonical(pathA);
    pathB = canonical(pathB);
    var POSIX = getPOSIX();
    var stat1 = POSIX.stat(pathA);
    var stat2 = POSIX.stat(pathB);
    return stat1.dev() == stat2.dev();
}

/**
 * Returns the canonical path to a given abstract path. Canonical paths are both
 * absolute and intrinsic, such that all paths that refer to a given file
 * (whether it exists or not) have the same corresponding canonical path.
 * @param {string} path a file path
 * @returns the canonical path
 */
var canonical = exports.canonical = function(path) {
    return resolveFile(path);
}

/**
 * Sets the modification time of a file or directory at a given path to a
 * specified time, or the current time. Creates an empty file at the given path
 * if no file or directory exists, using the default permissions.
 * @param {string} path the file path
 * @param {Date} mtime optional date
 */
var touch = exports.touch = function(path, mtime) {
  mtime = mtime || Date.now();
  //resolveFile(path) ...
  throw new Error("Not yet implemented, will be in Node 0.5");
}

/**
 * Creates a symbolic link at the target path that refers to the source path.
 * @param {string} source the source file
 * @param {string} target the target link
 */
var symbolicLink = exports.symbolicLink = function(source, target) {
    if (security) {
        security.checkRead(source);
        security.checkWrite(target);
    }
    var POSIX = getPOSIX();
    return POSIX.symlink(source, target);
}

/**
 * Creates a hard link at the target path that refers to the source path.
 * @param {string} source the source file
 * @param {string} target the target file
 */
var hardLink = exports.hardLink = function(source, target) {
    if (security) {
        security.checkRead(source);
        security.checkWrite(target);
    }
    var POSIX = getPOSIX();
    return POSIX.link(source, target);
}

/**
 * Returns the immediate target of the symbolic link at the given `path`.
 * @param {string} path a file path
 */
var readLink = exports.readLink = function(path) {
    if (security) security.checkRead(path);
    var POSIX = getPOSIX();
    return POSIX.readlink(path);
}

/**
 * Returns a generator that produces the file names of a directory.
 * @param {string} path a directory path
 */
function iterate(path) {
    var iter = function() {
        for (var item in list(path)) {
            //yield item;
        }
        throw StopIteration;
    }();
    // spec requires iterator(), native iterators/generators only have __iterator__().
    iter.iterator = iter.__iterator__;
    return iter;
}

/**
 * The Permissions class describes the permissions associated with a file.
 * @param {number|object} permissions a number or object representing the permissions.
 * @param constructor
 */
function Permissions(permissions, constructor) {
    if (!(this instanceof Permissions)) {
        return new Permissions(permissions, constructor);
    }
    this.update(Permissions['default']);
    this.update(permissions);
    /** @ignore */
    this.constructor = constructor;
}

Permissions.prototype.update = function(permissions) {
    var fromNumber = typeof permissions == 'number';
    if (!fromNumber && !(permissions instanceof Object)) {
        return;
    }
    for (var user in ['owner', 'group', 'other']) {
        this[user] = this[user] || {};
        for (var perm in ['read', 'write', 'execute']) {
            this[user][perm] = fromNumber ?
                    Boolean((permissions <<= 1) & 512) :
                    Boolean(permissions[user] && permissions[user][perm]);
        }
    }
};

Permissions.prototype.toNumber = function() {
    var result = 0;
    for (var user in ['owner', 'group', 'other']) {
        for (var perm in ['read', 'write', 'execute']) {
            result <<= 1;
            result |= +this[user][perm];
        }
    }
    return result;
};

if (!Permissions['default']) {
    try {
        var POSIX = getPOSIX();
        // FIXME: no way to get umask without setting it?
        var umask = POSIX.umask(0022);
        if (umask != 0022) {
            POSIX.umask(umask);
        }
        Permissions['default'] = new Permissions(~umask & 0777);
    } catch (error) {
        Permissions['default'] = new Permissions(0755);
    }
}

function permissions(path) {
    if (security) security.checkRead(path);
    var POSIX = getPOSIX();
    var stat = POSIX.stat(path);
    return new Permissions(stat.mode() & 0777);
}

function owner(path) {
    if (security) security.checkRead(path);
    try {
        var POSIX = getPOSIX();
        var uid = POSIX.stat(path).uid();
        var owner = POSIX.getpwuid(uid);
        return owner ? owner.pw_name : uid;
    } catch (error) {
        return null;
    }
}

function group(path) {
    if (security) security.checkRead(path);
    try {
        var POSIX = getPOSIX();
        var gid = POSIX.stat(path).gid();
        var group = POSIX.getgrgid(gid);
        return group ? group.gr_name : gid;
    } catch (error) {
        return null;
    }
}

function changePermissions(path, permissions) {
    if (security) security.checkWrite(path);
    permissions = new Permissions(permissions);
    var POSIX = getPOSIX();
    var stat = POSIX.stat(path);
    // do not overwrite set-UID bits etc
    var preservedBits = stat.mode() & 07000;
    var newBits = permissions.toNumber();
    POSIX.chmod(path, preservedBits | newBits);
}

// Supports user name string as well as uid int input.
function changeOwner(path, user) {
    if (security) security.checkWrite(path);
    var POSIX = getPOSIX();
    return POSIX.chown(path, typeof user === 'string' ?
            POSIX.getpwnam(user).pw_uid : user, -1);
}

// Supports group name string as well as gid int input.
function changeGroup(path, group) {
    if (security) security.checkWrite(path);
    var POSIX = getPOSIX();
    return POSIX.chown(path, -1, typeof group === 'string' ?
            POSIX.getgrnam(group).gr_gid : group);
}

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
    if (!options) {
        options = {};
    } else if (typeof options != 'object') {
        if (typeof options == 'string') {
            // if options is a mode string convert it to options object
            options = applyMode(options);
        } else {
            throw new Error('unsupported options argument');
        }
    } else {
        // run sanity check on user-provided options object
        for (var key in options) {
            if (!(key in optionsMask)) {
                throw new Error("unsupported option: " + key);
            }
            options[key] = key == 'charset' ?
                    String(options[key]) : Boolean(options[key]);
        }
    }
    return options;
}

/**
 * Internal. Convert a mode string to an options object.
 */
function applyMode(mode) {
    var options = {};
    for (var i = 0; i < mode.length; i++) {
        switch (mode[i]) {
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
}

/**
 * Path constructor. Path is a chainable shorthand for working with paths.
 * @augments String
 */
function Path() {
    if (!(this instanceof Path)) {
        return new Path(join.apply(null, arguments));
    }
    var path = join.apply(null, arguments)
    this.toString = function() { return path; }
    return this;
}

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
    return new Path(join.apply(null,
            [this.toString()].concat(Array.slice(arguments))));
};

/**
 * Resolve against this path.
 */
Path.prototype.resolve = function () {
    return new Path(resolve.apply(
            null,
            [this.toString()].concat(Array.slice(arguments))
    )
    );
};

/**
 * Return the relative path from this path to the given target path. Equivalent
 * to `fs.Path(fs.relative(this, target))`.
 */
Path.prototype.to = function (target) {
    return exports.Path(relative(this.toString(), target));
};

/**
 * Return the relative path from the given source path to this path. Equivalent
 * to `fs.Path(fs.relative(source, this))`.
 */
Path.prototype.from = function (target) {
    return exports.Path(relative(target, this.toString()));
};

/**
 * Return the names of all files in this path, in lexically sorted order and
 * wrapped in Path objects.
 */
Path.prototype.listPaths = function() {
    return this.list().map(function (file) { return [ new Path(this, file), this]; } );
};

var pathed = [
    'absolute',
    'base',
    'canonical',
    'directory',
    'normal',
    'relative'
];

for (var i = 0; i < pathed.length; i++) {
    var name = pathed[i];
    Path.prototype[name] = (function (name) {
        return function () {
            return new Path(exports[name].apply(
                    this,
                    [this.toString()].concat(Array.slice(arguments))
            ));
        };
    })(name);
}

var trivia = [
    'copy',
    'copyTree',
    'exists',
    'extension',
    'isDirectory',
    'isFile',
    'isLink',
    'isReadable',
    'isWritable',
    'iterate',
    'iterateTree',
    'lastModified',
    'link',
    'list',
    'listDirectoryTree',
    'listTree',
    'makeDirectory',
    'makeTree',
    'move',
    'open',
    'read',
    'remove',
    'removeTree',
    'rename',
    'size',
    'split',
    'symbolicLink',
    'touch',
    'write'
];

for (i = 0; i < trivia.length; i++) {
    var name = trivia[i];
    Path.prototype[name] = (function (name) {
        return function () {
            var fn = exports[name];
            if (!fn) throw new Error("Not found: " + name);
            var result = exports[name].apply(
                    this,
                    [this.toString()].concat(Array.prototype.slice.call(arguments))
            );
            if (result === undefined)
                result = this;
            return result;
        };
    })(name);
}
