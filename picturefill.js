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
	var document = w.document,
		Modernizr = w.Modernizr;
	
	// Test if `<picture>` is supported natively. Store the boolean result for
	// later use.
	var hasNativePicture = !!(
		document.createElement('picture') && window.HTMLPictureElement
	);
	
	// Register a Modernizr test for `<picture>`, if Modernizr is present.
	// Modernizr is NOT required -- this just augments it if present.
	// 
	// If you have support for Modernizr classes in your build, this will also
	// give you a handy `.picture` or `.no-picture` class on the `html` element.
	if (Modernizr) Modernizr.addTest('picture', function () {
		return hasNativePicture;
	});
	
	// Exit early if `<picture>` is natively supported.
	if (hasNativePicture) return;
	
	var matchMedia = w.matchMedia;

	// A wrapper for `window.matchMedia` that gives us a consistent interface
	// whether we are using `Modernizr.mq` or `matchMedia`.
	var mqWrapper = function (query) {
		return matchMedia(query).matches;
	};
	
	// Pick a media query function. If Modernizr is installed with the media
	// query extension, use it; otherwise, use `window.matchMedia` wrapper
	// defined above.
	var mq = Modernizr && Modernizr.mq ?
		Modernizr.mq :
		(matchMedia && matchMedia( "only all" ) ? mqWrapper : null);
	
	// Exit early if:
	//
	// * Browser supports `<picture>`
	// * Browser does not support either `<picture>`,
	//   or Media Queries, or Modernizr-shimmed media queries.
	if( !mq ) return;
	
	w.picturefill = function(){
		var ps = document.getElementsByTagName( "picture" );
		
		// Loop the pictures
		for( var i = 0, il = ps.length; i < il; i++ ){
			var sources = ps[ i ].getElementsByTagName( "source" ),
				matches = [];
				
			// See if which sources match	
			for( var j = 0, jl = sources.length; j < jl; j++ ){
				var media = sources[ j ].getAttribute( "media" );
				if( !media || mq( media ) ){
					matches.push( sources[ j ] );
				}
			}

			// Set fallback img element src from that of last matching source element
			if( matches.length ){
				ps[ i ].getElementsByTagName( "img" )[ 0 ].src =  matches.pop().getAttribute( "src" );
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