(function(window, jQuery) {

	var pf = picturefill._;
	var currentSrcSupported = "currentSrc" in document.createElement("img");

	var saveCache = {};

	var forceElementParsing = function( element, options ) {
		if ( true || !element[ pf.ns ] ) {
			element[ pf.ns ] = {};
			pf.parseSets( element, element.parentNode, options || {} );
		}
	};

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

	test( "picturefill: global integration test", function() {

		pf.DPR = 1;

		pf.calcLength = function() {
			return 310;
		};
		var countedElements = 0;
		var polyfillElements = 10;
		var $srcsetImageW = $( "<img />" )
			.attr({
				srcset: "medium.jpg 480w,\n small.jpg  320w"
			})
			.prependTo("#qunit-fixture")
		;
		var $srcsetImageX = $( "<img />" )
			.attr({
				srcset: "oneX.jpg 1x, twoX.jpg 2x"
			})
			.prependTo("#qunit-fixture")
		;

		var $normalImg = $(".prop-check");

		window.picturefill();

		$( "img[srcset], picture > img" ).each( function() {
			if ( $(this).prop( pf.ns ) ){
				countedElements++;
			}

			picturefill._.fillImg( this, {} );

			if ( $(this).prop( pf.ns ) ) {
				countedElements++;
			}
		} );

		if ( window.HTMLPictureElement && pf.srcsetSupported ) {
			equal( countedElements, 0, "Picturefill is noop in supporting browsers");
		} else if ( !window.HTMLPictureElement && !pf.srcsetSupported ) {
			equal( countedElements, polyfillElements * 2, "Picturefill finds all elements and polyfills them");
		}

		if ( window.HTMLPictureElement ) {
			equal( $("picture > img" ).prop( pf.ns ), undefined, "Picturefill doesn't touch images in supporting browsers." );
		} else {

			ok( $("picture > img" ).prop( pf.ns ), "Picturefill modifies images in non-supporting browsers." );
		}

		if ( window.HTMLPictureElement || pf.srcsetSupported ) {

			equal( ($srcsetImageX.prop( pf.ns ) || { supported: true }).supported, true, "Picturefill doesn't touch images in supporting browsers." );
			equal( $srcsetImageX.prop( "src" ), "", "Picturefill doesn't touch image src in supporting browsers." );
			equal( $srcsetImageX.attr( "srcset" ), "oneX.jpg 1x, twoX.jpg 2x", "Picturefill doesn't touch image srcset in supporting browsers." );

		} else {
			ok( $srcsetImageX.prop( pf.ns ), "Picturefill modifies images in non-supporting browsers." );
			equal( $srcsetImageX.prop( "src" ), pf.makeUrl( "oneX.jpg" ), "Picturefill changes source of image" );
		}

		if ( window.HTMLPictureElement || (pf.srcsetSupported && pf.sizesSupported) ) {
			equal( $srcsetImageW.prop( pf.ns ), undefined, "Picturefill doesn't touch images in supporting browsers." );
			equal( $srcsetImageW.prop( "src" ), "", "Picturefill doesn't touch image sources in supporting browsers." );
		} else {
			ok( $srcsetImageW.prop( pf.ns ), "Picturefill modifies images in non-supporting browsers." );
			equal( $srcsetImageW.prop( "src" ), pf.makeUrl( "small.jpg" ), "Picturefill changes source of image" );
		}

		equal( $normalImg.prop( pf.ns ), undefined, "Picturefill doesn't touch normal images in any browsers." );
		equal( $normalImg.prop( "src" ), pf.makeUrl( "bar" ), "Picturefill leaves src attribute of normal images untouched." );

		if ( !window.HTMLPictureElement ) {
			window.picturefill( { elements: $normalImg } );
			ok( $normalImg.prop( pf.ns).supported, "Picturefill doesn't touch normal images in any browsers too much even if it is called explicitly." );
			equal( $normalImg.prop( "src" ), pf.makeUrl( "bar" ), "Picturefill leaves src attribute of normal images untouched." );
		}

		if ( !pf.sizesSupported ) {
			pf.DPR = 2;

			pf.calcLength = function() {
				return 360;
			};

			window.picturefill( { reevaluate: true } );

			if ( !pf.srcsetSupported ) {
				equal( $srcsetImageX.prop( "src" ), pf.makeUrl("twoX.jpg"), "Picturefill changes source of image" );
			}
			equal( $srcsetImageW.prop( "src" ), pf.makeUrl( "medium.jpg" ), "Picturefill changes source of image" );
		}
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
			var sets = testData.elem.prop( pf.ns ).sets;
			equal( sets.length, testData.sets, "parseSets parses right amount of sets. " + testData.name );

			$.each( sets, function( i, set ) {
				pf.parseSet( set );
				equal( set.candidates.length, testData.candidates[ i ], "parseSets parses right amount of candidates inside a set. " + testData.name );
			} );

		});
	});

	test("calcLength", function() {
		var calcTest = (function() {
			var fullWidthEl = document.createElement( "div" );
			document.documentElement.insertBefore( fullWidthEl, document.documentElement.firstChild );

			var gotWidth = pf.calcLength("calc(766px - 1em)");

			return ( Modernizr.csscalc ? gotWidth === 750 : (gotWidth === fullWidthEl.offsetWidth || $(window).width()) );
		}());

		equal( pf.calcLength("750px"), 750, "returns int value of width string" );
		ok( calcTest, "If `calc` is supported, `calc(766px - 1em)` returned `750px`. If `calc` is unsupported, the value was discarded and defaulted to `100vw`.");
	});

	test("calcLengthFromList", function() {
		var width;
		var invalidSizes = "(min-width: 1px) 1002pysa, (min-width: 2px) -20px, (min-width: 3px) 10%";
		var sizes = "	(max-width: 30em) 1000px,	(max-width: 50em) 750px, 500px	";

		pf.matchesMedia = function(media) {
			return true;
		};

		width = pf.calcLengthFromList(sizes);

		equal(width, 1000, "returns 1000 when match media returns true");

		width = pf.calcLengthFromList(invalidSizes + ", (min-width: 2px) 10px");
		equal(width, 10, "iterates through until finds valid value");

		width = pf.calcLengthFromList(invalidSizes);
		equal(width, pf.vW, "if no valid size is given defaults to viewport width");

		pf.matchesMedia = function(media) {
			return !media || false;
		};

		width = pf.calcLengthFromList(sizes);
		equal(width, 500, "returns 500 when match media returns false");

		pf.matchesMedia = function(media) {
			return !media || media == "(max-width: 50em)";
		};
		width = pf.calcLengthFromList(sizes);
		equal(width, 750, "returns 750px when match media returns true on (max-width: 50em)");
	});

	test("parseSize", function() {
		var size1 = "";
		var expected1 = {
			length: null,
			media: null
		};
		deepEqual(pf.parseSize(size1), expected1, "Length and Media are empty");

		var size2 = "( max-width: 50em ) 50%";
		var expected2 = {
			length: "50%",
			media: "( max-width: 50em )"
		};
		deepEqual(pf.parseSize(size2), expected2, "Length and Media are properly parsed");

		var size3 = "(min-width:30em) calc(30% - 15px)";
		var expected3 = {
			length: "calc(30% - 15px)",
			media: "(min-width:30em)"
		};
		deepEqual(pf.parseSize(size3), expected3, "Length and Media are properly parsed");
	});

	test("prepareCandidates", function() {
		var srcset, expected, sizes;
		// Basic test
		var runGetCandiate = function(candidate, sizes) {
			return $.map(pf.prepareCandidates( { srcset: candidate, sizes: sizes || null } ), function( can ) {
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
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly");

		srcset = "images/pic-medium.png 1x";
		expected = [
			{
				res: 1,
				url: "images/pic-medium.png"
			}
		];
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

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

		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

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

		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly");

		// Test with multiple spaces
		srcset = "			images/pic-medium.png		 1x		,		 images/pic-medium-2x.png		 2x		";
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

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
		//deepEqual(runGetCandiate(srcset), expectedFormattedCandidates4, "`" + srcset + "` is parsed correctly" );

		// Test with "sizes" passed with a px length specified
		srcset = "			images/pic-smallest.png		 250w		,		 images/pic-small.png		 500w		, images/pic-medium.png 1000w";
		sizes = "1000px";
		deepEqual(runGetCandiate(srcset, sizes), expected, "`" + srcset + "` is parsed correctly");

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

		pf.calcLength = function() {
			return 640;
		};

		pf.matchesMedia = function() {
			return true;
		};

		deepEqual(runGetCandiate(srcset, sizes), expected, "`" + srcset + "` is parsed correctly" );

		srcset = "foo,bar.png 320w, bar,baz.png 320w";
		expected = [
			{
				url: "foo,bar.png",
				res: 0.5
			},{
				url: "bar,baz.png",
				res: 0.5
			}
		];
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

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
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

		srcset = "foo.png 1x, bar.png -2x";
		expected = [
			{
				url: "foo.png",
				res: 1
			}
		];
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

		srcset = "foo.png 1x, bar.png 2q";
		expected = [
			{
				url: "foo.png",
				res: 1
			}
		];
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

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
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

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
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

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
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

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
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

		srcset = "800.gif 2x, 1600.gif 1600w";
		expected = [
			{
				url: "800.gif",
				res: 2
			},{
				url: "1600.gif",
				res: 2.5
			}
		];
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

		srcset = "1x,,  ,   x    ,2x	, 1x.gif, , 3x, 4x.gif 4x 100h,,, 5x.gif 5, dx.gif dx, 2x.gif   2x,";
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
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

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
		deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );
	});

	test( "pf.mMQ", function() {
		pf.vW = 480;
		pf.getEmValue = function() {
			return 2;
		};

		ok( pf.mMQ( "(min-width: 480px)" ) );
		ok( !pf.mMQ( "(min-width: 481px)" ) );
		ok( pf.mMQ( "(min-width: 479px)" ) );

		ok( pf.mMQ( "(max-width: 480px)" ) );
		ok( pf.mMQ( "(max-width: 481px)" ) );
		ok( !pf.mMQ( "(max-width: 479px)" ) );

		ok( !pf.mMQ( "(orientation: landscape)" ) );

		ok( pf.mMQ( "(min-width: 240em)" ) );
		ok( !pf.mMQ( "(min-width: 241em)" ) );
		ok( pf.mMQ( "(min-width: 239em)" ) );

		ok( pf.mMQ( "(max-width: 240em)" ) );
		ok( pf.mMQ( "(max-width: 241em)" ) );
		ok( !pf.mMQ( "(max-width: 239em)" ) );

		ok( !pf.mMQ( "(min-width: 240ups)" ) );

	} );

	test("verifyTypeSupport", function() {
		expect( 5 );

		// Test widely supported mime types.
		ok( pf.verifyTypeSupport( "image/jpeg" ) );

		ok( pf.verifyTypeSupport( "image/png" ) );

		ok( pf.verifyTypeSupport( "image/gif" ) );

		// if the type attribute is supported it should return true
		ok( pf.verifyTypeSupport( "" ) );

		// if the type attribute is supported it should return true
		ok( pf.verifyTypeSupport( null ) );
	});

	test("applyCandidateFromSet", function() {
		var image, candidates;

		var fullPath = pf.makeUrl("foo300");

		candidates = [
			{ res: 100, url: "foo100", set: {}, desc: {} },
			{ res: 200, url: "foo200", set: {}, desc: {} },
			{ res: 300, url: "foo300", set: {}, desc: {} }
		];

		image = {
			src: "not one of the urls"
		};

		image [pf.ns ] = {};

		pf.DPR = 300;

		pf.applyCandidateFromSet( candidates, image );

		equal(pf.makeUrl( image.src ), pf.makeUrl( candidates[2].url ), "uses the url from the best px fit" );

		if (!currentSrcSupported) {
			deepEqual( pf.makeUrl( image.currentSrc ), pf.makeUrl( candidates[2].url ), "uses the url from the best px fit" );
		}

		image.src = fullPath;
		image.currentSrc = fullPath;
		image [pf.ns ].curSrc = fullPath;

		pf.applyCandidateFromSet( candidates, image );

		deepEqual(image.src, fullPath, "src left alone when matched" );

		if (!currentSrcSupported) {
			deepEqual(image.currentSrc, fullPath, "currentSrc left alone when matched" );
		}

	});

	test("getSet returns the first matching `source`", function() {
		var img = $( ".first-match" )[ 0 ];
		var firstsource = img.parentNode.getElementsByTagName( "source" )[ 0 ];

		forceElementParsing( img );

		equal( pf.getSet( img ).srcset, firstsource.getAttribute( "srcset" ) );
	});

	test( "getSet returns 'pending' when a source type is pending", function() {
		var img = $(".pending-check")[0];
		pf.types["foo"] = "pending";

		forceElementParsing( img );

		equal( pf.getSet( img ), "pending", "pending type should be false" );
	});

	test( "getSet returns source when it matches the media", function() {
		var img = $( ".match-check ")[ 0 ];
		pf.matchesMedia = function() {
			return true;
		};

		forceElementParsing( img );

		equal( pf.getSet( img ).srcset, img.parentNode.getElementsByTagName( "source" )[0].getAttribute( "srcset" ) );
	});

	test( "getMatch returns false when no match is found", function() {
		pf.matchesMedia = function( media ) {
			return !media || false;
		};

		var img = $( ".no-match-check ")[0];

		forceElementParsing( img );

		equal( pf.getSet( img ), false );
	});

	test( "getSet returns false when no srcset is found", function() {
		var img = $( ".no-srcset-check ")[0];

		forceElementParsing( img );

		equal( pf.getSet( img ), false );
	});

	test( "picturefill ignores elements when they are marked with a property", function() {
		expect( 0 );

		var mockPicture = {
			nodeName: "PICTURE"
		};

		mockPicture[ pf.ns ] = {
			evaluated: true
		};

		picturefill({ reevaluate: false, elements: [ mockPicture ] });
	});

	test( "picturefill marks elements with a property", function() {
		// NOTE requires at least one child image for the propery to be set
		var mockPicture = $( ".prop-check" )[0];

		// make sure there are candidates to consider
		pf.processSourceSet = function() {
			return [ { url: "foo" } ];
		};

		picturefill({ reevaluate: false, elements: [ mockPicture ] });
		if ( !window.HTMLPictureElement ) {
			ok( mockPicture[ pf.ns ].evaluated );
		} else {
			ok( !mockPicture[ pf.ns ] );
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

	test( "Mixed content should be blocked", function() {
		pf.isSSL = true;
		var image, candidates;

		candidates = [
			{ res: 1, url: "http://example.org/bar" }
		];

		image = {
			src: "foo"
		};

		image [pf.ns ] = {};

		pf.applyCandidateFromSet( candidates, image );

		equal( image.src, "foo" );

	});

})( window, jQuery );
