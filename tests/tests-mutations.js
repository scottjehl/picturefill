(function(window, jQuery) {

	var pf = picturefill._;

	var saveCache = {};

	// reset stubbing

	module( "method", {
		setup: function() {
			var prop;
			for ( prop in pf ) {
				if ( pf.hasOwnProperty( prop ) ) {
					saveCache[ prop ] = pf[ prop ];
				}
			}
		},

		teardown: function() {
			var prop;
			for ( prop in saveCache ) {
				if ( pf.hasOwnProperty(prop) && saveCache[prop] != pf[ prop ] ) {
					pf[prop] = saveCache[prop];
				}
			}
		}
	});

	test( "picturefill: Picture fill is loaded and has its API ready", function() {
		ok( window.picturefill );

		ok( window.picturefill._ );

		ok( window.picturefill._.fillImg );

		ok( window.picturefill._.fillImgs );
	});

})( window, jQuery );
