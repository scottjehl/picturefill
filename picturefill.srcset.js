(function( w ){

	"use strict";

	w.picturefill.srcset = function( match ) {
		var supported = "srcset" in document.createElement( "img" ),
			srcset = match.getAttribute( "data-srcset" ),
			screenRes = w.devicePixelRatio || 1,
			retRes = 1,
			ret;

		w.picturefill.srcset.supported = supported;

		function loopSources( sources, screenRes ) {
			for( var res = sources.length, r = res - 1; r >= 0; r-- ) { // Loop through each source/resolution in `srcset`.
				var source = sources[ r ].replace( /^\s*/, '' ).replace( /\s*$/, '' ).split( " " ), // Remove any leading whitespace, split on spaces.
					resMatch = parseFloat( source[ 1 ], 10 ); // Parse out the resolution for each source in `srcset`.

				if( resMatch >= screenRes && ( resMatch <= retRes || retRes == 1 ) ) {
					ret = source[ 0 ];
					retRes = resMatch;
				}
			}
		}

		if( srcset ) {
			if( supported ) {
				return srcset;
			}

			var sources = srcset.split( "," ); // Split comma-separated `srcset` sources into an array.
			loopSources( sources, screenRes );

			// If there’s no result, the official algorithm *may* end up using the smallest source. I’m not sure we want that here.
			/*
			if( !ret ) {
				loopSources( sources, 0 );
			}
			*/
			return ret;
		}
	};


}( this ));