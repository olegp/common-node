var assert = require("../../lib/assert");
var binary = require("../../lib/binary");
var Binary = binary.Binary;
var ByteString = binary.ByteString;
var ByteArray = binary.ByteArray;

exports.testConstructor = function() {
  var testArray = [1, 2, 3, 4], b;

  // ByteArray()
  // New, empty ByteArray.
  b = new ByteArray();
  // assert.isTrue(b instanceof Binary, "not instanceof Binary");
  assert.ok(b instanceof ByteArray, "not instanceof ByteArray");
  assert.strictEqual(0, b.length);
  b.length = 123;
  assert.strictEqual(123, b.length);
  assert.strictEqual(0, b.get(4));

  // ByteArray(length)
  // New ByteArray filled with length zero bytes.
  b = new ByteArray(10);
  assert.strictEqual(10, b.length);
  for (var i = 0; i < 10; i++)
    assert.strictEqual(0, b.get(i));
  assert.ok(isNaN(b.get(10)));
  b.length = 234;
  assert.strictEqual(234, b.length);
  assert.strictEqual(0, b.get(10));
  assert.strictEqual(0, b.get(233));
  assert.ok(isNaN(b.get(234)));

  // ByteArray(byteString)
  // Copy contents of byteString.
  b = new ByteArray(new ByteString(testArray));
  assert.strictEqual(testArray.length, b.length);
  b.length = 345;
  assert.strictEqual(345, b.length);
  assert.strictEqual(1, b.get(0));
  assert.strictEqual(4, b.get(3));
  assert.strictEqual(0, b.get(4));

  // ByteArray(byteArray)
  // Copy byteArray.
  b = new ByteArray(new ByteArray(testArray));
  assert.strictEqual(testArray.length, b.length);
  b.length = 456;
  assert.strictEqual(456, b.length);
  assert.strictEqual(1, b.get(0));
  assert.strictEqual(4, b.get(3));
  assert.strictEqual(0, b.get(4));

  // ByteArray(arrayOfBytes)
  // Use numbers in arrayOfBytes as contents.
  b = new ByteArray(testArray);
  assert.strictEqual(testArray.length, b.length);
  b.length = 567;
  assert.strictEqual(567, b.length);
  assert.strictEqual(1, b.get(0));
  assert.strictEqual(4, b.get(3));
  assert.strictEqual(0, b.get(4));
};

exports.testResizing = function() {
  var b1 = new ByteArray([0, 1, 2, 3, 4, 5, 6]);
  assert.strictEqual(7, b1.length);
  assert.ok(isNaN(b1.get(7)));

  b1.length = 10;
  assert.strictEqual(10, b1.length, "Length should change to 10");
  assert.strictEqual(5, b1.get(5));
  assert.strictEqual(0, b1.get(7));

  b1.length = 3;
  assert.strictEqual(3, b1.length, "Length should change to 3");
  assert.strictEqual(0, b1.get(0));
  assert.ok(isNaN(b1.get(3)));

  b1.length = 9;
  assert.strictEqual(9, b1.length, "Length should change to 9");
  assert.strictEqual(0, b1.get(0));
  assert.strictEqual(0, b1.get(4));
};

exports.testToByteArray = function() {
  var b1 = new ByteArray([1, 2, 3]), b2 = b1.toByteArray();

  assert.ok(b2 instanceof ByteArray, "not instanceof ByteArray");
  assert.strictEqual(b1.length, b2.length);
  assert.strictEqual(b1.get(0), b2.get(0));
  assert.strictEqual(b1.get(2), b2.get(2));

  assert.strictEqual(1, b1.get(0));
  assert.strictEqual(1, b2.get(0));

  b1.set(0, 10);

  assert.strictEqual(10, b1.get(0));
  assert.strictEqual(1, b2.get(0));
};

exports.testToByteString = function() {
  var b1 = new ByteArray([1, 2, 3]), b2 = b1.toByteString();

  assert.strictEqual(b1.length, b2.length);
  assert.strictEqual(b1.get(0), b2.get(0));
  assert.strictEqual(b1.get(2), b2.get(2));

  assert.strictEqual(1, b1.get(0));
  assert.strictEqual(1, b2.get(0));

  b1.set(0, 10);

  assert.strictEqual(10, b1.get(0));
  assert.strictEqual(1, b2.get(0));
};

exports.testToArray = function() {
  var testArray = [0, 1, 254, 255], b1 = new ByteArray(testArray), a1 = b1
    .toArray();

  assert.strictEqual(testArray.length, a1.length);
  for (var i = 0; i < testArray.length; i++)
    assert.strictEqual(testArray[i], a1[i]);
};

exports.testToString = function() {
  // the format of the resulting string isn't specified, but it shouldn't be the
  // decoded string
  var testString = '', testArray = [];
  for (var i = 0; i < 128; i++) {
    testString += 'A';
    testArray.push(65);
  }

  var resultString = new ByteArray(testArray).toString();

  assert.ok(resultString.length < 100);
  assert.ok(resultString !== testString);
};

