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

		ok( window.picturefill._.observer );

		ok( window.picturefill._.observer.start );

		ok( window.picturefill._.observer.stop );

		ok( window.picturefill._.observer.disconnect );

		ok( window.picturefill._.observer.observe );

		ok( window.picturefill.props );

		ok( window.picturefill.appendChild );

		ok( window.picturefill.html );

		ok( window.picturefill.insertBefore );

		ok( window.picturefill.removeChild );

	});

	var calledFill = 0;
	var createImgSpy = function( ) {
		var old = pf.fillImg;
		calledFill = 0;
		pf.fillImg = function() {
			calledFill++;
			return old.apply( this, arguments );
		};
	};

	var runFunctionalNewElementsTests = function( $dom ) {
		var $images = $dom.find( pf.selector );

		equal( $images.length, 6 );
		equal( calledFill, 6 * (window.MutationObserver ? 2 : 1) );

		$images.each(function() {
			ok( this[ pf.ns ]);
		});
	};

	asyncTest( "mutationobserver: functional integration test html", function() {
		var markup = $( "#template").html();
		var testDoms = [];
		createImgSpy();

		if ( window.MutationObserver ) {
			$("#mutation-fixture").html( markup );
			testDoms.push( $("#mutation-fixture") );
		}

		setTimeout(function() {
			picturefill.html( $("#picturefill-fixture")[0], markup );
			testDoms.push( $("#picturefill-fixture") );

			setTimeout(function() {
				$.each(testDoms, function( i, $dom ) {
					runFunctionalNewElementsTests( $dom );
				});
				start();
			}, 9);
		});
	});

	asyncTest( "mutationobserver: functional integration test append", function() {
		var markup = $( "#template").html();
		var testDoms = [];
		createImgSpy();

		if ( window.MutationObserver ) {
			$("#mutation-fixture").append( markup );
			testDoms.push( $("#mutation-fixture") );
		}

		setTimeout(function() {

			$( $.parseHTML(markup)).filter( "*").each(function() {
				picturefill.appendChild( $("#picturefill-fixture")[0], this );
			});
			testDoms.push( $("#picturefill-fixture") );

			setTimeout(function() {
				$.each(testDoms, function( i, $dom ) {
					runFunctionalNewElementsTests( $dom );
				});
				start();
			}, 9);
		});
	});
})( window, jQuery );
