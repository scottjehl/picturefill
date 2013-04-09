/*! Picturefill - Responsive Images that work today. (and mimic the proposed Picture element with divs). Author: Scott Jehl, Filament Group, 2012 | License: MIT/GPLv2 */

(function( w ){
	
	// Enable strict mode
	"use strict";

	w.picturefill = function() {
		var ps = [],
			psTemp;
		
		if (w.querySelectorAll) {
			ps = w.querySelectorAll( "div[data-picture]" );
		}
		else {
			psTemp = w.document.getElementsByTagName( "div" );
			for( var i = 0, il = psTemp.length; i < il; i++ ){
				if( psTemp[ i ].getAttribute( "data-picture" ) !== null ){
					ps.push(psTemp[ i ])
				}
			}
			psTemp = null;
		}
		
		// Loop the pictures
		for( var i = 0, il = ps.length; i < il; i++ ){

			var sources = ps[ i ].getElementsByTagName( "div" ),
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
				if( !picImg ){
					picImg = w.document.createElement( "img" );
					picImg.alt = ps[ i ].getAttribute( "data-alt" );
					ps[ i ].appendChild( picImg );
				}
				
				picImg.src =  matches.pop().getAttribute( "data-src" );
			}
			else if( picImg ){
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
	
}( this ));
