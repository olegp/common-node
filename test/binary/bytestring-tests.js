var assert = require("../../lib/assert");
var binary = require("../../lib/binary");
var Binary = binary.Binary;
var ByteString = binary.ByteString;
var ByteArray = binary.ByteArray;

exports.testConstructor = function() {
  var testArray = [1, 2, 3, 4];

  // ByteString()
  // Construct an empty byte string.
  var b1 = new ByteString();
  assert.ok(b1 instanceof Binary, "not instanceof Binary");
  assert.ok(b1 instanceof ByteString, "not instanceof ByteString");
  assert.strictEqual(0, b1.length);
  b1.length = 123;
  assert.strictEqual(0, b1.length);
  // ByteString(byteString)
  // Copies byteString.
  var b2 = new ByteString(new ByteString(testArray));
  assert.strictEqual(testArray.length, b2.length);
  b2.length = 123;
  assert.strictEqual(testArray.length, b2.length);
  assert.strictEqual(1, b2.get(0));
  assert.strictEqual(4, b2.get(3));

  // ByteString(byteArray)
  // Use the contents of byteArray.
  var b2 = new ByteString(new ByteArray(testArray));
  assert.strictEqual(testArray.length, b2.length);
  b2.length = 123;
  assert.strictEqual(testArray.length, b2.length);
  assert.strictEqual(1, b2.get(0)); // failing
  assert.strictEqual(4, b2.get(3));

  // ByteString(arrayOfNumbers)
  // Use the numbers in arrayOfNumbers as the bytes.
  var b3 = new ByteString(testArray);
  assert.strictEqual(testArray.length, b3.length);
  b3.length = 123;
  assert.strictEqual(testArray.length, b3.length);
  assert.strictEqual(1, b3.get(0));
  assert.strictEqual(4, b3.get(3));
};

// exports.testJoin = function() {
// }

exports.testToByteArray = function() {
  var b1 = new ByteString([1, 2, 3]), b2 = b1.toByteArray();

  assert.ok(b2 instanceof ByteArray, "not instanceof ByteArray");
  assert.strictEqual(b1.length, b2.length);
  assert.strictEqual(b1.get(0), b2.get(0));
  assert.strictEqual(b1.get(2), b2.get(2));
};

exports.testToByteString = function() {
  var b1 = new ByteString([1, 2, 3]), b2 = b1.toByteString();

  assert.strictEqual(b1.length, b2.length);
  assert.strictEqual(b1.get(0), b2.get(0));
  assert.strictEqual(b1.get(2), b2.get(2));
};

exports.testToArray = function() {
  var testArray = [0, 1, 254, 255], b1 = new ByteString(testArray);
  var a1 = b1.toArray();

  assert.strictEqual(testArray.length, a1.length);
  for (var i = 0; i < testArray.length; i++)
    assert.strictEqual(testArray[i], a1[i]);
};

exports.testToString = function() {
  // the format of the resulting string isn't specified, but it shouldn't be
  // the decoded string
  var testString = '', testArray = [];
  for (var i = 0; i < 128; i++) {
    testString += 'A';
    testArray.push(65);
  }

  var resultString = new ByteString(testArray).toString();

  assert.ok(resultString.length < 100);
  assert.ok(resultString !== testString);
};

exports.testIndexOf = function() {
  var b1 = new ByteString([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5]);

  assert.strictEqual(-1, b1.indexOf(-1));

  assert.strictEqual(0, b1.indexOf(0));
  assert.strictEqual(5, b1.indexOf(5));
  assert.strictEqual(-1, b1.indexOf(12));

  assert.strictEqual(6, b1.indexOf(0, 6));
  assert.strictEqual(11, b1.indexOf(5, 6));
  assert.strictEqual(-1, b1.indexOf(12, 6));

  assert.strictEqual(0, b1.indexOf(0, 0, 3));
  assert.strictEqual(-1, b1.indexOf(5, 0, 3));
  assert.strictEqual(-1, b1.indexOf(12, 0, 3));
};

exports.testLastIndexOf = function() {
  var b1 = new ByteString([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5]);

  assert.strictEqual(-1, b1.lastIndexOf(-1));

  assert.strictEqual(6, b1.lastIndexOf(0));
  assert.strictEqual(11, b1.lastIndexOf(5));
  assert.strictEqual(-1, b1.lastIndexOf(12));

  assert.strictEqual(0, b1.lastIndexOf(0, 0, 6));
  assert.strictEqual(5, b1.lastIndexOf(5, 0, 6));
  assert.strictEqual(-1, b1.lastIndexOf(12, 0, 6));

  assert.strictEqual(6, b1.lastIndexOf(0, 6, 9));
  assert.strictEqual(-1, b1.lastIndexOf(5, 6, 9));
  assert.strictEqual(-1, b1.lastIndexOf(12, 6, 9));
};

exports.testCharCodeAt = function() {
  var b1 = new ByteString([0, 1, 2, 3, 4, 255]);

  assert.ok(isNaN(b1.charCodeAt(-1)));
  assert.strictEqual(0, b1.charCodeAt(0));
  assert.strictEqual(255, b1.charCodeAt(5));
  assert.ok(isNaN(b1.charCodeAt(6)));
};

// identical to charCodeAt, test anyway?
exports.testGet = function() {
  var b1 = new ByteString([0, 1, 2, 3, 4, 255]);

  assert.ok(isNaN(b1.get(-1)));
  assert.strictEqual(0, b1.get(0));
  assert.strictEqual(255, b1.get(5));
  assert.ok(isNaN(b1.get(6)));
};

