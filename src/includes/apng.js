(function( w, doc ) {
	var pf = w.picturefill;

	pf._.types[ "image/x-apng" ] = w.picturefill._.types["image/x-apng"] = function() {
		var apngTest = new Image(), ctx = doc.createElement("canvas").getContext("2d");
		apngTest.onload = function() {
		    console.log("hmmm");
			ctx.drawImage(apngTest, 0, 0);
			pf._.types["image/x-apng"] = ctx.getImageData(0, 0, 1, 1).data[3] === 0;
			w.picturefill();
		};
		apngTest.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjVEwAAAABAAAAAcMq2TYAAAANSURBVAiZY2BgYPgPAAEEAQB9ssjfAAAAGmZjVEwAAAAAAAAAAQAAAAEAAAAAAAAAAAD6A+gBAbNU+2sAAAARZmRBVAAAAAEImWNgYGBgAAAABQAB6MzFdgAAAABJRU5ErkJggg==";
		// frame 1 (skipped on apng-supporting browsers): [0, 0, 0, 255]
		// frame 2: [0, 0, 0, 0];
		return "pending";
	};
} )( window, window.document );
