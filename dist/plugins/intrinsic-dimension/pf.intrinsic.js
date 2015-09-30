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

}( function( picturefill, undefined ) {
	"use strict";

	var document = window.document;
	var pf = picturefill._;
	var knownWidths = {};
	var cfg = pf.cfg;
	var curSrcProp = "currentSrc";
	var setSize = function(width, img, data) {
		var curCandidate = data.curCan;

		if ( width ) {
			img.setAttribute( "width", parseInt(width / curCandidate.res, 10) );
		}
	};
	var loadBg = function(url, img, data) {
		var bgImg, curCandidate, clear;

		if (url in knownWidths) {
			setSize(knownWidths[url], img, data);
		} else {
			clear = function() {
				data.pendingURLSize = null;
				bgImg.onload = null;
				bgImg.onerror = null;
				img = null;
				bgImg = null;
			};

			data.pendingURLSize = url;
			curCandidate = data.curCan;

			if (curCandidate.w) {
				setSize(curCandidate.w, img, data);
			}

			bgImg = document.createElement("img");

			bgImg.onload = function() {
				knownWidths[url] = bgImg.naturalWidth || bgImg.width;
				if (!knownWidths[url]) {
					try {
						document.body.appendChild(bgImg);
						knownWidths[url] = bgImg.offsetWidth || bgImg.naturalWidth || bgImg.width;
						document.body.removeChild(bgImg);
					} catch (e) {}
				}
				if (url === img[curSrcProp]) {
					setSize(knownWidths[url], img, data);
				}
				clear();
			};
			bgImg.onerror = clear;

			bgImg.src = url;

			if (bgImg && bgImg.complete) {
				bgImg.onload();
			}
		}

	};
	var reeval = (function() {
		var running, timer;

		var run = function() {
			var i, len, imgData;
			var imgs = document.getElementsByTagName("img");
			var options = { elements: [] };

			pf.setupRun(options);

			running = false;
			clearTimeout(timer);

			for (i = 0, len = imgs.length; i < len; i++) {
				imgData = imgs[i][pf.ns];

				if (imgData && imgData.curCan) {
					pf.setRes.res(imgData.curCan, imgData.curCan.set.sizes);
					pf.setSize(imgs[i]);
				}
			}

			pf.teardownRun( options );
		};

		return function() {
			if (!running && cfg.addSize) {
				running = true;
				clearTimeout(timer);
				timer = setTimeout(run);
			}
		};

	})();

	if ( !(curSrcProp in document.createElement("img")) ) {
		curSrcProp = "src";
	}

	pf.setSize = function( img ) {
		var url;
		var data = img[ pf.ns ];
		var curCandidate = data.curCan;

		if ( data.dims === undefined ) {
			data.dims = img.getAttribute( "height" ) && img.getAttribute( "width" );
		}

		if ( !cfg.addSize || !curCandidate || data.dims ) {return;}
		url = pf.makeUrl(curCandidate.url);

		if (url === img[curSrcProp] && url !== data.pendingURLSize) {
			loadBg(url, img, data);
		}
	};

	if (window.addEventListener && !pf.supPicture) {
		addEventListener("resize", reeval, false);
	}

	if (!("addSize" in cfg)) {
		cfg.addSize = true;
	} else {
		cfg.addSize = !!cfg.addSize;
	}

	reeval();
}));