exports.testByteAt = function() {
  var b1 = new ByteString([0, 1, 2, 3, 4, 255]), b2;
  b2 = b1.byteAt(-1);
  assert.strictEqual(0, b2.length);
  b2 = b1.byteAt(0);
  assert.strictEqual(1, b2.length);
  assert.strictEqual(0, b2.get(0));
  b2 = b1.byteAt(5);
  assert.strictEqual(1, b2.length);
  assert.strictEqual(255, b2.get(0));
  b2 = b1.byteAt(6);
  assert.strictEqual(0, b2.length);
};

// identical to byteAt, test anyway?
exports.testCharAt = function() {
  var b1 = new ByteString([0, 1, 2, 3, 4, 255]), b2;

  b2 = b1.charAt(-1);
  assert.strictEqual(0, b2.length);
  b2 = b1.charAt(0);
  assert.strictEqual(1, b2.length);
  assert.strictEqual(0, b2.get(0));
  b2 = b1.charAt(5);
  assert.strictEqual(1, b2.length);
  assert.strictEqual(255, b2.get(0));
  b2 = b1.charAt(6);
  assert.strictEqual(0, b2.length);
};

exports.testSplit = function() {
  var b1 = new ByteString([0, 1, 2, 3, 4, 5]), a1;

  a1 = b1.split([]);
  assert.strictEqual(1, a1.length);
  assert.ok(a1[0] instanceof ByteString);
  assert.strictEqual(6, a1[0].length);
  assert.strictEqual(0, a1[0].get(0));
  assert.strictEqual(5, a1[0].get(5));

  a1 = b1.split([2]);
  assert.strictEqual(2, a1.length);
  assert.ok(a1[0] instanceof ByteString);
  assert.strictEqual(2, a1[0].length);
  assert.strictEqual(0, a1[0].get(0));
  assert.strictEqual(1, a1[0].get(1));
  assert.strictEqual(3, a1[1].length);
  assert.strictEqual(3, a1[1].get(0));
  assert.strictEqual(5, a1[1].get(2));

  a1 = b1.split([2], {
    includeDelimiter:true
  });
  assert.strictEqual(3, a1.length);
  assert.ok(a1[0] instanceof ByteString);
  assert.strictEqual(2, a1[0].length);
  assert.strictEqual(0, a1[0].get(0));
  assert.strictEqual(1, a1[0].get(1));
  assert.strictEqual(1, a1[1].length);
  assert.strictEqual(2, a1[1].get(0));
  assert.strictEqual(3, a1[2].length);
  assert.strictEqual(3, a1[2].get(0));
  assert.strictEqual(5, a1[2].get(2));

  a1 = b1.split(new ByteString([2, 3]));
  assert.strictEqual(2, a1.length);
  assert.ok(a1[0] instanceof ByteString);
  assert.strictEqual(2, a1[0].length);
  assert.strictEqual(0, a1[0].get(0));
  assert.strictEqual(1, a1[0].get(1));
  assert.strictEqual(2, a1[1].length);
  assert.strictEqual(4, a1[1].get(0));
  assert.strictEqual(5, a1[1].get(1));
};

exports.testConcat = function() {
  var a = [];
  var b = new ByteString();

  var a1 = [1, 2, 3];
  var b1 = b.concat(new ByteString(a1));
  a1 = a.concat(a1);
  assert.strictEqual(a1.length, b1.length);
  assert.deepEqual(a1, b1.toArray());

  var a2 = [4, 5, 6];
  var b2 = b1.concat(new ByteString(a2));
  a2 = a1.concat(a2);
  assert.strictEqual(a2.length, b2.length);
  assert.deepEqual(a2, b2.toArray());

  var a3 = a2.concat(a, a1, a2, [], []);
  var b3 = b2.concat(b, b1, b2, new ByteString(), new ByteArray());
  assert.strictEqual(a3.length, b3.length);
  assert.deepEqual(a3, b3.toArray());
};

exports.testSlice = function() {
  var b1 = new ByteString([0, 1, 2, 3, 4, 5]), b2;

  b2 = b1.slice();
  assert.strictEqual(6, b2.length);
  assert.strictEqual(0, b2.get(0));
  assert.strictEqual(5, b2.get(5));

  b2 = b1.slice(0);
  assert.strictEqual(6, b2.length);
  assert.strictEqual(0, b2.get(0));
  assert.strictEqual(5, b2.get(5));

  b2 = b1.slice(1, 4);
  assert.strictEqual(3, b2.length);
  assert.strictEqual(1, b2.get(0));
  assert.strictEqual(3, b2.get(2));

  b2 = b1.slice(0, -1);
  assert.strictEqual(5, b2.length);
  assert.strictEqual(0, b2.get(0));
  assert.strictEqual(4, b2.get(4));

  b2 = b1.slice(-3, -1);

  assert.strictEqual(2, b2.length);
  assert.strictEqual(3, b2.get(0));
  assert.strictEqual(4, b2.get(1));

  b2 = b1.slice(9, 10);
  assert.strictEqual(0, b2.length);
};

exports.testNewless = function() {
  assert.strictEqual(1, ByteString([0]).length);
  // assert.strictEqual(2, ByteString([0, 1], 0, 2).length);
};

if (require.main === module) {
  require("../../lib/test").run(exports);
}