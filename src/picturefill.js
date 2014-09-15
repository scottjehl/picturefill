/*! Picturefill - Responsive Images that work today.
*  Author: Scott Jehl, Filament Group, 2012 ( new proposal implemented by Shawn Jansepar )
*  License: MIT/GPLv2
*  Spec: http://picture.responsiveimages.org/
*/
(function( w, doc ) {
	// Enable strict mode
	"use strict";

	if( !("querySelectorAll" in doc) ) {
		throw( "No support for this old browser." );
	}

	// HTML shim|v it for old IE (IE9 will still need the HTML video tag workaround)
	doc.createElement( "picture" );

	// local object for method references and testing exposure
	var lengthElInstered, lengthEl;
	var pf = {};
	var noop = function() {};
	var image = doc.createElement( "img" );
	var docElem = doc.documentElement;


	// namespace
	pf.ns = "picturefill" + new Date().getTime();
	pf.onReady = function() {pf.isReady = true;};
	pf.isReady = false;

	// srcset support test
	pf.srcsetSupported = "srcset" in image;
	pf.sizesSupported = "sizes" in image;
	pf.currentSrcSupported = 'currentSrc' in image;
	pf.hasConsole = w.console && typeof console.warn == "function";

	pf.picutreFillAttribute = 'data-'+pf.ns+'srcset';

	// using qsa instead of dom traversing does scale much better,
	// especially on sites mixing responsive and non-responsive images
	pf.shortSelector = "picture > img, img[srcset]";
	pf.selector = pf.shortSelector;

	if ( pf.srcsetSupported ) {
		pf.selector += ", img[" + pf.picutreFillAttribute + "]";
	}


	pf.qsa = function(context, sel){
		return context.querySelectorAll(sel);
	};

	pf.qs = function(context, sel){
		return context.querySelector(sel);
	};

	pf.makeUrl = (function(){
		var anchor = doc.createElement( "a" );
		return function(src){
			anchor.href = src;
			return anchor.href;
		};
	})();

	// just a string trim workaround
	pf.trim = function( str ) {
		return str.trim ? str.trim() : str.replace( /^\s+|\s+$/g, "" );
	};

	/**
	 * Shortcut property for https://w3c.github.io/webappsec/specs/mixedcontent/#restricts-mixed-content ( for easy overriding in tests )
	 */
	pf.restrictsMixedContent = w.location.protocol === "https:";

	/**
	 * Shortcut method for matchMedia ( for easy overriding in tests )
	 */
	pf.matchesMedia = function( media ) {
		return !media || ( w.matchMedia && w.matchMedia( media ).matches );
	};

	pf.vW = 0;

	
	pf.updateView = (function(){
		var widthProp = "clientWidth";
		var isCompat = doc.compatMode === "CSS1Compat";

		return function() {
			pf.vW = isCompat && docElem[ widthProp ] || doc.body[ widthProp ] || docElem[ widthProp ];
		};
	})();

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
		if( !media ){ return true; }
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

		if ( ( min && pf.vW >= min ) || ( max && pf.vW <= max ) ) {
			ret = true;
		}

		return ret;
	};

	if( !pf.matchesMedia( "only all" ) ) {
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
	pf.widthCache = {};
	var regEmVw = /^([\d\.]+)(em|vw)$/;
	pf.getWidthFromLength = function( length ) {
		var failed, parsedLength;
		var origLength = length;


		if( !pf.widthCache[ origLength ] ){
			// If a length is specified and doesn’t contain a percentage, and it is greater than 0 or using `calc`, use it. Else, use the `100vw` default.
			length = length || "100vw";

			parsedLength = length.match( regEmVw );

			if( parsedLength && ( parsedLength[ 1 ] = parseFloat( parsedLength[ 1 ], 10 ) ) ) {

				if( parsedLength[ 2 ] == 'vw' ) {
					pf.widthCache[origLength] = pf.vW * parsedLength[ 1 ] / 100;
				} else  {
					pf.widthCache[origLength] = pf.getEmValue() * parsedLength[ 1 ];
				}

			} else {
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
					lengthEl.style.cssText = "position: absolute; left: 0; visibility: hidden; display: block; padding: 0; margin: 0; border: none;";
				}

				if ( !lengthElInstered ) {
					lengthElInstered = true;
					docElem.insertBefore( lengthEl, docElem.firstChild );
				}

				// set width
				try {
					lengthEl.style.width = length;
				} catch(e){
					failed = true;
				}

				if ( failed && lengthEl.offsetWidth <= 0 ) {
					// Something has gone wrong. `calc()` is in use and unsupported, most likely. Default to `100vw` (`100%`, for broader support.):
					lengthEl.style.width = "100%";
				}

				//cache result
				pf.widthCache[origLength] = lengthEl.offsetWidth;
			}

		}

		return pf.widthCache[origLength];
	};

	// container of supported mime types that one might need to qualify before using
	pf.types =  {};

	// Add support for standard mime types.
	pf.types["image/jpeg"] = true;
	pf.types["image/gif"] = true;
	pf.types["image/png"] = true;

	// test svg support
	pf.types[ "image/svg+xml" ] = doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");

	pf.createImageTest = function( type, src ){
		// based on Modernizr's lossless img-webp test
		// note: asynchronous
		var timer;
		var img = doc.createElement( "img" );
		var complete = function() {
			clearTimeout(timer);
			if(pf.isReady){
				pf.fillImgs();
			}
			img = null;
		};

		pf.types[ type ] = "pending";

		img.onerror = function() {
			pf.types[ type ] = false;
			complete();
		};
		img.onload = function() {
			pf.types[ type ] = img.width === 1;
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
		if( type ){
			return pf.types[ type ];
		} else {
			return true;
		}
	};

	/**
	 * Parses an individual `size` and returns the length, and optional media query
	 */
	pf.parseSize = (function(){
		var regSize = /(\([^)]+\))?\s*(.+)/;
		var memSize = {};
		return function( sourceSizeStr ) {
			var match;

			if(!memSize[sourceSizeStr]){
				match = ( sourceSizeStr || "" ).match(regSize);
				memSize[sourceSizeStr] = {
					media: match && match[1],
					length: match && match[2]
				};
			}

			return memSize[sourceSizeStr];
		};
	})();

	pf.parseSrcset = function( candidate ) {
		/**
		* A lot of this was pulled from Boris Smus’ parser for the now-defunct WHATWG `srcset`
		* https://github.com/borismus/srcset-polyfill/blob/master/js/srcset-info.js
		*
		* 1. Let input (`srcset`) be the value passed to this algorithm.
		* 2. Let position be a pointer into input, initially pointing at the start of the string.
		* 3. Let raw candidates be an initially empty ordered list of URLs with associated 
		*    unparsed descriptors. The order of entries in the list is the order in which entries 
		*    are added to the list.
		*/

		if( candidate.parsedSrcset ) {
			return candidate.parsedSrcset;
		}

		var pos, url, descriptor, last, descpos;

		var srcset = candidate.srcset;

		candidate.parsedSrcset = [];

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
			if ( url || descriptor ) {
				candidate.parsedSrcset.push({
					url: url,
					descriptor: pf.parseDescriptor( descriptor,  candidate.sizes )
				});
			}
		}
		return candidate.parsedSrcset;
	};


	var memDescriptor = {};
	var regDescriptor =  /^([\d\.]+)(w|x)$/; // currently no h
	pf.parseDescriptor = function( descriptor ) {

		if ( !memDescriptor[ descriptor ] ) {
			var parsedDescriptor = pf.trim( descriptor || "" );
			var descriptorObj = {
				value: 1,
				type: 'x'
			};

			if ( parsedDescriptor ) {
				if( ( parsedDescriptor ).match( regDescriptor ) ) {
					descriptorObj.value = parseFloat( RegExp.$1, 10 );
					descriptorObj.type = RegExp.$2;
				} else {
					descriptorObj.skip = true;
				}
			}

			memDescriptor[ descriptor ] = descriptorObj;
		}

		return memDescriptor[ descriptor ];
	};

	/**
	 * returns em in px for html/body default size
	 * function taken from respondjs
	 */
	var eminpx;
	pf.getEmValue = function() {

		if ( !eminpx && doc.body ) {
			var div = doc.createElement('div'),
				body = doc.body,
				originalHTMLFontSize = docElem.style.fontSize,
				originalBodyFontSize = body && body.style.fontSize;

			div.style.cssText = "position:absolute;font-size:1em;width:1em";

			// 1em in a media query is the value of the default font size of the browser
			// reset docElem and body to ensure the correct value is returned
			docElem.style.fontSize = "100%";
			body.style.fontSize = "100%";

			try {
				body.appendChild( div );
				eminpx = div.offsetWidth;
				body.removeChild( div );

				//also update eminpx before returning
				eminpx = parseFloat(eminpx, 10);
			} catch(e){}

			// restore the original values
			docElem.style.fontSize = originalHTMLFontSize;
			if( originalBodyFontSize ) {
				body.style.fontSize = originalBodyFontSize;
			}

		}
		return eminpx || 16;
	};

	/**
	 * Takes a string of sizes and returns the width in pixels as a number
	 */
	pf.findWidthFromSourceSize = function( sourceSizeListStr ) {
		// Split up source size list, ie ( max-width: 30em ) 100%, ( max-width: 50em ) 50%, 33%
		//                            or (min-width:30em) calc(30% - 15px)
		var winningLength, sourceSize, parsedSize, length, media, i, len;
		var sourceSizeList = pf.trim( sourceSizeListStr ).split( /\s*,\s*/ );

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
			if ( pf.matchesMedia( media ) ) {
				// if there is no media query or it matches, choose this as our winning length
				// and end algorithm
				winningLength = length;
				break;
			}
		}

		// pass the length to a method that can properly determine length
		// in pixels based on these formats: http://dev.w3.org/csswg/css-values-3/#length-value
		return pf.getWidthFromLength( winningLength );
	};

	pf.getResolution = function( descriptor, sizesattr ) {
		var sizes = sizesattr || "100vw";
		var resCandidate = descriptor.value;

		if( descriptor.type == 'w' ) { // h = means height: || descriptor.type == 'h' do not handle yet...
			resCandidate = resCandidate / pf.findWidthFromSourceSize( sizes ) ;
		}
		return resCandidate || 1;
	};

	/**
	 * Takes a candidate object with a srcset property in the form of url/
	 * ex. "images/pic-medium.png 1x, images/pic-medium-2x.png 2x" or
	 *     "images/pic-medium.png 400w, images/pic-medium-2x.png 800w" or
	 *     "images/pic-small.png"
	 * Get an array of image candidates in the form of
	 *      {url: "/foo/bar.png", resolution: 1}
	 * where resolution is http://dev.w3.org/csswg/css-values-3/#resolution-value
	 * If sizes is specified, resolution is calculated
	 */
	pf.getCandidatesFromSourceSet = function( candidateData ) {
		var candidates, candidate;
		var formattedCandidates = [];
		if ( candidateData ) {

			candidates = pf.parseSrcset( candidateData );

			for ( var i = 0, len = candidates.length; i < len; i++ ) {
				candidate = candidates[ i ];

				if ( !candidate.descriptor || !candidate.descriptor.skip) {
					formattedCandidates.push({
						url: candidate.url,
						resolution: pf.getResolution( candidate.descriptor, candidateData.sizes )
					});
				}
			}
		}
		return formattedCandidates;
	};


	pf.applyBestCandidateFromSrcSet = function( candidates, picImg ) {
		var candidate,
			length,
			bestCandidate,
			loadingSrc,
			candidateSrc;

		candidates.sort( pf.ascendingSort );

		length = candidates.length;
		bestCandidate = candidates[ length - 1 ];

		for ( var i = 0; i < length; i++ ) {
			candidate = candidates[ i ];
			if ( candidate.resolution >= pf.DPR ) {
				bestCandidate = candidate;
				break;
			}
		}

		if( !bestCandidate && picImg[ pf.ns ].src ){

			bestCandidate = {
				url: picImg[ pf.ns ].src
			};

		}

		loadingSrc = picImg[ pf.ns ].curSrc || picImg.currentSrc || picImg.src;

		if ( bestCandidate &&  ( candidateSrc = pf.makeUrl( bestCandidate.url ) ) != loadingSrc ) {
			if ( pf.restrictsMixedContent && !bestCandidate.url.indexOf("http:") ) {
				if ( pf.hasConsole ) {
					console.warn( "Blocked mixed content image " + candidateSrc );
				}
			} else {

				pf.loadImg( picImg, candidateSrc);

			}
		}
	};

	pf.loadImg = function( img, src ) {
		var bImg;
		var load = img[ pf.ns ].loadGC;

		if ( load ) {
			load();
		}
		// currentSrc attribute and property to match
		// http://picture.responsiveimages.org/#the-img-element
		if(!pf.currentSrcSupported){
			img.currentSrc = src;
		}
		img[ pf.ns ].curSrc  = src;

		if ( img.complete && img.getAttribute( "src" ) ) {
			bImg = document.createElement( "img" );

			img[ pf.ns ].loadGC = function(){
				img[ pf.ns ].loadGC = null;
				img = null;
				bImg = null;
			};

			bImg.onload = function(){
				var connected;
				if ( img ) {

					if ( pf.observer && pf.observer.connected ){
						connected = true;
						pf.observer.disconnect();
					}

					img.src = src;
					img[ pf.ns ].loadGC();

					if ( connected ) {
						pf.observer.observe();
					}
				}
			};
			bImg.src = src;

		} else {
			img.src = src;
		}
	};

	pf.applyBestCandidate = function( img ){
		var srcSetCandidates;
		var match = pf.getFirstMatch( img );

		if ( match != "pending" ) {
			srcSetCandidates = pf.getCandidatesFromSourceSet( match );
			pf.applyBestCandidateFromSrcSet( srcSetCandidates, img );
			img[ pf.ns ].evaluated = true;
		}
	};

	pf.ascendingSort = function( a, b ) {
		return a.resolution - b.resolution;
	};

	/*
	 * In IE9, <source> elements get removed if they aren't children of
	 * video elements. Thus, we conditionally wrap source elements
	 * using <!--[if IE 9]><audio><![endif]-->
	 * and must account for that here by moving those source elements
	 * back into the picture element.
	 */
	pf.removeMediaShim = function( picture ) {
		var vsources;
		var media = pf.qs( picture, "video, audio" );

		if ( media ) {
			vsources = media.getElementsByTagName( "source" );
			while ( vsources.length ) {
				picture.insertBefore( vsources[ 0 ], media );
			}
			// Remove the video element once we're finished removing its children
			media.parentNode.removeChild( media );
		}
	};


	pf.getFirstMatch = function( img ) {
		var i, candidate, supportsType;
		var match = false;
		var candidates = img [ pf.ns ].candidates;

		for ( i = 0; i < candidates.length && !match; i++ ) {
			candidate = candidates[i];
			if( !candidate.srcset || !pf.matchesMedia( candidate.media ) ) {
				continue;
			}

			supportsType = pf.verifyTypeSupport( candidate.type );

			if( !supportsType ) {
				continue;
			}

			if( supportsType == "pending" ){
				candidate = supportsType;
			}

			match = candidate;
			break;
		}

		return match;
	};

	pf.hasNonXDescriptor = function( candidate ) {
		var i;
		var srcset = pf.parseSrcset( candidate );
		var ret = false;
		for( i = 0; i < srcset.length; i++ ) {
			if ( srcset[ 0 ].descriptor && srcset[ 0 ].descriptor.type != 'x' ) {
				ret = true;
				break;
			}
		}
		return ret;
	};

	pf.needsSrcsetPolyfill = function( candidate ) {
		if ( !candidate ) { return false; }
		var needsPolyfill = !pf.srcsetSupported;

		if ( !needsPolyfill && !pf.sizesSupported &&
			( candidate.sizes || pf.hasNonXDescriptor( candidate ) ) ) {
			needsPolyfill = true;
		}
		return needsPolyfill;
	};

	pf.parseCanditates = function( element, parent, options ) {
		var srcsetAttribute, fallbackCandidate , srcsetChanged;

		var hasPicture = parent.nodeName.toUpperCase() === "PICTURE";

		if( !('src' in element[ pf.ns ]) || options.reparseSrc ) {
			element[ pf.ns ].src = element.getAttribute( "src" );
		}

		if ( !('srcset' in element[ pf.ns ]) || options.reparseSrcset ) {
			srcsetAttribute = element.getAttribute( "srcset" );

			srcsetChanged = !srcsetAttribute && element[ pf.ns ].srcset;

			element[ pf.ns ].srcset = srcsetAttribute;

			if ( pf.srcsetSupported ) {
				if ( srcsetAttribute ) {
					element.setAttribute( pf.picutreFillAttribute, srcsetAttribute );
					if ( pf.srcsetSupported && !pf.sizesSupported ) {
						element.srcset = "";
					} else {
						element.removeAttribute( "srcset" );
					}

				} else {
					element.removeAttribute( pf.picutreFillAttribute );
				}
			}
		}

		if( element[ pf.ns ].srcset ){
			fallbackCandidate = {
				srcset: element[ pf.ns ].srcset,
				sizes: element.getAttribute( "sizes" )
			};

			if ( !hasPicture ) {
				pf.parseSrcset( fallbackCandidate );
			}
		}


		if ( hasPicture || srcsetChanged || pf.needsSrcsetPolyfill( fallbackCandidate ) ) {
			element[ pf.ns ].supported = false;
		} else {
			element[ pf.ns ].supported = true;
		}

		element[ pf.ns ].candidates = [];



		if( hasPicture ){
			// IE9 video workaround
			pf.removeMediaShim( parent );

			getAllSourceElements( parent, element[ pf.ns ].candidates );
		}

		if(fallbackCandidate){
			element[ pf.ns ].candidates.push( fallbackCandidate );
		}

		element[ pf.ns ].parsed = true;
	};

	function getAllSourceElements(picture , candidates) {
		var i, len, source, srcset;


		var sources = pf.qsa(picture, 'source[srcset]');

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
			}
		}

	}

	pf.fillImg = function(element, options){
		// expando for caching data on the img
		if ( !element[ pf.ns ] ) {
			element[ pf.ns ] = {};
		}

		// if the element has already been evaluated, skip it
		// unless `options.force` is set to true ( this, for example,
		// is set to true when running `picturefill` on `resize` ).
		if ( !options.reevaluate && !options.reparse && element[ pf.ns ].evaluated ) {
			return;
		}

		if( !element[ pf.ns ].parsed || options.reparse ) {
			pf.parseCanditates( element, element.parentNode, options );
		}

		if( !element[ pf.ns ].supported ){
			// set evaluated to false, to in case we need to restart
			element[ pf.ns ].evaluated = false;

			pf.applyBestCandidate( element );

		} else {

			element[ pf.ns ].evaluated = true;

		}

	};


	pf.setupRun = function( options ) {
		//invalidate cache
		if ( !options || options.reevaluate || options.reparse ){
			pf.widthCache = {};
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

	var picturefill = function ( opt ) {
		var elements, i, plen, xParse;

		var options = opt || {};

		if ( options.reparseSrcset || options.reparseSrc ) {
			xParse = true;
			options.reparse = true;
		}

		if ( xParse && !options.elements ) {
			throw( "reparse should only run on specific elements." );
		}

		elements = options.elements || pf.qsa(doc, ( options.reevaluate || options.reparse ) ? pf.selector : pf.shortSelector);

		if( (plen = elements.length) ) {
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

	/**
	 * Sets up picture polyfill by polling the document and running
	 * the polyfill every 250ms until the document is ready.
	 * Also attaches picturefill on resize
	 */
	if ( !w.HTMLPictureElement ) {
		(function () {
			var resizeThrottle;
			var run = function() {

				if ( doc.body ) {
					// When the document has finished loading, stop checking for new images
					// https://github.com/ded/domready/blob/master/ready.js#L15
					if ( /^loade|^c|^i/.test( doc.readyState || "" ) ) {
						clearInterval( intervalId );

						pf.fillImgs();

						pf.onReady();

						pf.onReady = noop;
					} else {
						pf.fillImgs();
					}
				}
			};

			var intervalId = setInterval( run, 250);

			var resizeEval = function() {
				pf.updateView();
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

		})();

		pf.updateView();
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
