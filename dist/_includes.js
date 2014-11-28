	pf.detectImageSupport = function(type, base64Str) {
		// based on Modernizr's lossless img-webp test
		// note: asynchronous
		var img = new w.Image();

		img.onerror = function() {
			pf.types[type] = false;
			picturefill();
		};
		img.onload = function() {
			pf.types[type] = img.width === 1;
			picturefill();
		};
		img.src = "data:" + type + ";" + "base64," + base64Str;
	}; 
	pf.types[ "image/jp2" ] = pf.detectImageSupport("image/jp2", "/0//UQAyAAAAAAABAAAAAgAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAEBwEBBwEBBwEBBwEB/1IADAAAAAEAAAQEAAH/XAAEQED/ZAAlAAFDcmVhdGVkIGJ5IE9wZW5KUEVHIHZlcnNpb24gMi4wLjD/kAAKAAAAAABYAAH/UwAJAQAABAQAAf9dAAUBQED/UwAJAgAABAQAAf9dAAUCQED/UwAJAwAABAQAAf9dAAUDQED/k8+kEAGvz6QQAa/PpBABr994EAk//9k=");