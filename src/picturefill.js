/*! Picturefill - Responsive Images that work today.
 *  Author: Scott Jehl, Filament Group, 2012 ( new proposal implemented by Shawn Jansepar )
 *  License: MIT/GPLv2
 *  Spec: http://picture.responsiveimages.org/
 */
(function( w, doc ) {
	// Enable strict mode
	"use strict";

	// HTML shim|v it for old IE (IE9 will still need the HTML video tag workaround)
	doc.createElement( "picture" );

	// local object for method references and testing exposure
	var lengthElInstered, lengthEl, srcsetAttr, currentSrcSupported;
	var pf = {};
	var noop = function() {};
	var image = doc.createElement( "img" );
	var docElem = doc.documentElement;
	var types = {};

	// namespace
	pf.ns = ("pf" + new Date().getTime()).substr(0, 9);
	srcsetAttr = "data-pfsrcset";

	currentSrcSupported = "currentSrc" in image;

	pf.isReady = false;

	// srcset support test
	pf.srcsetSupported = "srcset" in image;
	pf.sizesSupported = "sizes" in image;

	// using pf.qsa instead of dom traversing does scale much better,
	// especially on sites mixing responsive and non-responsive images
	pf.shortSelector = "picture > img, img[srcset]";
	pf.selector = pf.shortSelector;
	pf.options = {
		resQuantifier: 1 // 1 = normal quality || 0.5-0.9 = performance || 1.1 - 1.3 high zoom quality
	};

	if ( pf.srcsetSupported ) {
		pf.selector += ", img[" + pf.srcsetAttr + "]";
	}

	var anchor = doc.createElement( "a" );
	pf.makeUrl = function(src) {
		anchor.href = src;
		return anchor.href;
	};

	pf.qsa = function(context, sel) {
		return context.querySelectorAll(sel);
	};

	// just a string trim workaround
	function trim( str ) {
		return str.trim ? str.trim() : str.replace( /^\s+|\s+$/g, "" );
	}

	var warn = ( w.console && typeof console.warn === "function" ) ?
		function( message ) {
			console.warn( message );
		} :
		noop
	;

	/**
	 * Shortcut property for https://w3c.github.io/webappsec/specs/mixedcontent/#restricts-mixed-content ( for easy overriding in tests )
	 */
	pf.isSSL = w.location.protocol === "https:";

	/**
	 * Shortcut method for matchMedia ( for easy overriding in tests )
	 */
	pf.matchesMedia = function( media ) {
		return !media || ( w.matchMedia && w.matchMedia( media ).matches );
	};

	pf.vW = 0;

	function updateView() {
		pf.vW = w.innerWidth || docElem.clientWidth;
	}

	/**
	 * simplified version of matchesMedia for basic IE8 support
	 * basically taken from respond project
	 */
	var regex = {
		minw: /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
		maxw: /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/
	};
	var mediaCache = {};
	pf.mMQ = function( media ) {
		var min, max;
		var ret = false;
		if ( !media ) { return true; }
		if ( !mediaCache[ media ] ) {

			min = media.match( regex.minw ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" );
			max = media.match( regex.maxw ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" );

			if ( min ) {
				min = parseFloat( min, 10 ) * (min.indexOf( "em" ) > 0 ? pf.getEmValue() : 1);
			}

			if ( max ) {
				max = parseFloat( max, 10 ) * (max.indexOf( "em" ) > 0 ? pf.getEmValue() : 1);
			}

			mediaCache[ media ] = {
				min: min,
				max: max
			};
		}
		min = mediaCache[ media ].min;
		max = mediaCache[ media ].max;

		if ( (min && pf.vW >= min) || (max && pf.vW <= max) ) {
			ret = true;
		}

		return ret;
	};

	if ( !pf.matchesMedia( "(min-width: 0.1em)" ) ) {
		pf.matchesMedia = pf.mMQ;
	}

	/**
	 * Shortcut property for `devicePixelRatio` ( for easy overriding in tests )
	 */
	pf.DPR = ( w.devicePixelRatio || 1 );

	/**
	 * Get width in css pixel value from a "length" value
	 * http://dev.w3.org/csswg/css-values-3/#length-value
	 */
	var lengthCache = {};
	var regLength = /^([\d\.\-]+)(em|vw|px|%)$/;
	// baseStyle also used by getEmValue (i.e.: width: 1em is important)
	var baseStyle = "position: absolute; left: 0; visibility: hidden; display: block; padding: 0; margin: 0; border: none;font-size:1em;width:1em;";
	pf.calcLength = function( length ) {
		var failed, parsedLength;
		var origLength = length;
		var value = false;

		if ( !(origLength in lengthCache) ) {
			// If a length is specified and doesn’t contain a percentage, and it is greater than 0 or using `calc`, use it. Else, use the `100vw` default.

			parsedLength = length.match( regLength );

			if ( parsedLength ) {

				parsedLength[ 1 ] = parseFloat( parsedLength[ 1 ], 10 );

				if ( !parsedLength[ 1 ] || parsedLength[ 1 ] <= 0 || parsedLength[ 2 ] === "%" ) {
					value = false;
				} else if ( parsedLength[ 2 ] === "vw" ) {
					value = pf.vW * parsedLength[ 1 ] / 100;
				} else if ( parsedLength[ 2 ] === "em" ) {
					value = pf.getEmValue() * parsedLength[ 1 ];
				} else {
					value = parsedLength[ 1 ];
				}

			} else if ( length.indexOf("calc") > -1 || parseInt( length, 10 ) ) {

				/**
				 * If length is specified in  `vw` units, use `%` instead since the div we’re measuring
				 * is injected at the top of the document.
				 *
				 * TODO: maybe we should put this behind a feature test for `vw`?
				 */
				length = length.replace( "vw", "%" );

				// Create a cached element for getting length value widths
				if ( !lengthEl ) {
					lengthEl = doc.createElement( "div" );
					// Positioning styles help prevent padding/margin/width on `html` from throwing calculations off.
					lengthEl.style.cssText = baseStyle;
				}

				if ( !lengthElInstered ) {
					lengthElInstered = true;
					docElem.insertBefore( lengthEl, docElem.firstChild );
				}

				// set width to 0, so we can detect, wether style is invalid/unsupported
				lengthEl.style.width = 0;
				try {
					lengthEl.style.width = length;
				} catch(e){
					failed = true;
				}

				value = lengthEl.offsetWidth;

				if ( failed || value <= 0 ) {
					// Something has gone wrong. `calc()` is in use and unsupported, most likely.
					value = false;
				}
			}

			lengthCache[ origLength ] = value;

			if ( value === false ) {
				warn( "invalid source size: " + origLength );
			}
		}

		return lengthCache[ origLength ];
	};

	// container of supported mime types that one might need to qualify before using
	pf.types =  types;

	// Add support for standard mime types.
	types["image/jpeg"] = true;
	types["image/gif"] = true;
	types["image/png"] = true;

	// test svg support
	types[ "image/svg+xml" ] = doc.implementation.hasFeature( "http://www.w3.org/TR/SVG11/feature#Image", "1.1" );

	pf.createImageTest = function( type, src ) {
		// based on Modernizr's lossless img-webp test
		// note: asynchronous
		var timer;
		var img = doc.createElement( "img" );
		var complete = function() {
			clearTimeout(timer);
			if ( pf.isReady ) {
				pf.fillImgs();
			}
			img = null;
		};

		types[ type ] = "pending";

		img.onerror = function() {
			types[ type ] = false;
			complete();
		};
		img.onload = function() {
			types[ type ] = img.width === 1;
			complete();
		};
		timer = setTimeout(img.onerror, 300);
		img.src = src;
	};

	/**
	 * Takes a type string and checks if its supported
	 */

		//suggested method:
	pf.verifyTypeSupport = function( type ) {
		return ( type ) ? types[ type ] : true;
	};

	/**
	 * Parses an individual `size` and returns the length, and optional media query
	 */
	var regSize = /(\([^)]+\))?\s*(.+)/;
	var memSize = {};
	pf.parseSize = function( sourceSizeStr ) {
		var match;

		if ( !memSize[ sourceSizeStr ] ) {
			match = ( sourceSizeStr || "" ).match(regSize);
			memSize[ sourceSizeStr ] = {
				media: match && match[1],
				length: match && match[2]
			};
		}

		return memSize[ sourceSizeStr ];
	};

	pf.parseSet = function( set ) {
		/**
		 * A lot of this was pulled from Boris Smus’ parser for the now-defunct WHATWG `srcset`
		 * https://github.com/borismus/srcset-polyfill/blob/master/js/srcset-info.js
		 *
		 * 1. Let input (`srcset`) be the value passed to this algorithm.
		 * 2. Let position be a pointer into input, initially pointing at the start of the string.
		 * 3. Let raw candidates be an initially empty ordered list of URLs with associated
		 * unparsed descriptors. The order of entries in the list is the order in which entries
		 * are added to the list.
		 */

		if ( !set.candidates ) {

			var pos, url, descriptor, last, descpos;
			var srcset = set.srcset;

			set.candidates = [];

			while ( srcset ) {
				srcset = srcset.replace(/^\s+/g,"");
				// 5. Collect a sequence of characters that are not space characters, and let that be url.
				pos = srcset.search(/\s/g);
				descriptor = null;
				if ( pos !== -1 ) {
					url = srcset.slice( 0, pos );
					last = url.charAt( url.length - 1 );
					// 6. If url ends with a U+002C COMMA character (,), remove that character from url
					// and let descriptors be the empty string. Otherwise, follow these substeps
					// 6.1. If url is empty, then jump to the step labeled descriptor parser.
					if ( last === "," || url === "" ) {
						url = url.replace(/,+$/, "");
						descriptor = "";
					}
					srcset = srcset.slice( pos + 1 );
					// 6.2. Collect a sequence of characters that are not U+002C COMMA characters (,), and
					// let that be descriptors.
					if ( descriptor === null ) {
						descpos = srcset.indexOf( "," );
						if ( descpos !== -1 ) {
							descriptor = srcset.slice( 0, descpos );
							srcset = srcset.slice( descpos + 1 );
						} else {
							descriptor = srcset;
							srcset = "";
						}
					}
				} else {
					url = srcset;
					srcset = "";
				}

				// 7. Add url to raw candidates, associated with descriptors.
				if ( url && (descriptor = parseDescriptor( descriptor )) ) {
					set.candidates.push({
						url: url.replace(/^,+/, ""),
						desc: descriptor,
						set: set
					});
				}
			}
		}

		return set.candidates;
	};

	var memDescriptor = {};
	var regDescriptor =  /^([\d\.]+)(w|x)$/; // currently no h

	function parseDescriptor( descriptor ) {

		if ( !(descriptor in memDescriptor) ) {
			var descriptorObj = {
				val: 1,
				type: "x"
			};
			var parsedDescriptor = trim( descriptor || "" );

			if ( parsedDescriptor ) {
				if ( ( parsedDescriptor ).match( regDescriptor ) ) {
					descriptorObj.val = parseFloat( RegExp.$1, 10 );
					descriptorObj.type = RegExp.$2;
				} else {
					descriptorObj = false;
					warn( "unknown descriptor: " + descriptor );
				}
			}

			memDescriptor[ descriptor ] = descriptorObj;
		}

		return memDescriptor[ descriptor ];
	}

	/**
	 * returns em in px for html/body default size
	 * function taken from respondjs
	 */
	var eminpx;
	pf.getEmValue = function() {

		if ( !eminpx && doc.body ) {
			var div = doc.createElement( "div" ),
				body = doc.body,
				originalHTMLFontSize = docElem.style.fontSize,
				originalBodyFontSize = body && body.style.fontSize;

			div.style.cssText = baseStyle;

			// 1em in a media query is the value of the default font size of the browser
			// reset docElem and body to ensure the correct value is returned
			docElem.style.fontSize = "100%";
			body.style.fontSize = "100%";

			body.appendChild( div );
			eminpx = div.offsetWidth;
			body.removeChild( div );

			//also update eminpx before returning
			eminpx = parseFloat( eminpx, 10 );

			// restore the original values
			docElem.style.fontSize = originalHTMLFontSize;
			body.style.fontSize = originalBodyFontSize;

		}
		return eminpx || 16;
	};

	/**
	 * Takes a string of sizes and returns the width in pixels as a number
	 */
	pf.calcLengthFromList = function( sourceSizeListStr ) {
		// Split up source size list, ie ( max-width: 30em ) 100%, ( max-width: 50em ) 50%, 33%
		//                            or (min-width:30em) calc(30% - 15px)
		var sourceSize, parsedSize, length, media, i, len;
		var sourceSizeList = trim( sourceSizeListStr ).split( /\s*,\s*/ );
		var winningLength = false;
		for ( i = 0, len = sourceSizeList.length; i < len; i++ ) {
			// Match <media-condition>? length, ie ( min-width: 50em ) 100%
			sourceSize = sourceSizeList[ i ];
			// Split "( min-width: 50em ) 100%" into separate strings
			parsedSize = pf.parseSize( sourceSize );
			length = parsedSize.length;
			media = parsedSize.media;

			if ( !length ) {
				continue;
			}
			// if there is no media query or it matches, choose this as our winning length
			// and end algorithm
			if ( pf.matchesMedia( media ) && (winningLength = pf.calcLength( length )) !== false ) {
				break;
			}
		}

		// pass the length to a method that can properly determine length
		// in pixels based on these formats: http://dev.w3.org/csswg/css-values-3/#length-value
		return winningLength === false ? pf.vW : winningLength;
	};

	pf.setResolution = function( candidate, sizesattr ) {
		var descriptor = candidate.desc;

		if ( descriptor.type === "w" ) { // h = means height: || descriptor.type == 'h' do not handle yet...
			candidate.cWidth = pf.calcLengthFromList( sizesattr || "100vw" );
			candidate.res = descriptor.val / candidate.cWidth ;
		} else {
			candidate.res = descriptor.val;
		}
		return candidate;
	};

	/**
	 * Takes a candidate object with a srcset property in the form of url/
	 * ex. "images/pic-medium.png 1x, images/pic-medium-2x.png 2x" or
	 *     "images/pic-medium.png 400w, images/pic-medium-2x.png 800w" or
	 *     "images/pic-small.png"
	 * Get an array of image candidates in the form of
	 *      {url: "/foo/bar.png", resolution: 1}
	 * where resolution is http://dev.w3.org/csswg/css-values-3/#resolution-value
	 * If sizes is specified, res is calculated
	 */
	pf.prepareCandidates = function( set ) {
		var candidates, candidate;
		if ( set ) {

			candidates = pf.parseSet( set );

			for ( var i = 0, len = candidates.length; i < len; i++ ) {
				candidate = candidates[ i ];

				if ( !candidate.descriptor || !candidate.descriptor.skip) {
					pf.setResolution( candidate, set.sizes );
				}
			}
		}
		return candidates;
	};

	pf.applyCandidateFromSet = function( candidates, picImg ) {
		var candidate,
			length,
			bestCandidate,
			loadingSrc,
			candidateSrc;

		var dpr = pf.DPR * pf.options.resQuantifier;
		var curCandidate = picImg[ pf.ns ].curCandidate;

		//if current candidate is comming from the same set and also fit, do not change
		if ( curCandidate && candidates[0] && curCandidate.set === candidates[0].set && curCandidate.res >= dpr ) {
			return;
		}

		candidates.sort( ascendingSort );

		length = candidates.length;
		bestCandidate = candidates[ length - 1 ];

		for ( var i = 0; i < length; i++ ) {
			candidate = candidates[ i ];
			if ( candidate.res >= dpr ) {
				bestCandidate = candidate;
				break;
			}
		}

		loadingSrc = picImg[ pf.ns ].curSrc || picImg.currentSrc || picImg.src;

		if ( bestCandidate ) {

			if ( (candidateSrc = pf.makeUrl( bestCandidate.url )) !== loadingSrc ) {
				if ( pf.isSSL && !bestCandidate.url.indexOf( "http:" ) ) {
					warn( "insecure: " + candidateSrc );
				} else {
					pf.loadImg( picImg, bestCandidate, candidateSrc);

				}
			} else if ( bestCandidate.desc.type === "w" ) {
				pf.addDimensions( picImg, null, bestCandidate );
			}
		}
	};

	pf.setSrc = function( img, bestCandidate ) {
		var origWidth;
		img.src = bestCandidate.url;

		// although this is a specific Safari issue, we don't want to take too much different code paths
		if ( bestCandidate.set.type === "image/svg+xml" ) {
			origWidth = img.style.width;
			img.style.width = (img.offsetWidth + 1) + "px";

			// next line only should trigger a repaint
			// if... is only done to trick dead code removal
			if ( img.offsetWidth + 1 ) {
				img.style.width = origWidth;
			}
		}
	};

	pf.loadImg = function( img, bestCandidate, src ) {

		var cleanUp = img[ pf.ns ].loadGC;
		
		var directSrcChange = ( !img.complete || !img.getAttribute( "src" ) );

		var srcWasSet = false;
		var setSrc = function() {

			if ( !srcWasSet ) {
				srcWasSet = true;
				pf.setSrc( img, bestCandidate );
			}
		};

		if ( cleanUp ) {
			cleanUp();
		}
		// currentSrc attribute and property to match
		// http://picture.responsiveimages.org/#the-img-element
		if ( !currentSrcSupported ) {
			img.currentSrc = src;
		}

		img[ pf.ns ].curSrc  = src;
		img[ pf.ns ].curCandidate  = bestCandidate;

		//IE8 needs background loading for addDimensions feature + and it doesn't harm other browsers
		if ( pf.options.addDimensions || !directSrcChange ) {
			loadInBackground( img, bestCandidate, setSrc );
		}

		if ( directSrcChange ) {
			setSrc();
		}

	};

	function loadInBackground( img, bestCandidate, setSrc ) {
		var bImg = doc.createElement( "img" );

		img[ pf.ns ].loadGC = function() {
			if ( img ) {
				img[ pf.ns ].loadGC = null;
				img = null;
				bImg = null;
			}
		};

		bImg.onload = function() {

			if ( img ) {

				setSrc();

				pf.addDimensions( img, bImg, bestCandidate );

				img[ pf.ns ].loadGC();
			}
		};

		bImg.onerror = img[ pf.ns ].loadGC;
		bImg.onabort = img[ pf.ns ].loadGC;

		bImg.src = bestCandidate.url;
	}

	pf.addDimensions = function( img, bImg, data ) {

		if ( pf.options.addDimensions && !img[ pf.ns ].dims ) {

			if ( bImg ) {
				img[ pf.ns ].nW = bImg.naturalWidth || bImg.width;
				img[ pf.ns ].nH = bImg.naturalHeight || bImg.height;
			}

			if ( data.desc.type === "x" ) {
				img.setAttribute( "width", parseInt( (img[ pf.ns ].nW / data.res) / pf.options.resQuantifier, 10) );
			} else if ( data.desc.type === "w" ) {
				img.setAttribute( "width", parseInt( data.cWidth, 10) );
			}
		}
	};

	pf.applyBestCandidate = function( img ) {
		var srcSetCandidates;
		var matchingSet = pf.getSet( img );

		if ( matchingSet !== "pending" ) {
			if ( matchingSet ) {
				srcSetCandidates = pf.prepareCandidates( matchingSet );
				pf.applyCandidateFromSet( srcSetCandidates, img );
			}
			img[ pf.ns ].evaluated = true;
		}
	};

	function ascendingSort( a, b ) {
		return a.res - b.res;
	}

	pf.getSet = function( img ) {
		var i, set, supportsType;
		var match = false;
		var sets = img [ pf.ns ].sets;

		for ( i = 0; i < sets.length && !match; i++ ) {
			set = sets[i];

			if ( !set.srcset || !pf.matchesMedia( set.media ) ) {
				continue;
			}

			supportsType = pf.verifyTypeSupport( set.type );

			if ( !supportsType ) {
				continue;
			}

			if ( supportsType === "pending" ) {
				set = supportsType;
			}

			match = set;
			break;
		}

		return match;
	};

	var alwaysCheckWDescriptor = pf.srcsetSupported && !pf.sizesSupported;
	pf.parseSets = function( element, parent, options ) {

		var srcsetAttribute, fallbackCandidate, srcsetChanged, hasWDescripor, srcsetParsed;

		var hasPicture = parent.nodeName.toUpperCase() === "PICTURE";

		if ( !("src" in element[ pf.ns ]) || options.reparseSrc ) {
			element[ pf.ns ].src = element.getAttribute( "src" );
		}

		if ( !("dims" in element[ pf.ns ]) || options.reparseDimensions ) {
			element[ pf.ns ].dims = element.getAttribute( "width" ) && element.getAttribute( "height" );
		}

		if ( !("srcset" in element[ pf.ns ]) || options.reparseSrcset ) {
			srcsetAttribute = element.getAttribute( "srcset" );

			srcsetChanged = !srcsetAttribute && element[ pf.ns ].srcset;

			element[ pf.ns ].srcset = srcsetAttribute;
			srcsetParsed = true;

		}

		element[ pf.ns ].sets = [];

		if ( hasPicture ) {
			getAllSourceElements( parent, element[ pf.ns ].sets );
		}

		if ( element[ pf.ns ].srcset ) {
			fallbackCandidate = {
				srcset: element[ pf.ns ].srcset,
				sizes: element.getAttribute( "sizes" )
			};
			element[ pf.ns ].sets.push( fallbackCandidate );

			hasWDescripor = (alwaysCheckWDescriptor || element[ pf.ns ].src) ?
				pf.hasWDescripor( fallbackCandidate ) :
				false;

			// add normal src as candidate, if source has no w descriptor, we do not test for 1x descriptor,
			// because this doesn't change computation. i.e.: we might have one candidate more, but this candidate
			// should never be chosen
			if ( !hasWDescripor && element[ pf.ns ].src ) {
				fallbackCandidate.srcset += ", " + element[ pf.ns ].src;
				fallbackCandidate.candidates = false;
			}
		} else if ( element[ pf.ns ].src ) {
			element[ pf.ns ].sets.push( {
				srcset: element[ pf.ns ].src,
				sizes: null
			} );
		}

		// if img has picture or the srcset was removed or has a srcset and does not support srcset at all
		// or has a w descriptor (and does not support sizes) set support to false to evaluate
		element[ pf.ns ].supported = !( hasPicture || srcsetChanged || ( fallbackCandidate && !pf.srcsetSupported ) || hasWDescripor );

		if ( srcsetParsed && pf.srcsetSupported && !element[ pf.ns ].supported ) {
			if ( srcsetAttribute ) {
				element.setAttribute( pf.srcsetAttr, srcsetAttribute );
				// current FF crashes with srcset enabled and removeAttribute,
				// maybe change this line after FF34 release
				element.srcset = "";
			} else {
				element.removeAttribute( pf.srcsetAttr );
			}
		}

		element[ pf.ns ].parsed = true;
	};

	pf.hasWDescripor = function( set ) {
		if ( !set ) {
			return false;
		}
		var candidates = pf.parseSet( set );

		return candidates[ 0 ] && candidates[ 0 ].desc.type === "w";
	};

	function getAllSourceElements( picture, candidates ) {
		var i, len, source, srcset;

		// SPEC mismatch intended for size and perf:
		// actually only source elements preceding the img should be used
		// also note: don't use qsa here, because IE8 sometimes doesn't like source as the key part in a selector
		var sources = picture.getElementsByTagName( "source" );

		for ( i = 0, len = sources.length; i < len; i++ ) {
			source = sources[ i ];

			srcset = source.getAttribute( "srcset" );
			// if source does not have a srcset attribute, skip
			if ( srcset ) {
				candidates.push( {
					srcset: srcset,
					media: source.getAttribute( "media" ),
					type: source.getAttribute( "type" ),
					sizes: source.getAttribute( "sizes" )
				} );
			} else if ( source.getAttribute( "src" ) ) {
				warn( "`src` on `source` invalid, use `srcset`." );
			}
		}
	}

	pf.fillImg = function(element, options) {
		// expando for caching data on the img
		if ( !element[ pf.ns ] ) {
			element[ pf.ns ] = {};
		}

		// if the element has already been evaluated, skip it
		// unless `options.reevaluate` is set to true ( this, for example,
		// is set to true when running `picturefill` on `resize` ).
		if ( !options.reevaluate && !options.reparse && element[ pf.ns ].evaluated ) {
			return;
		}

		if ( !element[ pf.ns ].parsed || options.reparse ) {
			pf.parseSets( element, element.parentNode, options );
		}

		if ( !element[ pf.ns ].supported ) {
			// set evaluated to false, in case it will be called by type check
			element[ pf.ns ].evaluated = false;
			pf.applyBestCandidate( element );
		} else {
			element[ pf.ns ].evaluated = true;
		}
	};

	var resizeThrottle;
	pf.setupRun = function( options ) {

		//invalidate length cache
		if ( !options || options.reevaluate || options.reparse ) {
			lengthCache = {};
			updateView();

			// if all images are reevaluated clear the resizetimer
			if ( options && !options.elements && !options.context ) {
				clearTimeout( resizeThrottle );
			}
		}
	};

	pf.teardownRun = function( /*options*/ ) {
		var parent;
		if ( lengthElInstered ) {
			lengthElInstered = false;
			parent = lengthEl.parentNode;
			if ( parent ) {
				parent.removeChild( lengthEl );
			}
		}
	};

	/**
	 * alreadyRun flag used for setOptions. is it true setOptions will reevaluate
	 * @type {boolean}
	 */
	var alreadyRun = false;

	/**
	 *
	 * @param opt
	 */
	var picturefill = function( opt ) {
		var elements, i, plen, xParse;

		var options = opt || {};

		if ( options.reparseSrcset || options.reparseSrc || options.reparseDimensions ) {
			xParse = true;
			options.reparse = true;
		}

		if ( xParse && !options.elements ) {
			throw( "run reparse only on specific elements." );
		}

		if ( options.elements && options.elements.nodeType === 1 ) {
			if ( options.elements.nodeName.toUpperCase() === "IMG" ) {
				options.elements =  [ options.elements ];
			} else {
				options.context = options.elements;
				options.elements =  null;
			}
		}

		elements = options.elements || pf.qsa( (options.context || doc), ( options.reevaluate || options.reparse ) ? pf.selector : pf.shortSelector );

		if ( (plen = elements.length) ) {
			alreadyRun = true;
			pf.setupRun( options );

			// Loop through all elements
			for ( i = 0; i < plen; i++ ) {
				pf.fillImg(elements[ i ], options);
			}

			pf.teardownRun( options );
		}
	};

	// If picture is supported, well, that's awesome.
	if ( w.HTMLPictureElement ) {
		picturefill = noop;
		pf.fillImg = noop;
	}

	/* expose methods for testing */
	picturefill._ = pf;

	//use this internally for easy monkey patching/performance testing
	pf.fillImgs = picturefill;

	picturefill.setOptions = function(name, value) {
		if ( pf.options[ name ] !== value ) {
			pf.options[ name ] = value;
			if ( alreadyRun ) {
				pf.fillImgs( { reevaluate: true } );
			}
		}
	};

	/**
	 * Sets up picture polyfill by polling the document and running
	 * the polyfill every 250ms until the document is ready.
	 * Also attaches picturefill on resize
	 */
	if ( !w.HTMLPictureElement ) {
		(function() {
			var regReady = (w.attachEvent) ?
				/^loade|^c/ :
				/^loade|^c|^i/;

			var run = function() {

				if ( doc.body ) {
					// When the document has finished loading, stop checking for new images
					// https://github.com/ded/domready/blob/master/ready.js#L15
					// IE8/9/10 is checked longer for new updates, due to a browser bug
					if ( regReady.test( doc.readyState || "" ) ) {
						clearInterval( intervalId );
						pf.isReady = true;
					}
					pf.fillImgs();
				}
			};

			var intervalId = setInterval( run, 333);

			var resizeEval = function() {
				pf.fillImgs({ reevaluate: true });
			};
			var onResize = function() {
				w.clearTimeout( resizeThrottle );
				resizeThrottle = w.setTimeout( resizeEval, 99 );
			};
			if ( w.addEventListener  ) {
				w.addEventListener( "resize", onResize, false );
			} else if ( w.attachEvent ) {
				w.attachEvent( "onresize",  onResize );
			}
			setTimeout(run, doc.body ? 9 : 99);
		})();

		updateView();
		// test webp support
		pf.createImageTest( "image/webp", "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=" );
	}

	/* expose picturefill */
	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// CommonJS, just export
		module.exports = picturefill;
	} else if ( typeof define === "function" && define.amd ){
		// if AMD is used we still ad picturefill to the global namespace,
		// because too many people fail to use it
		w.picturefill = picturefill;
		// AMD support
		define( function() { return picturefill; } );
	} else if ( typeof w === "object" ) {
		// If no AMD and we are in the browser, attach to window
		w.picturefill = picturefill;
	}

} )( this, this.document );
