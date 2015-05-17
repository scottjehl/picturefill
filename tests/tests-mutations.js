(function(window, $) {
	// jscs:disable
	if(!window.picturefillCFG){
		window.picturefillCFG = [];
	}

	window.picturefillCFG.push(['uT', true]);

	var startTests = function() {
		var op = picturefill._;

		var saveCache = {};

		if(picturefill.config){
			picturefill.config("uT", true);
		}


		// reset stubbing

		module( "method", {
			beforeEach: function() {
				var prop;

				for ( prop in op ) {
					if ( op.hasOwnProperty( prop ) ) {
						if($.isPlainObject(op[ prop ])){
							saveCache[ prop ] = $.extend(true, {}, op[ prop ]);
						} else {
							saveCache[ prop ] = op[ prop ];
						}
					}
				}
			},

			afterEach: function() {
				var prop;
				for ( prop in saveCache ) {
					if ( op.hasOwnProperty(prop) && (prop in saveCache) && saveCache[prop] != op[ prop ] ) {
						if($.isPlainObject(op[ prop ]) && $.isPlainObject(saveCache[prop])){
							$.extend(true, op[prop], saveCache[prop]);
						} else {
							op[prop] = saveCache[prop];
						}
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

		});

		if ( !op.mutationSupport || window.HTMLPictureElement ) {
			return;
		}

		var calledFill = 0;
		var createImgSpy = function( ) {
			var old = op.fillImg;
			calledFill = 0;
			op.fillImg = function() {
				calledFill++;
				return old.apply( this, arguments );
			};
		};

		var runFunctionalNewElementsTests = function( $dom ) {
			var $images = $dom.find( op.sel );

			equal( $images.length, 6 );
			equal( calledFill, 6 );

			$images.each(function() {
				ok( this[ op.ns ]);
			});
		};

		asyncTest( "mutationobserver: functional integration test html", function() {
			var markup = $( "#template").html();

			createImgSpy();

			$("#mutation-fixture").html( markup );

			setTimeout(function() {
				runFunctionalNewElementsTests( $("#mutation-fixture") );
				start();
			}, 9);
		});

		asyncTest( "mutationobserver: changing sizes recalculates candidate", function() {
			var $img = $( "<img sizes='10px' srcset='small.jpg 30w, medium.jpg 99w' />");



			$("#mutation-fixture").append( $img );

			setTimeout(function() {
				var oldCurSrc = $img.prop('currentSrc');
				var oldSrc = $img.prop('src');

				$img.attr('sizes', '100px');

				setTimeout(function(){
					ok(oldCurSrc.indexOf('small.jpg') != -1);
					ok(oldSrc.indexOf('small.jpg') != -1);
					ok($img.prop('currentSrc').indexOf('medium.jpg') != -1);
					ok($img.prop('src').indexOf('medium.jpg') != -1);

					start();
				}, 9);
			}, 9);
		});

		asyncTest( "mutationobserver: functional integration test append", function() {
			var markup = $( "#template").html();

			createImgSpy();

			$("#mutation-fixture").append( markup );

			setTimeout(function() {
				runFunctionalNewElementsTests( $("#mutation-fixture") );
				start();
			}, 9);
		});
	};

	if( window.blanket ) {
		blanket.beforeStartTestRunner({
			callback: function() {
				setTimeout(startTests, QUnit.urlParams.coverage ? 500 : 0); //if blanketjs fails set a higher timeout
			}
		});
	} else {
		startTests();
	}

})( window, jQuery );
