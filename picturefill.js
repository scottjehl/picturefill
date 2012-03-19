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
	var document = w.document;
	
	// Test if `<picture>` is supported natively. Store the boolean result for
	// later use.
	var hasNativePicture = !!(
		document.createElement('picture') && w.HTMLPictureElement
	);
	
	var matchMedia = w.matchMedia;
	
	// Exit early if `<picture>` is natively supported.
	// If neither `<picture>` **or** `window.matchMedia is supported, exit
	// as well -- we need `matchMedia` to be able to properly polyfill this
	// feature. **Note**: there is a polyfill available for `matchMedia`:
	// <https://github.com/paulirish/matchMedia.js/>
	if ( hasNativePicture || !matchMedia || !matchMedia('only all') ) return;

    // Test if matchMedia is support, store the boolean result for later use.
    var matchMediaSupport = window.matchMedia("(min-width: 0px)").matches;

    // Add matchMedia basic regex support
    // TODO add max-width and em support
    w.matchMediaRegex = function ( media ) {
        var patt_min_width = new RegExp('min-width: [0-9]+px');
        var patt_min_width_value = new RegExp("[0-9]+");
        return document.documentElement.clientWidth > patt_min_width_value.exec( patt_min_width.exec( media ) );
    }

	w.picturefill = function(){
		var ps = document.getElementsByTagName( "picture" );

		// Loop the pictures
		for( var i = 0, il = ps.length; i < il; i++ ){
			var sources = ps[ i ].getElementsByTagName( "source" ),
				matches = [];
				
			// See if which sources match	
			for( var j = 0, jl = sources.length; j < jl; j++ ){
				var media = sources[ j ].getAttribute( "media" );
                if( !media || matchMedia( media ).matches || ( !matchMediaSupport && w.matchMediaRegex( media ) ) ) {
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
	};

	// Run on resize
	if( w.addEventListener ){
		w.addEventListener( "resize", picturefill, false );
	}
	
	// Run when DOM is ready
	picturefill();
	
})( this );
