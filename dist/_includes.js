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
		
		return "pending";
	}; 
	// test svg support
	pf.types[ "image/svg+xml" ] = doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");

	pf.types[ "image/webp" ] = pf.detectImageSupport("image/webp", "UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=");
	pf.types[ "image/vnd.ms-photo" ] = pf.detectImageSupport("image/vnd.ms-photo", "SUm8AQgAAAAFAAG8AQAQAAAASgAAAIC8BAABAAAAAQAAAIG8BAABAAAAAQAAAMC8BAABAAAAWgAAAMG8BAABAAAAHwAAAAAAAAAkw91vA07+S7GFPXd2jckNV01QSE9UTwAZAYBxAAAAABP/gAAEb/8AAQAAAQAAAA==");
	pf.types[ "image/jp2" ] = pf.detectImageSupport("image/jp2", "/0//UQAyAAAAAAABAAAAAgAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAEBwEBBwEBBwEBBwEB/1IADAAAAAEAAAQEAAH/XAAEQED/ZAAlAAFDcmVhdGVkIGJ5IE9wZW5KUEVHIHZlcnNpb24gMi4wLjD/kAAKAAAAAABYAAH/UwAJAQAABAQAAf9dAAUBQED/UwAJAgAABAQAAf9dAAUCQED/UwAJAwAABAQAAf9dAAUDQED/k8+kEAGvz6QQAa/PpBABr994EAk//9k=");
	pf.types["image/x-apng"] = function() {
		var apngTest = new Image(), ctx = document.createElement("canvas").getContext("2d");
		apngTest.onload = function() {
			ctx.drawImage(apngTest, 0, 0);
			pf.types["image/x-apng"] = ctx.getImageData(0, 0, 1, 1).data[3] === 0;
			picturefill();
		};
		apngTest.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjVEwAAAABAAAAAcMq2TYAAAANSURBVAiZY2BgYPgPAAEEAQB9ssjfAAAAGmZjVEwAAAAAAAAAAQAAAAEAAAAAAAAAAAD6A+gBAbNU+2sAAAARZmRBVAAAAAEImWNgYGBgAAAABQAB6MzFdgAAAABJRU5ErkJggg==";
		// frame 1 (skipped on apng-supporting browsers): [0, 0, 0, 255]
		// frame 2: [0, 0, 0, 0];
		return "pending";
	}; 