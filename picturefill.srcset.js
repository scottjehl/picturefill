(function( w ){

	"use strict";

	w.picturefill.srcset = function( match ) {
		var supported = "srcset" in document.createElement( "img" ),
			srcset = match.getAttribute( "data-srcset" ),
			screenRes = w.devicePixelRatio || 1,
			retRes = 1,
			ret;

		w.picturefill.srcset.supported = supported;

		if( srcset ) {
			if( supported ) {
				return srcset;
			}

			var sources = srcset.split( "," ); // Split comma-separated `srcset` sources into an array.

			for( var res = sources.length, r = res - 1; r >= 0; r-- ) { // Loop through each source/resolution in `srcset`.
				var source = sources[ r ].replace( /^\s*/, '' ).replace( /\s*$/, '' ).split( " " ), // Remove any leading whitespace, split on spaces.
					resMatch = parseFloat( source[ 1 ], 10 ); // Parse out the resolution for each source in `srcset`.

				if( resMatch >= screenRes && ( resMatch <= retRes || retRes == 1 ) ) {
					ret = source[ 0 ];
					retRes = resMatch;
				}
			}
			return ret;
		}
	};


}( this ));