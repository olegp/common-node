exports['ByteArray'] = require('./bytearray-tests');
exports['ByteArray Encodings'] = require('./bytearray-encodings-tests');
exports['ByteString'] = require('./bytestring-tests');
exports['ByteString Encodings'] = require('./bytestring-encodings-tests');

if (require.main == module) {
  require("../../lib/test").run(exports);
}
