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
			
				if( !picImg ){
					picImg = w.document.createElement( "img" );
					picImg.alt = ps[ i ].getAttribute( "alt" );
					ps[ i ].appendChild( picImg );
				}
				
				picImg.src =  matches.pop().getAttribute( "src" );
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