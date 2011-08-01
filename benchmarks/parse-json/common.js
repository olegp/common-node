//
var json = '';
for( var i = 0; i < 100; i++) {
	json += '"outer' + i + '":{';
	for( var j = 0; j < 10; j++) {
		json += '"inner' + j + '":"123456789' + i + '"';
		if(j < 9)
			json += ',';
	}
	json += '}';
	if(i < 99)
		json += ',';
}

exports.json = '{' + json + '}';
