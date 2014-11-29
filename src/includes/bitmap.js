	pf.detectImageSupport = function(type, base64Str) {
		// based on Modernizr's lossless img-webp test
		// note: asynchronous
		var img = new w.Image();
		
		console.log("detecting", "'" + type + "'", pf.types);
		img.onerror = function() {
			pf.types[type] = false;
			picturefill();
		};
		img.onload = function() {
			console.log(type + " is supported");
			pf.types[type] = img.width === 1;
			picturefill();
		};
		img.src = "data:" + type + ";" + "base64," + base64Str;
		
		return "pending";
	}; 