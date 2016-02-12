(function( factory ) {
	"use strict";
	var interValId;
	var intervalIndex = 0;
	var run = function() {
		if ( window.picturefill ) {
			factory( window.picturefill );
		}
		if (window.picturefill || intervalIndex > 9999) {
			clearInterval(interValId);
		}
		intervalIndex++;
	};
	interValId = setInterval(run, 8);

	run();

}( function( picturefill ) {
	"use strict";

	var pf = picturefill._;
	var runningTests = 0;
	var setTypeValue = function(types, value) {
		var i;
		for (i = 0; i < types.length; i++) {
			pf.types[types[i]] = value;
		}
	};

	if (pf.supPicture && !pf.cfg.uT) {
		picturefill.testTypeSupport = function() {};
		return;
	}

	pf.types["image/bmp"] = true;
	pf.types["image/x-bmp"] = true;

	picturefill.testTypeSupport = function(types, url, width, useCanvas) {
		if (typeof types === "string") {
			types = types.split(/\s*\,*\s+/g);
		}
		var canvas;
		var supports = "pending";
		var img = document.createElement("img");
		var onComplete = function() {
			runningTests--;
			setTypeValue(types, supports);
			if (runningTests < 1) {
				picturefill({ reselect: true });
			}
		};

		if (useCanvas) {
			canvas = document.createElement("canvas");
			if (!canvas.getContext) {
				setTypeValue(types, false);
				return;
			}
		}

		img.onload = function() {
			var ctx;
			supports = true;
			if (width) {
				supports = img.width === width;
			}

			if (useCanvas) {
				ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0);
				supports = ctx.getImageData(0, 0, 1, 1).data[3] === 0;
			}
			onComplete();
		};

		img.onerror = function() {
			supports = false;
			onComplete();
		};
		runningTests++;
		setTypeValue(types, "pending");
		img.src = url;
	};

	picturefill.testTypeSupport("image/jp2 image/jpx image/jpm", "data:image/jp2;base64,/0//UQAyAAAAAAABAAAAAgAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAEBwEBBwEBBwEBBwEB/1IADAAAAAEAAAQEAAH/XAAEQED/ZAAlAAFDcmVhdGVkIGJ5IE9wZW5KUEVHIHZlcnNpb24gMi4wLjD/kAAKAAAAAABYAAH/UwAJAQAABAQAAf9dAAUBQED/UwAJAgAABAQAAf9dAAUCQED/UwAJAwAABAQAAf9dAAUDQED/k8+kEAGvz6QQAa/PpBABr994EAk//9k=", 1);
	picturefill.testTypeSupport("image/vnd.ms-photo", "data:image/vnd.ms-photo;base64,SUm8AQgAAAAFAAG8AQAQAAAASgAAAIC8BAABAAAAAQAAAIG8BAABAAAAAQAAAMC8BAABAAAAWgAAAMG8BAABAAAAHwAAAAAAAAAkw91vA07+S7GFPXd2jckNV01QSE9UTwAZAYBxAAAAABP/gAAEb/8AAQAAAQAAAA==", 1);
	picturefill.testTypeSupport("video/vnd.mozilla.apng image/apng", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjVEwAAAABAAAAAcMq2TYAAAANSURBVAiZY2BgYPgPAAEEAQB9ssjfAAAAGmZjVEwAAAAAAAAAAQAAAAEAAAAAAAAAAAD6A+gBAbNU+2sAAAARZmRBVAAAAAEImWNgYGBgAAAABQAB6MzFdgAAAABJRU5ErkJggg==", false, true);

}));
