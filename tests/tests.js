(function(window, jQuery) {


	var pf = picturefill._;

	var saveCache = {};

	var forceElementParsing = function( element, options ){

		if ( !element[ pf.ns ] ) {
			element[ pf.ns ] = {};
			pf.parseCanditates( element, element.parentNode, options || {} );
		}
	};

	// reset stubbing

	module( "method", {
		setup: function() {
			var prop;
			for( prop in pf ){
				if ( pf.hasOwnProperty( prop ) ) {
					saveCache[ prop ] = pf[ prop ];
				}
			}
		},

		teardown: function() {
			var prop;
			for( prop in saveCache ){
				if( pf.hasOwnProperty(prop) && saveCache[prop] != pf[ prop ] ){
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
		pf.DPR = 2;

		pf.getWidthFromLength = function(){
			return 160;
		};
		var $srcsetImageW = $( "<img />" )
			.attr({
				srcset: "medium.jpg 480w,\n small.jpg  320w"
			})
			.prependTo('#qunit-fixture')
		;
		var $srcsetImageX = $( "<img />" )
			.attr({
				srcset: "oneX.jpg 1x, twoX.jpg 2x"
			})
			.prependTo('#qunit-fixture')
		;

		var $normalImg = $('.prop-check');

		window.picturefill();
		window.picturefill._.fillImgs();

		$( "img[srcset], picture > img" ).each( function(){
			picturefill._.fillImg( this, {} );
		} );

		if ( window.HTMLPictureElement ) {
			equal( $('picture > img' ).prop( pf.ns ), undefined, "Picturefill doesn't touch images in supporting browsers." );
		} else {

			ok( $('picture > img' ).prop( pf.ns ), "Picturefill modifies images in non-supporting browsers." );
		}

		if ( pf.srcsetSupported ) {

			equal( ($srcsetImageX.prop( pf.ns ) || {supported: true}).supported, true, "Picturefill doesn't touch images in supporting browsers." );
			equal( $srcsetImageX.attr( "src" ), null, "Picturefill doesn't touch image sources in supporting browsers." );

		} else {
			ok( $srcsetImageX.prop( pf.ns ), "Picturefill modifies images in non-supporting browsers." );
			equal( $srcsetImageX.attr( "src" ), "twoX.jpg", "Picturefill changes source of image" );
		}

		if(pf.srcsetSupported && pf.sizesSupported){
			equal( $srcsetImageW.prop( pf.ns ), undefined, "Picturefill doesn't touch images in supporting browsers." );
			equal( $srcsetImageW.attr( "src" ), null, "Picturefill doesn't touch image sources in supporting browsers." );
		} else {

			ok( $srcsetImageW.prop( pf.ns ), "Picturefill modifies images in non-supporting browsers." );
			equal( $srcsetImageW.attr( "src" ), "small.jpg", "Picturefill changes source of image" );
		}
		equal( $normalImg.prop( pf.ns ), undefined, "Picturefill doesn't touch normal images in any browsers." );
		equal( $normalImg.attr( "src" ), "bar", "Picturefill leaves src attribute of normal images untouched." );

		if( !window.HTMLPictureElement ){
			window.picturefill({elements: $normalImg});
			ok( $normalImg.prop( pf.ns).supported, "Picturefill doesn't touch normal images in any browsers too much even if it is called explicitly." );
			equal( $normalImg.attr( "src" ), "bar", "Picturefill leaves src attribute of normal images untouched." );
		}

		if( !pf.sizesSupported ){
			pf.DPR = 1;

			pf.getWidthFromLength = function(){
				return 460;
			};

			window.picturefill({reevaluate: true});

			if( !pf.srcsetSupported ){
				equal( $srcsetImageX.attr( "src" ), "oneX.jpg", "Picturefill changes source of image" );
			}
			equal( $srcsetImageW.attr( "src" ), "medium.jpg", "Picturefill changes source of image" );
		}

	});

	test("getWidthFromLength", function() {
		var calcTest = (function() {
			var fullWidthEl = document.createElement( "div" );
			document.documentElement.insertBefore( fullWidthEl, document.documentElement.firstChild );

			var gotWidth = pf.getWidthFromLength("calc(766px - 1em)");

			return ( Modernizr.csscalc ? gotWidth === 750 : gotWidth === fullWidthEl.offsetWidth );
		}());

		equal( pf.getWidthFromLength("750px"), 750, "returns int value of width string" );
		ok( calcTest, "If `calc` is supported, `calc(766px - 1em)` returned `750px`. If `calc` is unsupported, the value was discarded and defaulted to `100vw`.");
	});

	test("findWidthFromSourceSize", function() {
		var width;
		var sizes = "	(max-width: 30em) 1000px,	(max-width: 50em) 750px, 500px	";

		pf.matchesMedia = function(media) {
			return true;
		};

		width = pf.findWidthFromSourceSize(sizes);

		equal(width, 1000, "returns 1000 when match media returns true");

		pf.matchesMedia = function(media) {
			return !media || false;
		};
		width = pf.findWidthFromSourceSize(sizes);
		equal(width, 500, "returns 500 when match media returns false");

		pf.matchesMedia = function(media) {
			return !media || media == "(max-width: 50em)";
		};
		width = pf.findWidthFromSourceSize(sizes);
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

	test("getCandidatesFromSourceSet", function() {
		// Basic test
		var runGetCandiate = function(candidate, sizes){
			return pf.getCandidatesFromSourceSet({srcset: candidate, sizes: sizes || null});
		};

		var candidate1 = "images/pic-medium.png";
		var expectedFormattedCandidates1 = [
			{
				resolution: 1,
				url: "images/pic-medium.png"
			}
		];
		deepEqual(runGetCandiate(candidate1), expectedFormattedCandidates1, "`" + candidate1 + "` is parsed correctly");

		var candidate1a = "images/pic-medium.png 1x";
		var expectedFormattedCandidates1a = [
			{
				resolution: 1,
				url: "images/pic-medium.png"
			}
		];
		deepEqual(runGetCandiate(candidate1a), expectedFormattedCandidates1a, "`" + candidate1a + "` is parsed correctly" );

		var candidate2 = "images/pic-medium.png, images/pic-medium-2x.png 2x";
		var expectedFormattedCandidates2 = [
			{
				resolution: 1,
				url: "images/pic-medium.png"
			},
			{
				resolution: 2,
				url: "images/pic-medium-2x.png"
			}
		];

		deepEqual(runGetCandiate(candidate2), expectedFormattedCandidates2, "`" + candidate2 + "` is parsed correctly" );

		var candidate2a = "images/pic-medium.png 1x, images/pic-medium-2x.png 2x";
		var expectedFormattedCandidates2a = [
			{
				resolution: 1,
				url: "images/pic-medium.png"
			},
			{
				resolution: 2,
				url: "images/pic-medium-2x.png"
			}
		];

		deepEqual(runGetCandiate(candidate2a), expectedFormattedCandidates2a, "`" + candidate2a + "` is parsed correctly");

		// Test with multiple spaces
		var candidate3 = "			images/pic-medium.png		 1x		,		 images/pic-medium-2x.png		 2x		";
		deepEqual(runGetCandiate(candidate3), expectedFormattedCandidates2, "`" + candidate3 + "` is parsed correctly" );

		// Test with decimals
		var candidate4 = "			images/pic-smallest.png		0.25x	,		images/pic-small.png		0.5x	, images/pic-medium.png 1x";
		var expectedFormattedCandidates4 = [
			{
				resolution: 0.25,
				url: "images/pic-smallest.png"
			},
			{
				resolution: 0.5,
				url: "images/pic-small.png"
			},
			{
				resolution: 1,
				url: "images/pic-medium.png"
			}
		];
		//deepEqual(runGetCandiate(candidate4), expectedFormattedCandidates4, "`" + candidate4 + "` is parsed correctly" );

		// Test with "sizes" passed with a px length specified
		var candidate5 = "			images/pic-smallest.png		 250w		,		 images/pic-small.png		 500w		, images/pic-medium.png 1000w";
		var sizes5 = "1000px";

		deepEqual(runGetCandiate(candidate5, sizes5), expectedFormattedCandidates4, "`" + candidate4 + "` is parsed correctly");

		// Test with "sizes" passed with % lengths specified
		var candidate6 = "\npic320.png 320w	, pic640.png		640w, pic768.png 768w, \
		\npic1536.png 1536w, pic2048.png	2048w	";
		var sizes6 = "	(max-width: 30em) 100%,	(max-width: 50em) 50%, 33%";
		var expectedCandidates = [
			{
				resolution: 0.5,
				url: "pic320.png"
			},
			{
				resolution: 1,
				url: "pic640.png"
			},
			{
				resolution: 1.2,
				url: "pic768.png"
			},
			{
				resolution: 2.4,
				url: "pic1536.png"
			},
			{
				resolution: 3.2,
				url: "pic2048.png"
			}
		];

		pf.getWidthFromLength = function() {
			return 640;
		};

		pf.matchesMedia = function() {
			return true;
		};

		deepEqual(runGetCandiate(candidate6, sizes6), expectedCandidates, "`" + candidate6 + "` is parsed correctly" );

		var srcset1 = "foo,bar.png 320w, bar,baz.png 320w";
		var expectedresult1 = [
			{
				url: "foo,bar.png",
				resolution: 0.5
			},{
				url: "bar,baz.png",
				resolution: 0.5
			}
		];
		deepEqual(runGetCandiate(srcset1), expectedresult1, "`" + srcset1 + "` is parsed correctly" );

		var srcset2 = "foo,bar.png 320w,bar,baz.png 320w";
		var expectedresult2 = [
			{
				url: "foo,bar.png",
				resolution: 0.5
			},{
				url: "bar,baz.png",
				resolution: 0.5
			}
		];

		deepEqual(runGetCandiate(srcset2), expectedresult2, "`" + srcset2 + "` is parsed correctly" );

		var srcset3 = "foo.png 1x, bar.png -2x";
		var expectedresult3 = [
			{
				url: "foo.png",
				resolution: 1
			},{
				url: "bar.png",
				resolution: -2
			}
		];
		deepEqual(runGetCandiate(srcset3), expectedresult3, "`" + srcset3 + "` is parsed correctly" );

		var srcset4 = "foo.png 1x, bar.png 2q";
		var expectedresult4 = [
			{
				url: "foo.png",
				resolution: 1
			},{
				url: "bar.png",
				resolution: 1
			}
		];
		deepEqual(runGetCandiate(srcset4), expectedresult4, "`" + srcset4 + "` is parsed correctly" );

		var srcset5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg 1x, bar.png 2x";
		var expectedresult5 = [
			{
				url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
				resolution: 1
			},{
				url: "bar.png",
				resolution: 2
			}
		];
		deepEqual(runGetCandiate(srcset5), expectedresult5, "`" + srcset5 + "` is parsed correctly" );

		var srcset6 = "2.png 1x,1.png 2x";
		var expectedresult6 = [
			{
				url: "2.png",
				resolution: 1
			},{
				url: "1.png",
				resolution: 2
			}
		];
		deepEqual(runGetCandiate(srcset6), expectedresult6, "`" + srcset6 + "` is parsed correctly" );

		var srcset7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg 2x, 1x.gif 1x, data:image/png;base64,iVBORw0KGgoAAAANSUhEUg";
		var expectedresult7 = [
			{
				url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
				resolution: 2
			},{
				url: "1x.gif",
				resolution: 1
			},{
				url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
				resolution: 1
			}
		];
		deepEqual(runGetCandiate(srcset7), expectedresult7, "`" + srcset7 + "` is parsed correctly" );

		var srcset8 = "400.gif 400w, 6000.gif 6000w";
		var expectedresult8 = [
			{
				url: "400.gif",
				resolution: 0.625
			},{
				url: "6000.gif",
				resolution: 9.375
			}
		];
		deepEqual(runGetCandiate(srcset8), expectedresult8, "`" + srcset8 + "` is parsed correctly" );

		var srcset9 = "800.gif 2x, 1600.gif 1600w";
		var expectedresult9 = [
			{
				url: "800.gif",
				resolution: 2
			},{
				url: "1600.gif",
				resolution: 2.5
			}
		];
		deepEqual(runGetCandiate(srcset9), expectedresult9, "`" + srcset9 + "` is parsed correctly" );
		var srcset10 = "1x,,  ,   x    ,2x	, 1x.gif, , 3x, 4x.gif 4x 100h,,, 5x.gif 5, dx.gif dx, 2x.gif   2x,";
		var expectedresult10 = [
			{
				url: "1x",
				resolution: 1
			},{
				url: "x",
				resolution: 1
			},{
				url: "2x",
				resolution: 1
			},{
				url: "1x.gif",
				resolution: 1
			},{
				url: "3x",
				resolution: 1
			},{
				url: "4x.gif",
				resolution: 4
			},{
				url: "5x.gif",
				resolution: 1
			},{
				url: "dx.gif",
				resolution: 1
			},{
				url: "2x.gif",
				resolution: 2
			}
		];
		deepEqual(runGetCandiate(srcset10), expectedresult10, "`" + srcset10 + "` is parsed correctly" );
	});

	test( "pf.mMQ", function(){
		pf.vW = 480;
		pf.getEmValue = function(){
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

	test("applyBestCandidateFromSrcSet", function() {
		var image, candidates;

		var fullPath = pf.makeUrl("foo300");

		candidates = [
			{ resolution: 100, url: "foo100" },
			{ resolution: 200, url: "foo200" },
			{ resolution: 300, url: "foo300" }
		];

		image = {
			src: "not one of the urls"
		};

		pf.DPR = 300;

		pf.applyBestCandidateFromSrcSet( candidates, image );

		deepEqual(image.src, candidates[2].url, "uses the url from the best px fit" );

		if(!pf.currentSrcSupported){
			deepEqual(image.currentSrc, candidates[2].url, "uses the url from the best px fit" );
		}

		image.src = fullPath;
		image.currentSrc = fullPath;

		pf.applyBestCandidateFromSrcSet( candidates, image );

		deepEqual(image.src, fullPath, "src left alone when matched" );

		if(!pf.currentSrcSupported){
			deepEqual(image.currentSrc, fullPath, "currentSrc left alone when matched" );
		}

	});

	test( "removeMediaShim: video", function() {
		var $videoShim = $( ".video-shim" );

		equal( $videoShim.find( "video" ).length, 1 );
		equal( $videoShim.find( "source" ).length, 2 );

		pf.removeMediaShim( $videoShim[0] );

		equal( $videoShim.find( "video" ).length, 0 );
		equal( $videoShim.find( "source" ).length, 2 );
	});

	test( "removeMediaShim: audio", function() {
		var $audioShim = $( ".audio-shim" );

		equal( $audioShim.find( "audio" ).length, 1 );
		equal( $audioShim.find( "source" ).length, 2 );

		pf.removeMediaShim( $audioShim[0] );

		equal( $audioShim.find( "video" ).length, 0 );
		equal( $audioShim.find( "source" ).length, 2 );
	});

	test("getFirstMatch returns the first matching `source`", function() {
		var img = $( ".first-match" )[ 0 ];
		var firstsource = img.parentNode.getElementsByTagName( "source" )[ 0 ];

		forceElementParsing( img );

		equal( pf.getFirstMatch( img ).srcset, firstsource.getAttribute( "srcset" ) );
	});

	test("Each `img` should then check if its parent is `picture`, then loop through `source` elements until finding the `img` that triggered the loop.", function() {
		var firstSource;
		var img = $( ".match" )[ 0 ];
		var img2 = $( ".match-second" )[ 0 ];

		forceElementParsing( img );
		forceElementParsing( img2 );

		firstSource = img.parentNode.getElementsByTagName( "source" )[ 0 ];

		ok( pf.getFirstMatch( img ) === false && pf.getFirstMatch( img2).srcset === firstSource.getAttribute('srcset') );
	});


	test( "getFirstMatch returns 'pending' when a source type is pending", function() {
		var img = $(".pending-check")[0];
		pf.types["foo"] = "pending";

		forceElementParsing( img );

		equal( pf.getFirstMatch( img ), "pending", "pending type should be false" );
	});

	test( "getFirstMatch returns source when it matches the media", function() {
		var img = $( ".match-check ")[ 0 ];
		pf.matchesMedia = function() {
			return true;
		};

		forceElementParsing( img );

		equal( pf.getFirstMatch( img ).srcset, img.parentNode.getElementsByTagName( "source" )[0].getAttribute( "srcset" ) );
	});


	test( "getMatch returns false when no match is found", function() {
		pf.matchesMedia = function( media ) {
			return !media || false;
		};

		var img = $( ".no-match-check ")[0];

		forceElementParsing( img );

		equal( pf.getFirstMatch( img ), false );
	});


	test( "getFirstMatch returns false when no srcset is found", function() {
		var img = $( ".no-srcset-check ")[0];

		forceElementParsing( img );

		equal( pf.getFirstMatch( img ), false );
	});

	test( "getMatch returns only sources preceding fallback img", function() {
		var $ignoredSource = $( ".ignored-source-check" );

		forceElementParsing( $ignoredSource[ 0 ] );

		// ensure the construction of the fixture
		equal($ignoredSource[0].nodeName, "IMG" );
		equal($ignoredSource.next()[0].nodeName, "SOURCE" );

		// ensure that the result is undefined so the picture is grabbed later
		equal( pf.getFirstMatch( $ignoredSource[0]).srcset, "imgsrcset", "no source srcset found" );
	});

	test( "picturefill ignores elements when they are marked with a property", function() {
		expect( 0 );

		var mockPicture = {
			nodeName: "PICTURE"
		};

		mockPicture[ pf.ns ] = {
			evaluated: true
		};

		pf.removeMediaShim = function() {
			ok( false );
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
		if( !window.HTMLPictureElement ) {
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
		pf.restrictsMixedContent = true;
		var image, candidates;

		candidates = [
			{ resolution: 1, url: "http://example.org/bar" }
		];

		image = {
			src: "foo"
		};

		pf.applyBestCandidateFromSrcSet( candidates, image );

		equal( image.src, "foo" );

	});

})( window, jQuery );
