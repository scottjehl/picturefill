/*! Picturefill - Responsive Images that work today. (and mimic the proposed Picture element with span elements). Author: Scott Jehl, Filament Group, 2012 | License: MIT/GPLv2 */

(function( w ){

	// Enable strict mode
	"use strict";

	// Configuration: set any options before loading picturefill.js
	var c = w.picturefillConfig = w.picturefillConfig || {};
	c.onresize = typeof c.onresize == 'undefined' ? true : c.onresize;
	c.onready = typeof c.onready == 'undefined' ? true : c.onready;
	c.onload = typeof c.onload == 'undefined' ? true : c.onload;

	w.picturefill = function() {
		var ps = w.document.getElementsByTagName( "span" );

		// Loop the pictures
		for( var i = 0, il = ps.length; i < il; i++ ){
			if( ps[ i ].getAttribute( "data-picture" ) !== null ){

				var sources = ps[ i ].getElementsByTagName( "span" ),
					matches = [];

				// See if which sources match
				for( var j = 0, jl = sources.length; j < jl; j++ ){
					var media = sources[ j ].getAttribute( "data-media" );
					// if there's no media specified, OR w.matchMedia is supported 
					if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){
						matches.push( sources[ j ] );
					}
				}

			// Find any existing img element in the picture element
			var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];

			if( matches.length ){
				var matchedEl = matches.pop();
				if( !picImg ){
					picImg = w.document.createElement( "img" );
					picImg.alt = ps[ i ].getAttribute( "data-alt" );
				}

				picImg.src =  matchedEl.getAttribute( "data-src" );
				matchedEl.appendChild( picImg );
			}
			else if( picImg ){
				picImg.parentNode.removeChild( picImg );
			}
		}
		}
	};

	// Run on resize and domready (w.load as a fallback)
	if( w.addEventListener ){
		if (w.picturefillConfig.onresize) {
			w.addEventListener( "resize", w.picturefill, false );
		}
		if (w.picturefillConfig.onready) {
			w.addEventListener( "DOMContentLoaded", function(){
				w.picturefill();
				// Run once only
				w.removeEventListener( "load", w.picturefill, false );
			}, false );
		}
		if (w.picturefillConfig.onload) {
			w.addEventListener( "load", w.picturefill, false );
		}
	}
	else if( w.attachEvent ){
		if (w.picturefillConfig.onload || w.picturefillConfig.onready) {
			w.attachEvent( "onload", w.picturefill );
		}
	}

}( this ));