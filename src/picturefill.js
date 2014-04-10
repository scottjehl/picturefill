/*! Picturefill - Responsive Images that work today.
*  Author: Scott Jehl, Filament Group, 2012 ( new proposal implemented by Shawn Jansepar )
*  License: MIT/GPLv2
*  Spec: http://picture.responsiveimages.org/
*/
(function( w, doc ) {
	// Enable strict mode
	"use strict";

	// If picture is supported, well, that's awesome. Let's get outta here...
	if( w.HTMLPictureElement ){
		return;
	}

	// HTML shim|v it for old IE (IE9 will still need the HTML video tag workaround)
	doc.createElement( "picture" );
	doc.createElement( "source" );

	// local object for method references and testing exposure
	var pf = {};

	// just a string trim workaround
	pf.trim = function( str ){
		return str.trim ? str.trim() : str.replace( /^\s+|\s+$/g, "" );
	};

	pf.endsWith = function( str, suffix ){
		return str.endsWith ? str.endsWith( suffix ) : str.indexOf( suffix, str.length - suffix.length ) !== -1;
	};

	/**
	 * Shortcut method for matchMedia ( for easy overriding in tests )
	 */
	pf.matchesMedia = function( media ) {
		return w.matchMedia && w.matchMedia( media ).matches;
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
	var lengthEl;

	pf.getCachedLengthEl = function() {
		lengthEl = lengthEl || doc.createElement( "div" );
		if ( !doc.body ) {
			return;
		}
		doc.body.appendChild( lengthEl );
		return lengthEl;
	};

	pf.getWidthFromLength = function( length ) {
		var lengthEl = pf.getCachedLengthEl();
		lengthEl.style.cssText = "width: " + length + ";";
		// Using offsetWidth to get width from CSS
		return lengthEl.offsetWidth;
	};

	/**
	 * Takes a string of sizes and returns the width in pixels as an int
	 */
	pf.findWidthFromSourceSize = function( sourceSizeListStr ) {
		// Split up source size list, ie ( max-width: 30em ) 100%, ( max-width: 50em ) 50%, 33%
		var sourceSizeList = pf.trim( sourceSizeListStr ).split( /\s*,\s*/ );
		var winningLength;
		for ( var i=0, len=sourceSizeList.length; i < len; i++ ) {
			// Match <media-query>? length, ie ( min-width: 50em ) 100%
			var sourceSize = sourceSizeList[ i ];

			// Split "( min-width: 50em ) 100%" into separate strings
			var match = /(\([^)]+\))?\s*([^\s]+)/g.exec( sourceSize );
			if ( !match ) {
					continue;
			}
			var length = match[ 2 ];
			var media;
			if ( !match[ 1 ] ) {
				// if there is no media query, choose this as our winning length
				winningLength = length;
				break;
			} else {
				media = match[ 1 ];
			}

			if ( pf.matchesMedia( media ) ) {
				// if the media query matches, choose this as our winning length
				// and end algorithm
				winningLength = length;
				break;
			}
		}

		// default to 300px if no length was selected
		if ( !winningLength ) {
			return 300;
		}

		// pass the length to a method that can properly determine length
		// in pixels based on these formats: http://dev.w3.org/csswg/css-values-3/#length-value
		var winningLengthInt = pf.getWidthFromLength( winningLength );
		return winningLengthInt;
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
	pf.getCandidatesFromSourceSet = function( srcset, sizes ) {
		var candidates = pf.trim( srcset ).split( /\s*,\s*/ );
		var formattedCandidates = [];
		var widthInCssPixels;
		if ( sizes ) {
			widthInCssPixels = pf.findWidthFromSourceSize( sizes );
		}
		for ( var i = 0, len = candidates.length; i < len; i++ ) {
			var candidate = candidates[ i ];
			var candidateArr = candidate.split( /\s+/ );
			var sizeDescriptor = candidateArr[ 1 ];
			var resolution;
			if ( sizeDescriptor && ( sizeDescriptor.slice( -1 ) === "w" || sizeDescriptor.slice( -1 ) === "x" ) ) {
				sizeDescriptor = sizeDescriptor.slice( 0, -1 );
			}
			if ( sizes ) {
				// get the dpr by taking the length / width in css pixels
				resolution = parseFloat( ( parseInt( sizeDescriptor, 10 ) / widthInCssPixels ).toFixed( 2 ) );
			} else {
				// get the dpr by grabbing the value of Nx
				resolution = sizeDescriptor ? parseFloat( sizeDescriptor, 10 ) : pf.getDpr();
			}

			var formattedCandidate = {
				url: candidateArr[0],
				resolution: resolution
			};
			formattedCandidates.push( formattedCandidate );
		}
		return formattedCandidates;
	};

	pf.processSourceSet = function( el ) {
		var srcset = el.getAttribute( "srcset" ),
			sizes = el.getAttribute( "sizes" ),
			candidates = [];

		if( srcset ) {
			candidates = pf.getCandidatesFromSourceSet( srcset, sizes );
		}
		return candidates;
	};

	pf._applyBestCandidate = function( candidates, picImg ) {
		var sortedImgCandidates = candidates.sort( pf.ascendingSort ),
			candidate;

		for ( var l=0; l < sortedImgCandidates.length; l++ ) {
			candidate = sortedImgCandidates[ l ];
			if ( candidate.resolution >= pf.getDpr() ) {
				if ( !pf.endsWith( picImg.src, candidate.url ) ) {
					if( picImg.srcset === undefined ) {
						picImg.src = candidate.url;
					} else {
						picImg.srcset = candidate.url;
					}
				}
				break;
			}
		}
	};

	pf.ascendingSort = function( a, b ) {
		return a.resolution > b.resolution;
	};

	function picturefill( forceEvaluate ) {
		// Loop through all images on the page that are `<picture>`
		var pictures = doc.getElementsByTagName( "picture" );
		for ( var i=0, plen = pictures.length; i < plen; i++ ) {
			var picture = pictures[i];

			// if a picture element has already been evaluated, skip it
			// unless "forceEvaluate" is set to true ( this, for example,
			// is set to true when running `picturefill` on `resize` ).
			if ( !forceEvaluate && picture.hasAttribute( "data-picture-evaluated" )) {
				continue;
			}
			picture.setAttribute( "data-picture-evaluated", true );
			var matches = [];

			// In IE9, <source> elements get removed if they aren"t children of
			// video elements. Thus, we conditionally wrap source elements
			// using <!--[if IE 9]><video style="display: none;"><![endif]-->
			// and must account for that here by moving those source elements
			// back into the picture element.
			var videos = picture.getElementsByTagName( "video" );
			if ( videos.length > 0 ) {
				var video = videos[0];
				var vsources = video.getElementsByTagName( "source" );
				while ( vsources.length > 0 ) {
					picture.appendChild( vsources[0] );
				}
				// Remove the video element once we"re finished removing it"s children
				video.parentNode.removeChild( video );
			}

			var sources = picture.getElementsByTagName( "source" );

			// Go through each child, and if they have media queries, evaluate them
			// and add them to matches
			for ( var j=0, slen = sources.length; j < slen; j++ ) {
				var source = sources[j];
				var media = source.getAttribute( "media" );

				// if source does not have a srcset attribute, skip
				if ( !source.hasAttribute( "srcset" )) {
					continue;
				}

				// if there"s no media specified, OR w.matchMedia is supported
				if( !media || pf.matchesMedia( media )){
					matches.push( source );
				}
			}

			// Find any existing img element in the picture element
			var picImg = picture.getElementsByTagName( "img" )[0],
				candidates;

			if ( picImg && matches.length ) {
				var matchedEl = matches.pop();

				candidates = pf.processSourceSet( matchedEl );
				pf._applyBestCandidate( candidates, picImg );

			} else if ( picImg && !matches.length ) {
				// No sources matched, so we’re down to processing the inner `img` as a source.
				candidates = pf.processSourceSet( picImg );

				if( picImg.srcset === undefined || picImg.hasAttribute( "sizes" ) ) {
					// Either `srcset` is completely unsupported, or we need to polyfill `sizes` functionality.
					pf._applyBestCandidate( candidates, picImg );
				} // Else, resolution-only `srcset` is supported natively.
			}
		}
	}

	/**
	 * Sets up picture polyfill by polling the document and running
	 * the polyfill every 250ms until the document is ready.
	 * Also attaches picturefill on resize
	 */
	function runPicturefill() {
		picturefill();
		var intervalId = setInterval( function(){
			// When the document has finished loading, stop checking for new images
			// https://github.com/ded/domready/blob/master/ready.js#L15
			w.picturefill();
			if ( /^loaded|^i|^c/.test( doc.readyState ) ) {
				clearInterval( intervalId );
				return;
			}
		}, 250 );
		if( w.addEventListener ){
			w.addEventListener( "resize", function() {
				w.picturefill( true );
			}, false );
		}
	}

	runPicturefill();

	/* expose methods for testing */
	picturefill._ = pf;

	/* expose picturefill */
	w.picturefill = picturefill;

} )( this, this.document );
