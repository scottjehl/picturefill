/*! Picturefill - Author: Scott Jehl, 2012 | License: MIT/GPLv2 */
/*
	Picturefill: user preference switcher extension for HD
*/ 
(function( w ){
	
	// Enable strict mode
	"use strict";
	
	// User preference for HD content when available
	var prefHD = false || w.localStorage && w.localStorage[ "picturefill-prefHD" ] === "true";

	w.picturefill = function() {
		var ps = w.document.getElementsByTagName( "div" );
				
		// Loop the pictures
		for( var i = 0, il = ps.length; i < il; i++ ){
			if( ps[ i ].getAttribute( "data-picture" ) !== null ){

				var sources = ps[ i ].getElementsByTagName( "div" ),
					matches = [],
					hasHD = false;
			
				// See if which sources match
				for( var j = 0, jl = sources.length; j < jl; j++ ){
					var media = sources[ j ].getAttribute( "data-media" );
					// if there's no media specified, OR w.matchMedia is supported 
					if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){
						if( media && media.indexOf( "min-device-pixel-ratio" ) > -1  ){
							hasHD = true;
							if( prefHD ){
								matches.push( sources[ j ] );								
							}
						}
						else {
							matches.push( sources[ j ] );
						}
					}
				}
			
				var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];
				
				if( matches.length ){
					
					if( !picImg ){
						picImg = w.document.createElement( "img" );
						picImg.alt = ps[ i ].getAttribute( "data-alt" );
						ps[ i ].appendChild( picImg );
					}
					picImg.src = matches.pop().getAttribute( "data-src" );

					if( hasHD ){
						
						var prevSwitch = ps[ i ].getElementsByTagName( "a" )[ 0 ],
							picSwitch = w.document.createElement( "a" );
						
						if( prevSwitch ){
							ps [ i ].removeChild( prevSwitch );
						}
						
						picSwitch.href = "#";
						picSwitch.innerHTML = ( prefHD ? "S" : "H" ) + "D";
						picSwitch.title = "Switch image to " + ( prefHD ? "Standard" : "High" ) + "Definition";
						picSwitch.className = "pf-pref pf-pref-" + ( prefHD ? "standard" : "high" );
						ps[ i ].appendChild( picSwitch );
						picSwitch.onmouseup = function(){
							prefHD = !prefHD;
							if( w.localStorage ){
								w.localStorage[ "picturefill-prefHD" ] = prefHD; 
							}
							w.picturefill();
							return false;
						};
					}
					
				}
				else if( picImg ){
					ps[ i ].removeChild( picImg );
				}
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