/*! Picturefill - Author: Scott Jehl, 2012 | License: MIT/GPLv2 */
/*
	Picturefill: A polyfill for proposed behavior of the picture element, which does not yet exist, but should. :)
	* Notes: 
		* For active discussion of the picture element, see http://www.w3.org/community/respimg/
		* While this code does work, it is intended to be used only for example purposes until either:
			A) A W3C Candidate Recommendation for <picture> is released
			B) A major browser implements <picture>
*/ 
(function( w ){
	
	// Enable strict mode
	"use strict";
	
	// Test if `<picture>` is supported natively, if so, exit - no polyfill needed.
	if ( !!( w.document.createElement( "picture" ) && w.document.createElement( "source" ) && w.HTMLPictureElement ) ){
		return;
	}
	
	w.picturefill = function() {
		var ps = w.document.getElementsByTagName( "picture" );
		
		// Loop the pictures
		for( var i = 0, il = ps.length; i < il; i++ ){
			var sources = ps[ i ].getElementsByTagName( "source" ),
				matches = [];

			// If no sources are found, they're likely erased from the DOM. Try finding them inside comments.
			if( !sources.length ){
				var picText =  ps[ i ].innerHTML,
					frag = w.document.createElement( "div" ),
					// For IE9, convert the source elements to divs
					srcs = picText.replace( /(<)source([^>]+>)/gmi, "$1div$2" ).match( /<div[^>]+>/gmi );
				
				frag.innerHTML = srcs.join( "" );
				sources = frag.getElementsByTagName( "div" );
			}
			
			// See if which sources match
			for( var j = 0, jl = sources.length; j < jl; j++ ){
				var media = sources[ j ].getAttribute( "media" );
				// if there's no media specified, OR w.matchMedia is supported 
				if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){
					matches.push( sources[ j ] );
				}
			}
			
			// Find any existing img element in the picture element
			var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];
			
			if( matches.length ){
				// Grab the most appropriate (last) match.
				var match = matches.pop(),
					srcset = match.getAttribute( "srcset" );

				if( !picImg ){
					picImg = w.document.createElement( "img" );
					picImg.alt = ps[ i ].getAttribute( "alt" );
					ps[ i ].appendChild( picImg );
				}

				if( srcset ) {
						var screenRes = w.devicePixelRatio || 1, // Is it worth looping through reasonable matchMedia values here?
							sources = srcset.split(","); // Split comma-separated `srcset` sources into an array.

						for( var res = sources.length, r = res - 1; r >= 0; r-- ) { // Loop through each source/resolution in `srcset`.
							var source = sources[ r ].replace(/^\s*/, '').replace(/\s*$/, '').split(" "), // Remove any leading whitespace, then split on spaces.
								resMatch = parseFloat( source[1], 10 ); // Parse out the resolution for each source in `srcset`.

							if( screenRes >= resMatch ) {
								if( picImg.getAttribute( "src" ) !== source[0] ) {
									var newImg = document.createElement("img");

									newImg.src = source[0];
									// When the image is loaded, set a width equal to that of the original’s intrinsic width divided by the screen resolution:
									newImg.onload = function() {
										// Clone the original image into memory so the width is unaffected by page styles:
										this.width = ( this.cloneNode( true ).width / resMatch );
									}
									picImg.parentNode.replaceChild( newImg, picImg );
								}
								break; // We’ve matched, so bail out of the loop here.
							}
						}
				} else {
					// No `srcset` in play, so just use the `src` value:
					picImg.src = match.getAttribute( "src" );
				}
			}
			else if( picImg ) {
				ps[ i ].removeChild( picImg );
			}
		}
	};
	
	// Run on resize and domready (w.load as a fallback)
	if( w.addEventListener ){
		w.addEventListener( "resize", w.picturefill, false );
		w.addEventListener( "DOMContentLoaded", function(){
			w.picturefill();
			// Run once only
			w.removeEventListener( "load", w.picturefill, false );
		}, false );
		w.addEventListener( "load", w.picturefill, false );
	}
	else if( w.attachEvent ){
		w.attachEvent( "onload", w.picturefill );
	}
	
})( this );