exports.testIndexOf = function() {
  var b1 = new ByteArray([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5]);

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
  var b1 = new ByteArray([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5]);

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

exports.testReverse = function() {
  var testArray = [0, 1, 2, 3, 4, 5, 6];

  var b1 = new ByteArray(testArray), b2 = b1.reverse();

  assert.strictEqual(b1, b2);
  assert.strictEqual(b1.length, b2.length);
  for (var i = 0; i < testArray.length; i++)
    assert.strictEqual(testArray[i], b2.get(testArray.length - i - 1));

  testArray = [0, 1, 2, 3, 4, 5, 6, 7];

  b1 = new ByteArray(testArray);
  b2 = b1.reverse();

  assert.strictEqual(b1, b2);
  assert.strictEqual(b1.length, b2.length);
  for (var i = 0; i < testArray.length; i++)
    assert.strictEqual(testArray[i], b2.get(testArray.length - i - 1));
};

exports.testSort = function() {
  var testArray = [];
  for (var i = 0; i < 1000; i++)
    testArray.push(Math.floor(Math.random() * 256));

  var a = new ByteArray(testArray);
  a.sort();

  for (var i = 1; i < a.length; i++)
    assert.ok(a.get(i - 1) <= a.get(i), "index=" + i + "(" + a.get(i - 1) + ","
      + a.get(i) + ")");
};

exports.testSortCustom = function() {
  var testArray = [];
  for (var i = 0; i < 1000; i++)
    testArray.push(Math.floor(Math.random() * 256));

  var a = new ByteArray(testArray);
  a.sort(function(o1, o2) {
    return o2 - o1;
  });

  for (var i = 1; i < a.length; i++)
    assert.ok(a.get(i - 1) >= a.get(i), "index=" + i + "(" + a.get(i - 1) + ","
      + a.get(i) + ")");
};

exports.testSplit = function() {
  var b1 = new ByteArray([0, 1, 2, 3, 4, 5]), a1;

  a1 = b1.split([]);
  assert.strictEqual(1, a1.length);
  assert.ok(a1[0] instanceof ByteArray);
  assert.strictEqual(6, a1[0].length);
  assert.strictEqual(0, a1[0].get(0));
  assert.strictEqual(5, a1[0].get(5));

  a1 = b1.split([2]);
  assert.strictEqual(2, a1.length);
  assert.ok(a1[0] instanceof ByteArray);
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
  assert.ok(a1[0] instanceof ByteArray);
  assert.strictEqual(2, a1[0].length);
  assert.strictEqual(0, a1[0].get(0));
  assert.strictEqual(1, a1[0].get(1));
  assert.strictEqual(1, a1[1].length);
  assert.strictEqual(2, a1[1].get(0));
  assert.strictEqual(3, a1[2].length);
  assert.strictEqual(3, a1[2].get(0));
  assert.strictEqual(5, a1[2].get(2));

  a1 = b1.split(new ByteArray([2, 3]));
  assert.strictEqual(2, a1.length);
  assert.ok(a1[0] instanceof ByteArray);
  assert.strictEqual(2, a1[0].length);
  assert.strictEqual(0, a1[0].get(0));
  assert.strictEqual(1, a1[0].get(1));
  assert.strictEqual(2, a1[1].length);
  assert.strictEqual(4, a1[1].get(0));
  assert.strictEqual(5, a1[1].get(1));
};

exports.testForEach = function() {
  var b = new ByteArray([2, 3, 4, 5]), log = [], item;

  var thisObj = {};

  b.forEach(function() {
    log.push({
      thisObj:this,
      args:arguments
    });
  }, thisObj);

  assert.strictEqual(4, log.length, "block called for each item");

  item = log[0];
  assert.ok(thisObj === item.thisObj, "block called with correct thisObj");
  assert.strictEqual(3, item.args.length, "block called with three args");
  assert.strictEqual(b.get(0), item.args[0], "block called with correct item 0");

  item = log[3];
  assert.strictEqual(b.get(3), item.args[0], "block called with correct item 3");

};

exports.testConcat = function() {
  var a = [];
  var b = new ByteArray();

  var a1 = [1, 2, 3];
  var b1 = b.concat(new ByteArray(a1));
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
  [
    [],
    [3, 6],
    [3, 4],
    [3, 3],
    [3, 2],
    [7],
    [3, -2],
    [-2],
    [50],
    [-100, 100],
    ["foo"],
    ["foo", "bar"],
    ["foo", 4],
    [3, "bar"]
  ].forEach(function(test) {
    var a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    var b = new ByteArray(a);
    var s = a.slice.apply(a, test);
    var t = b.slice.apply(b, test);
    assert.ok(t instanceof ByteArray, test);
    assert.strictEqual(s.length, t.length, test);
    assert.deepEqual(s, t.toArray(), test);
  });
};

exports.testSplice = function() {
  var c = [42, 47];
  var tests = [];
  [
    [],
    [3, 6],
    [3, 4],
    [3, 3],
    [3, 2],
    [7],
    [3, -2],
    [-2],
    [50],
    [-100, 100],
    ["foo"],
    ["foo", "bar"],
    ["foo", 4],
    [3, "bar"]
  ].forEach(function(test) {
    tests.push(test.concat());
    test[0] |= 0;
    test[1] |= 0;
    tests.push(test.concat(c));
  });
  tests.forEach(function(test) {
    var a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    var b = new ByteArray(a);
    var s = a.splice.apply(a, test);
    var t = b.splice.apply(b, test);
    assert.strictEqual(a.length, b.length, 'modified: ' + test);
    assert.deepEqual(a, b.toArray(), 'modified: ' + test);
    assert.ok(t instanceof ByteArray, test);
    assert.strictEqual(s.length, t.length, 'removed: ' + test);
    assert.deepEqual(s, t.toArray(), 'removed: ' + test);
  });
};

if (require.main === module) {
  require("../../lib/test").run(exports);
}