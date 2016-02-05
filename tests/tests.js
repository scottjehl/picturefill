(function(window, jQuery) {
	// jscs:disable
	if(!window.picturefillCFG){
		window.picturefillCFG = [];
	}

	window.picturefillCFG.push(['uT', true]);

	var startTests = function() {
		var op = picturefill._;

		var saveCache = {};

		var forceElementParsing = function( element, options ) {
			if ( true || !element[ op.ns ] ) {
				element[ op.ns ] = {};
				op.parseSets( element, element.parentNode, options || {} );
			}
		};

		picturefill();

		// reset stubbing

		module( "method", {
			beforeEach: function() {
				var prop;
				op.setupRun({reevaluate: true});
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
		});

		asyncTest( "picturefill: global integration test", function() {

			op.DPR = 1;

			op.calcLength = function() {
				return 310;
			};
			var countedElements = 0;
			var polyfillElements = 10;
			var $srcsetImageW = $( "<img />" )
					.attr({
						srcset: "resources/medium.jpg 480w,\n resources/small.jpg  320w"
					})
					.prependTo("#qunit-fixture")
				;
			var $srcsetImageX = $( "<img />" )
					.attr({
						srcset: "resources/oneX.jpg 1x, resources/twoX.jpg 2x"
					})
					.prependTo("#qunit-fixture")
				;

			var $normalImg = $(".prop-check");

			window.picturefill();

			$( "img[srcset], picture > img" ).each( function() {
				if ( $(this).prop( op.ns ) ){
					countedElements++;
				}

				picturefill._.fillImg( this, {} );

				if ( $(this).prop( op.ns ) ) {
					countedElements++;
				}
			} );

			if ( window.HTMLPictureElement && op.supSrcset ) {
				equal( countedElements, 0, "picturefill is noop in supporting browsers");
			} else if ( !window.HTMLPictureElement && !op.supSrcset ) {
				equal( countedElements, polyfillElements * 2, "picturefill finds all elements and polyfills them");
			}

			if ( window.HTMLPictureElement ) {
				equal( $("picture > img" ).prop( op.ns ), undefined, "picturefill doesn't touch images in supporting browsers." );
			} else {

				ok( $("picture > img" ).prop( op.ns ), "picturefill modifies images in non-supporting browsers." );
			}

			if ( window.HTMLPictureElement || op.supSrcset ) {

				equal( ($srcsetImageX.prop( op.ns ) || { supported: true }).supported, true, "picturefill doesn't touch images in supporting browsers." );
				equal( $srcsetImageX.prop( "src" ), "", "picturefill doesn't touch image src in supporting browsers." );
				equal( imgGet.call( $srcsetImageX[0], "srcset" ), "resources/oneX.jpg 1x, resources/twoX.jpg 2x", "picturefill doesn't touch image srcset in supporting browsers." );

			} else {
				ok( $srcsetImageX.prop( op.ns ), "picturefill modifies images in non-supporting browsers." );
				equal( $srcsetImageX.prop( "src" ), op.makeUrl( "resources/oneX.jpg" ), "picturefill changes source of image1" );
			}

			if ( window.HTMLPictureElement || (op.supSrcset && op.supSizes) ) {
				equal( ($srcsetImageX.prop( op.ns ) || { supported: true }).supported, true, "picturefill doesn't touch images in supporting browsers." );
				equal( $srcsetImageW.prop( "src" ), "", "picturefill doesn't touch image sources in supporting browsers." );
			} else {
				ok( $srcsetImageW.prop( op.ns ), "picturefill modifies images in non-supporting browsers." );
				equal( $srcsetImageW.prop( "src" ), op.makeUrl( "resources/small.jpg" ), "picturefill changes source of image" );
			}

			equal( $normalImg.prop( op.ns ), undefined, "picturefill doesn't touch normal images in any browsers." );
			equal( $normalImg.prop( "src" ), op.makeUrl( "bar" ), "picturefill leaves src attribute of normal images untouched." );

			if ( !window.HTMLPictureElement ) {
				window.picturefill( { elements: $normalImg } );
				ok( $normalImg.prop( op.ns).supported, "picturefill doesn't touch normal images in any browsers too much even if it is called explicitly." );
				equal( $normalImg.prop( "src" ), op.makeUrl( "bar" ), "picturefill leaves src attribute of normal images untouched." );
			}
			op.DPR = 2;

			op.calcLength = function() {
				return 360;
			};

			window.picturefill( { reevaluate: true } );
			setTimeout(function(){
				if ( !op.supSizes ) {
					window.picturefill( { reevaluate: true } );


					if ( !op.supSrcset ) {
						equal( $srcsetImageX.prop( "src" ), op.makeUrl("resources/twoX.jpg"), "picturefill changes source of image" );
					}
					equal( $srcsetImageW.prop( "src" ), op.makeUrl( "resources/medium.jpg" ), "picturefill changes source of image" );
				}
				start();
			}, 99);
		});

		test("parseSets", function() {
			//forceElementParsing
			var $srcsetImageW = $( "<img />" )
					.attr({
						srcset: "medium.jpg 480w,\n small.jpg  320w",
						src: "normalw.jpg"
					})
					.prependTo("#qunit-fixture")
				;
			var $srcsetImageX = $( "<img />" )
					.attr({
						srcset: "twoX.jpg 2x, threeX.png 3x",
						src: "normalx.jpg"
					})
					.prependTo("#qunit-fixture")
				;
			var $source = $( document.createElement( "source" ) )
				.attr({
					srcset: "twoX.jpg 2x, threeX.png 3x",
					media: "(min-width: 800px)"
				});
			var $pictureSet = $( "<picture />" )
					.append( $source )
					.append("<img src='normal.jpg' />")
					.prependTo("#qunit-fixture")
				;

			$.each([
				{
					name: "srcset with w descriptor + additional src",
					elem: $srcsetImageW,
					sets: 1,
					candidates: [ 2 ]
				},
				{
					name: "picture srcset with x descriptor + additional src",
					elem: $srcsetImageX,
					sets: 1,
					candidates: [ 3 ]
				},
				{
					name: "picture srcset with x descriptor + additional src",
					elem: $pictureSet.find( "img" ),
					sets: 2,
					candidates: [ 2, 1 ]
				}
			], function(i, testData) {

				forceElementParsing( testData.elem[0] );
				var sets = testData.elem.prop( op.ns ).sets;
				equal( sets.length, testData.sets, "parseSets parses right amount of sets. " + testData.name );

				$.each( sets, function( i, set ) {
					op.parseSet( set );
					equal( set.cands.length, testData.candidates[ i ], "parseSets parses right amount of candidates inside a set. " + testData.name );
				} );

			});
		});

		test("calcLength", function() {

			op.u.em = 16;
			op.getEmValue = function() {
				return 16;
			};

			op.u.vw = 2;

			equal( op.calcLength("750px"), 750, "returns int value of width string" );
			equal( op.calcLength("calc(766px - 1em)"), 750, "calc(766px - 1em) returned `750px`. If `calc` is unsupported, the value was discarded and defaulted to `100vw`.");
			equal( op.calcLength("calc(160px / 1em * 1vw)"), 20, "calc(160px / 1em * 1vw)");
			equal( op.calcLength("calc(160px + 1em)"), 176, "calc(160px + 1em)");
			equal( op.calcLength("calc(160px + 1de)"), false, "calc(160px + 1de)");
		});

		test("calcListLength", function() {
			var width;
			var invalidSizes = "(min-width: 1px) 1002pysa, (min-width: 2px) -20px";
			var sizes = "	(max-width: 30em) 1000px,	(max-width: 50em) 750px, 500px	";

			op.matchesMedia = function(media) {
				return true;
			};

			width = op.calcListLength(sizes);

			equal(width, 1000, "returns 1000 when match media returns true");

			width = op.calcListLength(invalidSizes + ", (min-width: 2px) 10px");
			equal(width, 10, "iterates through until finds valid value");

			width = op.calcListLength(invalidSizes);
			equal(width, op.u.width, "if no valid size is given defaults to viewport width");

			op.matchesMedia = function(media) {
				return !media || false;
			};

			width = op.calcListLength(sizes);
			equal(width, 500, "returns 500 when match media returns false");

			op.matchesMedia = function(media) {
				return !media || media == "(max-width: 50em)";
			};
			width = op.calcListLength(sizes);
			equal(width, 750, "returns 750px when match media returns true on (max-width: 50em)");
		});

		test("parseSize", function() {
			var size1 = "";
			var expected1 = {
				length: null,
				media: null
			};
			deepEqual(op.parseSize(size1), expected1, "Length and Media are empty");

			var size2 = "( max-width: 50em ) 50%";
			var expected2 = {
				length: "50%",
				media: "( max-width: 50em )"
			};
			deepEqual(op.parseSize(size2), expected2, "Length and Media are properly parsed");

			var size3 = "(min-width:30em) calc(30% - 15px)";
			var expected3 = {
				length: "calc(30% - 15px)",
				media: "(min-width:30em)"
			};
			deepEqual(op.parseSize(size3), expected3, "Length and Media are properly parsed");
		});

		test("setRes", function() {
			var srcset, expected, sizes;
			// Basic test
			var runGetCandidate = function(candidate, sizes) {
				return $.map(op.setRes( { srcset: candidate, sizes: sizes || null } ), function( can ) {
					return {
						res: can.res,
						url: can.url
					};
				});
			};

			srcset = "images/pic-medium.png";
			expected = [
				{
					res: 1,
					url: "images/pic-medium.png"
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly");

			srcset = "images/pic-medium.png 1x";
			expected = [
				{
					res: 1,
					url: "images/pic-medium.png"
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "images/pic-medium.png, images/pic-medium-2x.png 2x";
			expected = [
				{
					res: 1,
					url: "images/pic-medium.png"
				},
				{
					res: 2,
					url: "images/pic-medium-2x.png"
				}
			];

			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "images/pic-medium.png 1x, images/pic-medium-2x.png 2x";
			expected = [
				{
					res: 1,
					url: "images/pic-medium.png"
				},
				{
					res: 2,
					url: "images/pic-medium-2x.png"
				}
			];

			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly");

			// Test with multiple spaces
			srcset = "			images/pic-medium.png		 1x		,		 images/pic-medium-2x.png		 2x		";
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			// Test with decimals
			srcset = "			images/pic-smallest.png		0.25x	,		images/pic-small.png		0.5x	, images/pic-medium.png 1x";
			expected = [
				{
					res: 0.25,
					url: "images/pic-smallest.png"
				},
				{
					res: 0.5,
					url: "images/pic-small.png"
				},
				{
					res: 1,
					url: "images/pic-medium.png"
				}
			];
			//deepEqual(runGetCandidate(srcset), expectedFormattedCandidates4, "`" + srcset + "` is parsed correctly" );

			// Test with "sizes" passed with a px length specified
			srcset = "			images/pic-smallest.png		 250w		,		 images/pic-small.png		 500w		, images/pic-medium.png 1000w";
			sizes = "1000px";
			deepEqual(runGetCandidate(srcset, sizes), expected, "`" + srcset + "` is parsed correctly");

			// Test with "sizes" passed with % lengths specified
			srcset = "\npic320.png 320w	, pic640.png		640w, pic768.png 768w, \
			\npic1536.png 1536w, pic2048.png	2048w	";
			sizes = "	(max-width: 30em) 100%,	(max-width: 50em) 50%, 33%";
			expected = [
				{
					res: 0.5,
					url: "pic320.png"
				},
				{
					res: 1,
					url: "pic640.png"
				},
				{
					res: 1.2,
					url: "pic768.png"
				},
				{
					res: 2.4,
					url: "pic1536.png"
				},
				{
					res: 3.2,
					url: "pic2048.png"
				}
			];

			op.calcLength = function() {
				return 640;
			};

			op.matchesMedia = function() {
				return true;
			};

			deepEqual(runGetCandidate(srcset, sizes), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "foo,bar.png 320w, bar,baz.png 320w, ";
			expected = [
				{
					url: "foo,bar.png",
					res: 0.5
				},{
					url: "bar,baz.png",
					res: 0.5
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "foo,bar.png 320w,bar,baz.png 320w";
			expected = [
				{
					url: "foo,bar.png",
					res: 0.5
				},{
					url: "bar,baz.png",
					res: 0.5
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "foo.png 1x, bar.png -2x";
			expected = [
				{
					url: "foo.png",
					res: 1
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "foo.png 1x, bar.png 2q";
			expected = [
				{
					url: "foo.png",
					res: 1
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg 1x, bar.png 2x";
			expected = [
				{
					url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
					res: 1
				},{
					url: "bar.png",
					res: 2
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "2.png 1x,1.png 2x";
			expected = [
				{
					url: "2.png",
					res: 1
				},{
					url: "1.png",
					res: 2
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg 2x, 1x.gif 1x, data:image/png;base64,iVBORw0KGgoAAAANSUhEUg";
			expected = [
				{
					url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
					res: 2
				},{
					url: "1x.gif",
					res: 1
				},{
					url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
					res: 1
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "400.gif 400w, 6000.gif 6000w";
			expected = [
				{
					url: "400.gif",
					res: 0.625
				},{
					url: "6000.gif",
					res: 9.375
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "1200.gif 2x, 1600.gif 1600w, 800.jpg 800w 400h,800a.jpg 400h 800w";
			expected = [
				{
					url: "1200.gif",
					res: 2
				},{
					url: "1600.gif",
					res: 2.5
				},{
					url: "800.jpg",
					res: 1.25
				},{
					url: "800a.jpg",
					res: 1.25
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "1x,,  ,   x    ,2x	, 1x.gif, , 3x, 4x.gif 4x 100w,,, 5x.gif 5, dx.gif dx, 2x.gif   2x,";
			expected = [
				{
					url: "1x",
					res: 1
				},{
					url: "x",
					res: 1
				},{
					url: "2x",
					res: 1
				},{
					url: "1x.gif",
					res: 1
				},{
					url: "3x",
					res: 1
				},{
					url: "2x.gif",
					res: 2
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = ",,,,foo.png 1x, ,,,,,bar 2x, , ,bar2 3x";
			expected = [
				{
					url: "foo.png",
					res: 1
				},
				{
					url: "bar",
					res: 2
				},
				{
					url: "bar2", //why not ,bar2?
					res: 3
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			op.calcLength = function() {
				return 100;
			};

			/*
			srcset = "foo.png 2e2w, bar.jpg 1e2w";
			expected = [
				{
					url: "foo.png",
					res: 2
				},
				{
					url: "bar.jpg",
					res: 1
				}
			];
			deepEqual(runGetCandidate(srcset), expected, "`" + srcset + "` is parsed correctly" );
			*/
		});

		test( "op.mMQ", function() {
			op.u.width = 480;
			op.u.em = 2;
			op.getEmValue = function() {
				return 2;
			};

			ok( op.mMQ( "(min-width: 480px)" ) );
			ok( !op.mMQ( "(min-width: 481px)" ) );
			ok( op.mMQ( "(min-width: 479px)" ) );

			ok( op.mMQ( "(max-width: 480px)" ) );
			ok( op.mMQ( "(max-width: 481px)" ) );
			ok( !op.mMQ( "(max-width: 479px)" ) );

			ok( !op.mMQ( "(orientation: landscape)" ) );

			ok( op.mMQ( "(min-width: 240em)" ) );
			ok( !op.mMQ( "(min-width: 241em)" ) );
			ok( op.mMQ( "(min-width: 239em)" ) );

			ok( op.mMQ( "(max-width: 240em)" ) );
			ok( op.mMQ( "(max-width: 241em)" ) );
			ok( !op.mMQ( "(max-width: 239em)" ) );

			ok( !op.mMQ( "(min-width: 240ups)" ) );

		} );

		test("supportsType", function() {
			expect( 5 );

			// Test widely supported mime types.
			ok( op.supportsType( "image/jpeg" ) );

			ok( op.supportsType( "image/png" ) );

			ok( op.supportsType( "image/gif" ) );

			// if the type attribute is supported it should return true
			ok( op.supportsType( "" ) );

			// if the type attribute is supported it should return true
			ok( op.supportsType( null ) );
		});

		test("applySetCandidate", function() {
			var image, candidates;

			var fullPath = op.makeUrl("foo300");

			candidates = [
				{ res: 100, url: "foo100", set: {}, desc: {} },
				{ res: 200, url: "foo200", set: {}, desc: {} },
				{ res: 300, url: "foo300", set: {}, desc: {} }
			];

			image = document.createElement("img");

			image [op.ns ] = {};

			op.DPR = 300;

			op.applySetCandidate( candidates, image );

			equal(op.makeUrl( image.src ), op.makeUrl( candidates[2].url ), "uses the url from the best px fit" );

			image.src = fullPath;
			image [op.ns ].curSrc = fullPath;

			op.applySetCandidate( candidates, image );

			deepEqual(image.src, fullPath, "src left alone when matched" );

		});

		test("getSet returns the first matching `source`", function() {
			var img = $( ".first-match" )[ 0 ];
			var firstsource = img.parentNode.getElementsByTagName( "source" )[ 0 ];

			forceElementParsing( img );

			equal( op.getSet( img ).srcset, firstsource.getAttribute( "srcset" ) );
		});

		test( "getSet returns 'pending' when a source type is pending", function() {
			var img = $(".pending-check")[0];
			op.types["foo"] = "pending";

			forceElementParsing( img );

			equal( op.getSet( img ), "pending", "pending type should be false" );
		});

		test( "getSet returns source when it matches the media", function() {
			var img = $( ".match-check ")[ 0 ];
			var $source = $(img).closest( "picture").find('source');
			op.matchesMedia = function() {
				return true;
			};

			forceElementParsing( img );

			//IE11 in IE9 mode
			if($source.length){
				equal( op.getSet( img ).srcset, $source.attr( "srcset" ) );
			} else {
				ok(true);
			}
		});

		test( "getMatch returns false when no match is found", function() {
			op.matchesMedia = function( media ) {
				return !media || false;
			};

			var img = $( ".no-match-check ")[0];

			forceElementParsing( img );

			equal( op.getSet( img ), false );
		});

		test( "getSet returns false when no srcset is found", function() {
			var img = $( ".no-srcset-check ")[0];

			forceElementParsing( img );

			equal( op.getSet( img ), false );
		});

		test( "picturefill marks elements with a property", function() {
			// NOTE requires at least one child image for the propery to be set
			var mockPicture = $( ".prop-check" )[0];

			// make sure there are candidates to consider
			op.processSourceSet = function() {
				return [ { url: "foo" } ];
			};

			picturefill({ reevaluate: false, elements: [ mockPicture ] });
			if ( !window.HTMLPictureElement ) {
				ok( mockPicture[ op.ns ].evaled );
			} else {
				ok( !mockPicture[ op.ns ] );
			}
		});

		test( "`img` with `sizes` but no `srcset` shouldn’t fail silently", function() {
			expect( 0 );
			var el = document.createElement( "img" );

			el.setAttribute( "sizes", "100vw" );
			el.setAttribute( "class", "no-src" );

			jQuery( "#qunit-fixture" ).append( el );

			try { picturefill({ reevaluate: false, elements: jQuery( ".no-src" ) }); } catch (e) { console.log( e ); ok( false ); }
		});

		asyncTest( "`img` can be added outside the DOM without errors", function() {
			var timer;
			var img = document.createElement( "img" );
			var runTest = function(){
				if ('currentSrc' in img || !op.supSizes){
					equal( img.currentSrc || img.src, "data:img" );
				} else {
					equal( img.srcset, "data:img 500w" );
				}
				start();
				img.onload = null;
				img.onerror = null;
				clearTimeout(timer);
			};

			timer = setTimeout(runTest, 99);
			img.onload = runTest;
			img.onerror = runTest;
			img.setAttribute( "srcset", "data:img 500w" );
			picturefill( { elements: [ img ] } );

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
