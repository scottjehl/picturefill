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
	// test svg support
	pf.types[ "image/svg+xml" ] = doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");

	pf.types[ "image/webp" ] = pf.detectImageSupport("image/webp;base64", "UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=");