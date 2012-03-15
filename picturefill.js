/*
	Picturefill - a crude polyfill for proposed behavior of the picture element, which does not yet exist, but should. :)
	* Author: Scott Jehl, 2012
	* License: MIT/GPLv2
	* Notes: 
	  * For active discussion of the picture element, see http://www.w3.org/community/respimg/
	  * While this code does work, it is intended to be used only for example purposes until either:
		A) A W3C Candidate Recommendation for <picture> is released
		B) A major browser implements <picture>
*/ 
(function( w ){
	
	// requires media query supporting browser with matchMedia support (polyfill available)
	if( !w.matchMedia || !w.matchMedia( "only all" ) ){
		return;
	}
	
	w.picturefill = function(){
		var ps = w.document.getElementsByTagName( "picture" );
		
		// Loop the pictures
		for( var i = 0, il = ps.length; i < il; i++ ){
			var sources = ps[ i ].getElementsByTagName( "source" ),
				matches = [];
				
			// See if which sources match	
			for( var j = 0, jl = sources.length; j < jl; j++ ){
				var media = sources[ j ].getAttribute( "media" );
				if( !media || w.matchMedia( media ).matches ){
					matches.push( sources[ j ] );
				}
			}

			// Set fallback img element src from that of last matching source element
			if( matches.length ){
				var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];
				if( !picImg ){
					picImg = w.document.createElement( "img" );
					picImg.alt = ps[ i ].getAttribute( "alt" );
					ps[ i ].appendChild( picImg );
				}
				picImg.src =  matches.pop().getAttribute( "src" );
			}
		}
	}
	
	// Run on resize
	if( w.addEventListener ){
		w.addEventListener( "resize", picturefill, false );
	}
	
	// Run when DOM is ready
	picturefill();
	
})( this );
