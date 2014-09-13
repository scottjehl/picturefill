/*! Picturefill - Responsive Images that work today.
*  Author: Scott Jehl, Filament Group, 2012 ( new proposal implemented by Shawn Jansepar )
*  License: MIT/GPLv2
*  Spec: http://picture.responsiveimages.org/
*/
(function( w, doc ) {
	// Enable strict mode
	"use strict";

	// If picture is supported, well, that's awesome. Let's get outta here...
	if ( w.HTMLPictureElement ) {
		w.picturefill = function() { };
		return;
	}

	// HTML shim|v it for old IE (IE9 will still need the HTML video tag workaround)
	doc.createElement( "picture" );

	// local object for method references and testing exposure
	var pf = {};
	var noop = function(){};
	var image = doc.createElement( "img" );



	// namespace
	pf.ns = "picturefill" + new Date().getTime();
	pf.onReady = function(){pf.isReady = true;};
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
	pf.selector = pf.shortSelector + ", img[" + pf.picutreFillAttribute + "]";


	if(doc.querySelectorAll){
		pf.qsa = function(context, sel){
			return context.querySelectorAll(sel);
		};
		pf.qs = function(context, sel){
			return context.querySelector(sel);
		};
	} else {
		pf.qsa = function(context, sel){
			return (w.jQuery && jQuery.find || window.Sizzle || noop)(sel, context) || [];
		};
		pf.qs = function(context, sel){
			return (w.jQuery && jQuery.find || window.Sizzle || noop)(sel, context)[0];
		};
	}

	// just a string trim workaround
	pf.trim = function( str ) {
		return str.trim ? str.trim() : str.replace( /^\s+|\s+$/g, "" );
	};

	// just a string endsWith workaround
	pf.endsWith = function( str, suffix ) {
		return str.endsWith ? str.endsWith( suffix ) : str.indexOf( suffix, str.length - suffix.length ) !== -1;
	};

	/**
	 * Shortcut method for https://w3c.github.io/webappsec/specs/mixedcontent/#restricts-mixed-content ( for easy overriding in tests )
	 */
	pf.restrictsMixedContent = function() {
		return w.location.protocol === "https:";
	};
	/**
	 * Shortcut method for matchMedia ( for easy overriding in tests )
	 */
	pf.matchesMedia = function( media ) {
		return !media || (w.matchMedia && w.matchMedia( media ).matches);
	};

	/**
	 * Shortcut method for `devicePixelRatio` ( for easy overriding in tests )
	 */
	pf.getDpr = function() {
		return ( w.devicePixelRatio || 1 );
	};

	/**
	 * Get width in css pixel value from a "length" value
	 * http://dev.w3.org/csswg/css-values-3/#length-value
	 */
	pf.getWidthFromLength = function( length ) {
		var origLength = length;

		if( !pf.widthCache[origLength] ){
			// If a length is specified and doesn’t contain a percentage, and it is greater than 0 or using `calc`, use it. Else, use the `100vw` default.
			length = length && length.indexOf( "%" ) < 0 && ( parseFloat( length ) > 0 || length.indexOf( "calc(" ) > -1 ) ? length : "100vw";
			/**
			* If length is specified in  `vw` units, use `%` instead since the div we’re measuring
			* is injected at the top of the document.
			*
			* TODO: maybe we should put this behind a feature test for `vw`?
			*/
			length = length.replace( "vw", "%" );

			// Create a cached element for getting length value widths
			if ( !pf.lengthEl ) {
				pf.lengthEl = doc.createElement( "div" );
				// Positioning styles help prevent padding/margin/width on `html` from throwing calculations off.
				pf.lengthEl.style.cssText = "position: absolute; left: 0; visibility: hidden;";
			}

			if(!pf.lengthElInstered){
				doc.documentElement.insertBefore( pf.lengthEl, doc.documentElement.firstChild );
				pf.lengthElInstered = true;
			}

			// set width
			pf.lengthEl.style.width = length;

			if ( pf.lengthEl.offsetWidth <= 0 ) {
				// Something has gone wrong. `calc()` is in use and unsupported, most likely. Default to `100vw` (`100%`, for broader support.):
				pf.lengthEl.style.width = "100%";
			}

			//cache result
			pf.widthCache[origLength] = pf.lengthEl.offsetWidth;
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
			picturefill();
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
		img.src = src;
		timer = setTimeout(img.onerror, 300);
	};

	/**
	 * Takes a source element and checks if its type attribute is present and if so, supported
	 * Note: for type tests that require a async logic,
	 * you can define them as a function that'll run only if that type needs to be tested. Just make the test function call picturefill again when it is complete.
	 * see the async webp test above for example
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
	var regSize = /(\([^)]+\))?\s*(.+)/g;
	pf.parseSize = function( sourceSizeStr ) {
		var match = regSize.exec( sourceSizeStr );
		return {
			media: match && match[1],
			length: match && match[2]
		};
	};

	/**
	 * Takes a string of sizes and returns the width in pixels as a number
	 */
	pf.findWidthFromSourceSize = function( sourceSizeListStr ) {
		// Split up source size list, ie ( max-width: 30em ) 100%, ( max-width: 50em ) 50%, 33%
		//                            or (min-width:30em) calc(30% - 15px)
		var sourceSizeList = pf.trim( sourceSizeListStr ).split( /\s*,\s*/ ),
			winningLength;

		for ( var i = 0, len = sourceSizeList.length; i < len; i++ ) {
			// Match <media-condition>? length, ie ( min-width: 50em ) 100%
			var sourceSize = sourceSizeList[ i ],
				// Split "( min-width: 50em ) 100%" into separate strings
				parsedSize = pf.parseSize( sourceSize ),
				length = parsedSize.length,
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
		var candidates = [];
		var srcset = candidate.srcset;

		candidate.parsedSrcset = candidates;

		while ( srcset ) {
			srcset = srcset.replace(/^\s+/g,"");

			// 5. Collect a sequence of characters that are not space characters, and let that be url.
			var pos = srcset.search(/\s/g),
				url, descriptor = null;

			if ( pos !== -1 ) {
				url = srcset.slice( 0, pos );

				var last = url.charAt[ url.length - 1 ];

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
					var descpos = srcset.indexOf(",");
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
				candidates.push({
					url: url,
					descriptor: descriptor
				});
			}
		}
		return candidates;
	};

	var regPipe = /(^\s+|\s+$)/g;
	pf.parseDescriptor = function( descriptor, sizesattr ) {
		// 11. Descriptor parser: Let candidates be an initially empty source set. The order of entries in the list 
		// is the order in which entries are added to the list.
		var sizes = sizesattr || "100vw",
			sizeDescriptor = descriptor && descriptor.replace(regPipe, ""),
			widthInCssPixels = pf.findWidthFromSourceSize( sizes ),
			resCandidate;

			if ( sizeDescriptor ) {
				var splitDescriptor = sizeDescriptor.split(" ");

				for (var i = splitDescriptor.length + 1; i >= 0; i--) {
					if ( splitDescriptor[ i ] !== undefined ) {
						var curr = splitDescriptor[ i ],
							lastchar = curr && curr.charAt( curr.length - 1 );

						if ( ( lastchar === "h" || lastchar === "w" ) && !pf.sizesSupported ) {
							resCandidate = parseFloat( ( parseInt( curr, 10 ) / widthInCssPixels ) );
						} else if ( lastchar === "x" ) {
							var res = curr && parseFloat( curr, 10 );
							resCandidate = res && !isNaN( res ) ? res : 1;
						}
					}
				}
			}
		return resCandidate || 1;
	};

	/**
	 * Takes a srcset in the form of url/
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
		if( candidateData ) {
			candidates = pf.parseSrcset( candidateData );

			for ( var i = 0, len = candidates.length; i < len; i++ ) {
				candidate = candidates[ i ];

				formattedCandidates.push({
					url: candidate.url,
					resolution: pf.parseDescriptor( candidate.descriptor, candidate.sizes )
				});
			}
		}
		return formattedCandidates;
	};



	pf.applyBestCandidateFromSrcSet = function( candidates, picImg ) {
		var candidate,
			length,
			bestCandidate;

		candidates.sort( pf.ascendingSort );

		length = candidates.length;
		bestCandidate = candidates[ length - 1 ];

		for ( var i = 0; i < length; i++ ) {
			candidate = candidates[ i ];
			if ( candidate.resolution >= pf.getDpr() ) {
				bestCandidate = candidate;
				break;
			}
		}

		if( !bestCandidate && picImg[ pf.ns ].src ){

			bestCandidate = {
				url: picImg[ pf.ns ].src
			};

		}

		if ( bestCandidate && !pf.endsWith( picImg.src, bestCandidate.url ) ) {
			if ( pf.restrictsMixedContent() && bestCandidate.url.substr(0, "http:".length).toLowerCase() === "http:" ) {
				if ( pf.hasConsole ) {
					console.warn( "Blocked mixed content image " + bestCandidate.url );
				}
			} else {
				picImg.src = bestCandidate.url;
				// currentSrc attribute and property to match
				// http://picture.responsiveimages.org/#the-img-element

				if(!pf.currentSrcSupported){
					picImg.currentSrc = picImg.src;
				}
			}
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
	 * using <!--[if IE 9]><video style="display: none;"><![endif]-->
	 * and must account for that here by moving those source elements
	 * back into the picture element.
	 */
	pf.removeVideoShim = function( picture ) {
		var media = pf.qs( picture, "video, audio" );

		if ( media ) {
			var vsources = media.getElementsByTagName( "source" );
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

	pf.parseCanditates = function(element, parent, options){
		var srcsetAttribute;
		var hasPicture = parent.nodeName.toUpperCase() === "PICTURE";

		if( hasPicture || !pf.srcsetSupported || (!pf.sizesSupported && element.srcset.indexOf('w') != -1) ){
			element[ pf.ns ].supported = false;
		} else {
			element[ pf.ns ].supported = true;
		}

		element[ pf.ns ].candidates = [];

		if( !('src' in element[ pf.ns ]) || options.reparseSrc ){
			element[ pf.ns ].src = element.getAttribute( "src" );
		}

		if( !('srcset' in element[ pf.ns ]) || options.reparseSrcset || element.srcset){
			srcsetAttribute = element.getAttribute( "srcset" );
			element[ pf.ns ].srcset = srcsetAttribute;

			if( srcsetAttribute ) {
				element.setAttribute('data-'+pf.ns, element[ pf.ns ].srcset);
				if( pf.srcsetSupported && !pf.sizesSupported ){
					element.srcset = "";
				} else {
					element.removeAttribute( "srcset" );
				}

			} else {
				element.removeAttribute('data-'+pf.ns);
				if ( !hasPicture ) {
					element[ pf.ns ].supported = true;
				}
			}
		}


		if( hasPicture ){
			// IE9 video workaround
			pf.removeVideoShim( parent );

			getAllSourceElements( element, parent, element[ pf.ns ].candidates );
		}

		if(element[ pf.ns ].srcset){
			element[ pf.ns ].candidates.push({
				srcset: element[ pf.ns ].srcset,
				sizes: element.getAttribute( "sizes" )
			});
		}

		element[ pf.ns ].parsed = true;
	};

	function getAllSourceElements(element, picture , candidates){
		var i, len, source, srcset;

		var sources = picture.childNodes;
		for ( i = 0, len = sources.length; i < len; i++){
			source = sources[ i ];

			// Hitting the `img` element that started everything stops the search for `sources`.
			if ( source === element ) {
				break;
			}

			// ignore non-element nodes
			if ( source.nodeType !== 1 || source.nodeName.toUpperCase() !== "SOURCE" ) {
				continue;
			}

			srcset = source.getAttribute( "srcset" );

			// if source does not have a srcset attribute, skip
			if ( !srcset ) {
				// if it's a source element has the `src` property set, throw a warning in the console
				if( pf.hasConsole ) {
					console.warn( "Couldn't find srcset attribute on source. Also Note: The `src` attribute is invalid on `picture` `source` element; instead, use `srcset`." );
				}
				continue;
			}

			candidates.push({
				srcset: srcset,
				media: source.getAttribute( "media" ),
				type: source.getAttribute( "type" ),
				sizes: source.getAttribute( "sizes" )
			});
		}
	}

	pf._forEachImg = function(element, options){
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
		}
	};


	pf.setupRun = function(){
		//invalidate cache
		pf.widthCache = {};
	};

	pf.teardownRun = function(){
		if(pf.lengthElInstered){
			pf.lengthElInstered = false;
			doc.documentElement.removeChild(pf.lengthEl);
		}
	};

	var picturefill = function ( opt ) {
		var elements, element, i, plen;

		var options = opt || {};

		if(pf.hasConsole && options.reparse && !options.elements){
			console.warn( "reparse should only run on specific elements. reparse option also removes dodged `srcset and `src attributes!" );
		}

		elements = options.elements || pf.qsa(doc, options.reevaluate ? pf.selector : pf.shortSelector);

		if( (plen = elements.length) ) {
			pf.setupRun();

			// Loop through all elements
			for ( i = 0; i < plen; i++ ) {
				element = elements[ i ];
				pf._forEachImg(elements[ i ], options);

			}

			pf.teardownRun();
		}
	};

	/* expose methods for testing */
	picturefill._ = pf;

	/**
	 * Sets up picture polyfill by polling the document and running
	 * the polyfill every 250ms until the document is ready.
	 * Also attaches picturefill on resize
	 */
	(function () {
		var run = function(e) {
			// When the document has finished loading, stop checking for new images
			// https://github.com/ded/domready/blob/master/ready.js#L15
			if ( /^loade|^i|^c/.test( doc.readyState || "" ) || ( e && e.type == "DOMContentLoaded" ) ) {
				clearInterval( intervalId );
				picturefill();
				pf.onReady();
			} else {
				picturefill();
			}
		};
		var intervalId = setInterval( run, 250);
		var onResize = function() {
			picturefill({ reevaluate: true });
		};
		if ( w.addEventListener && doc.addEventListener ) {
			var resizeThrottle;
			w.addEventListener( "resize", function() {
				w.clearTimeout( resizeThrottle );
				resizeThrottle = w.setTimeout( onResize, 99 );
			}, false );
			doc.addEventListener( "DOMContentLoaded", run );
		}
	})();

	// test webp support + automatically runs picturefill test
	pf.createImageTest( "image/webp", "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=" );

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
