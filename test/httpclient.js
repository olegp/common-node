var assert = require("../lib/assert");
var HttpClient = require("../lib/httpclient").HttpClient;

exports.testGet = function() {
	var response = new HttpClient({
		method: "GET",
		url: "http://google.com/"
	}).read();
	assert.strictEqual(response.status, 301);
};

exports.testPut = function() {
	var response = new HttpClient({
		method: "PUT",
		url: "http://google.com/"
	}).read();
	assert.strictEqual(response.status, 405);
};

exports.testHttpsGet = function() {
	var response = new HttpClient({
		method: "GET",
		url: "https://google.com/"
	}).read();
	assert.strictEqual(response.status, 301);
};

exports.testPutBody = function() {

};

if (require.main == module) {
	require("../lib/test").run(exports);
}
