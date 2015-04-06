(function(window, jQuery) {
	if ( window.HTMLPictureElement ){
		test( "Picture is natively supported", function() {
			ok( window.HTMLPictureElement );
			ok( window.picturefill );
		});

		return;
	}

	var pf, originalDprMethod,
		originalVideoShimMethod,
		originalMatchesMedia,
		originalProcessSourceSet,
		originalGetWidthFromLength,
		originalRestrictsMixedContentMethod;

	pf = picturefill._;

	// reset stubbing
	module( "method", {
		setup: function() {
			originalDprMethod = pf.getDpr;
			originalVideoShimMethod = pf.removeVideoShim;
			originalMatchesMedia = pf.matchesMedia;
			originalProcessSourceSet = pf.processSourceSet;
			originalGetWidthFromLength = pf.getWidthFromLength;
			originalrestrictsMixedContentMethod = pf.restrictsMixedContent;
		},

		teardown: function() {
			pf.getDpr = originalDprMethod;
			pf.removeVideoShim = originalVideoShimMethod;
			pf.matchesMedia = originalMatchesMedia;
			pf.processSourceSet = originalProcessSourceSet;
			pf.restrictsMixedContent = originalrestrictsMixedContentMethod;
		}
	});

	test("getWidthFromLength", function() {
		var calcTest = (function() {
			var gotWidth = pf.getWidthFromLength("calc(766px - 16px)");
			var returnValue = ( gotWidth === 750 || gotWidth === false );
			return returnValue;
		}());

		equal( pf.getWidthFromLength("750px"), 750, "returns int value of width string" );
		ok( calcTest, "If `calc` is supported, `calc(766px - 16px)` returned `750px`. If `calc` is unsupported, the value is `false`.");
		equal( pf.getWidthFromLength("calc(160px + 1de)"), false, "calc(160px + 1de)");
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
			return false;
		};
		width = pf.findWidthFromSourceSize(sizes);
		equal(width, 500, "returns 500 when match media returns false");

		sizes = "100foo, 200px";
		width = pf.findWidthFromSourceSize(sizes);
		equal(width, 200, "returns 200 when there was an unknown css length");

		sizes = "100foo, sd2300bar";
		width = pf.findWidthFromSourceSize(sizes);

		equal(width, Math.max(window.innerWidth || 0, document.documentElement.clientWidth), "returns 100vw when all sizes are an unknown css length");
	});

	asyncTest("setIntrinsicSize", function() {
		var imgInitialHeight = document.createElement( "img" );
		var imgInitialWidth = document.createElement( "img" );
		var imgWithoutDimensions = document.createElement( "img" );
		var candidate = {
			url: pf.makeUrl( "../examples/images/small.jpg" ),
			resolution: 2
		};

		imgWithoutDimensions.onload = function() {
			ok( !imgInitialHeight.getAttribute("width"), "No natural width calculation is performed if a `height` attribute already exists." );

			equal( imgInitialWidth.width, 10, "No natural width calculation is performed if a `width` attribute already exists." );

			equal( imgWithoutDimensions.width, 90, "width attribute is set to `naturalWidth / resolution`" );
			start();
		};

		imgInitialHeight.src = candidate.url;
		imgInitialWidth.src = candidate.url;
		imgWithoutDimensions.src = candidate.url;

		imgInitialHeight[ pf.ns ] = {};
		imgInitialWidth[ pf.ns ] = {};
		imgWithoutDimensions[ pf.ns ] = {};

		imgInitialHeight.setAttribute( "height", 10 );
		imgInitialWidth.setAttribute( "width", 10 );

		pf.setIntrinsicSize(imgInitialHeight, candidate );
		pf.setIntrinsicSize(imgInitialWidth, candidate );
		pf.setIntrinsicSize(imgWithoutDimensions, candidate );

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
		var candidate1 = "images/pic-medium.png";
		var expectedFormattedCandidates1 = [
			{
				resolution: 1,
				url: "images/pic-medium.png"
			}
		];
		deepEqual(pf.getCandidatesFromSourceSet(candidate1), expectedFormattedCandidates1, "`" + candidate1 + "` is parsed correctly");

		var candidate1a = "images/pic-medium.png 1x";
		var expectedFormattedCandidates1a = [
			{
				resolution: 1,
				url: "images/pic-medium.png"
			}
		];
		deepEqual(pf.getCandidatesFromSourceSet(candidate1a), expectedFormattedCandidates1a, "`" + candidate1a + "` is parsed correctly" );

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

		deepEqual(pf.getCandidatesFromSourceSet(candidate2), expectedFormattedCandidates2, "`" + candidate2 + "` is parsed correctly" );

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

		deepEqual(pf.getCandidatesFromSourceSet(candidate2a), expectedFormattedCandidates2a, "`" + candidate2a + "` is parsed correctly");

		// Test with multiple spaces
		var candidate3 = "			images/pic-medium.png		 1x		,		 images/pic-medium-2x.png		 2x		";
		deepEqual(pf.getCandidatesFromSourceSet(candidate3), expectedFormattedCandidates2, "`" + candidate3 + "` is parsed correctly" );

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
		deepEqual(pf.getCandidatesFromSourceSet(candidate4), expectedFormattedCandidates4, "`" + candidate4 + "` is parsed correctly" );

		// Test with "sizes" passed with a px length specified
		var candidate5 = "			images/pic-smallest.png		 250w		,		 images/pic-small.png		 500w		, images/pic-medium.png 1000w";
		var sizes5 = "1000px";
		deepEqual(pf.getCandidatesFromSourceSet(candidate5, sizes5), expectedFormattedCandidates4, "`" + candidate4 + "` is parsed correctly");

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

		pf.getWidthFromLength = function(width) {
			return 640;
		};

		pf.matchesMedia = function(media) {
			return true;
		};

		deepEqual(pf.getCandidatesFromSourceSet(candidate6, sizes6), expectedCandidates, "`" + candidate6 + "` is parsed correctly" );

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
		deepEqual(pf.getCandidatesFromSourceSet(srcset1), expectedresult1, "`" + srcset1 + "` is parsed correctly" );

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

		deepEqual(pf.getCandidatesFromSourceSet(srcset2), expectedresult2, "`" + srcset2 + "` is parsed correctly" );

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
		deepEqual(pf.getCandidatesFromSourceSet(srcset3), expectedresult3, "`" + srcset3 + "` is parsed correctly" );

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
		deepEqual(pf.getCandidatesFromSourceSet(srcset4), expectedresult4, "`" + srcset4 + "` is parsed correctly" );

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
		deepEqual(pf.getCandidatesFromSourceSet(srcset5), expectedresult5, "`" + srcset5 + "` is parsed correctly" );

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
		deepEqual(pf.getCandidatesFromSourceSet(srcset6), expectedresult6, "`" + srcset6 + "` is parsed correctly" );

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
		deepEqual(pf.getCandidatesFromSourceSet(srcset7), expectedresult7, "`" + srcset7 + "` is parsed correctly" );

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
		deepEqual(pf.getCandidatesFromSourceSet(srcset8), expectedresult8, "`" + srcset8 + "` is parsed correctly" );

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
		deepEqual(pf.getCandidatesFromSourceSet(srcset9), expectedresult9, "`" + srcset9 + "` is parsed correctly" );
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
		deepEqual(pf.getCandidatesFromSourceSet(srcset10), expectedresult10, "`" + srcset10 + "` is parsed correctly" );
	});

	test("verifyTypeSupport", function() {
		expect( 6 );

		// Test widely supported mime types.
		ok(pf.verifyTypeSupport({
			getAttribute: function() {
				return "image/jpeg";
			}
		}));

		ok(pf.verifyTypeSupport({
			getAttribute: function() {
				return "image/png";
			}
		}));

		ok(pf.verifyTypeSupport({
			getAttribute: function() {
				return "image/gif";
			}
		}));

		// if the type attribute is supported it should return true
		ok(pf.verifyTypeSupport({
			getAttribute: function() {
				return "";
			}
		}));

		// if the type attribute is supported it should return true
		ok(pf.verifyTypeSupport({
			getAttribute: function() {
				return null;
			}
		}));

		pf.verifyTypeSupport({
			getAttribute: function() {
				return "foo";
			}
		});

		pf.types[ "bar" ] = "baz";

		equal( "pending", pf.verifyTypeSupport({
			getAttribute: function() {
				return "bar";
			}
		}));
	});

	test("applyBestCandidate", function() {
		var image, candidates;

		candidates = [
			{ resolution: 100, url: "data:100" },
			{ resolution: 200, url: "data:200" },
			{ resolution: 300, url: "data:300" }
		];

		image = {
			src: "not one of the urls"
		};

		pf.getDpr = function() {
			return 300;
		};

		pf.applyBestCandidate( candidates, image );

		deepEqual(image.src, candidates[2].url, "uses the url from the best px fit" );
		deepEqual(image.currentSrc, candidates[2].url, "uses the url from the best px fit" );

		image.src = "data:300";
		image.currentSrc = "data:300";

		pf.applyBestCandidate( candidates, image );

		deepEqual(image.src, "data:300", "src left alone when matched" );
		deepEqual(image.currentSrc, "data:300", "currentSrc left alone when matched" );
	});

	test( "removeVideoShim", function() {
		var $videoShim = $( ".video-shim" );

		equal( $videoShim.find( "video" ).length, 1 );
		equal( $videoShim.find( "source" ).length, 2 );

		pf.removeVideoShim( $videoShim[0] );

		equal( $videoShim.find( "video" ).length, 0 );
		equal( $videoShim.find( "source" ).length, 2 );
	});

	test("getMatch returns the first matching `source`", function() {
		var firstsource = $( ".first-match" )[ 0 ].parentNode.getElementsByTagName( "source" )[ 0 ];

		equal( pf.getMatch( $( ".first-match" )[ 0 ], $( ".first-match" )[ 0 ].parentNode ), firstsource );
	});

	test("Each `img` should then check if its parent is `picture`, then loop through `source` elements until finding the `img` that triggered the loop.", function() {
		var match = $( ".match" )[ 0 ],
			match2 = $( ".match-second" )[ 0 ],
			firstSource = match.parentNode.getElementsByTagName( "source" )[ 0 ];

		ok( pf.getMatch( match, match.parentNode ) === undefined && pf.getMatch( match2, match2.parentNode ) === firstSource );
	});

	test( "getMatch returns false when a source type is pending", function() {
		pf.types["foo"] = function() {};

		equal( pf.getMatch($(".pending-check")[0], $(".pending-check")[0].parentNode ), false, "pending type should be false" );
	});

	test( "getMatch returns source when it matches the media", function() {
		var $match = $( ".match-check ");
		pf.matchesMedia = function() {
			return true;
		};

		equal( pf.getMatch( $match[0], $match[0].parentNode ), $match[0].parentNode.getElementsByTagName( "source" )[0] );
	});

	test( "getMatch returns undefined when no match is found", function() {
		pf.matchesMedia = function() {
			return false;
		};

		var $noMatch = $( ".no-match-check ");

		equal( pf.getMatch( $noMatch[0], $noMatch[0].parentNode ), undefined );
	});

	test( "getMatch returns undefined when no srcset is found", function() {
		var $noSrcset = $( ".no-srcset-check ");

		equal( pf.getMatch( $noSrcset[0], $noSrcset[0].parentNode ), undefined );
	});

	test( "getMatch returns only sources preceding fallback img", function() {
		var $ignoredSource = $( ".ignored-source-check" );

		// ensure the construction of the fixture
		equal($ignoredSource[0].nodeName, "IMG" );
		equal($ignoredSource.next()[0].nodeName, "SOURCE" );

		// ensure that the result is undefined so the picture is grabbed later
		equal( pf.getMatch( $ignoredSource[0], $ignoredSource[0].parentNode ), undefined, "no source found" );
	});

	test( "picturefill ignores elements when they are marked with a property", function() {
		expect( 0 );

		var mockPicture = {
			nodeName: "PICTURE"
		};

		mockPicture[ pf.ns ] = {
			evaluated: true
		};

		pf.removeVideoShim = function() {
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

		ok( mockPicture[ pf.ns ].evaluated );
	});

	test( "`img` with `sizes` but no `srcset` shouldn’t fail silently", function() {
		expect( 0 );
		var el = document.createElement( "img" );

		el.setAttribute( "sizes", "100vw" );
		el.setAttribute( "class", "no-src" );
		(document.body || document.documentElement).appendChild( el );

		try { picturefill({ reevaluate: false, elements: document.querySelector( ".no-src" ) }); } catch (e) { console.log( e ); ok( false ); }

		el.parentNode.removeChild( el );
	});

	test( "Mixed content should be blocked", function() {
		pf.restrictsMixedContent = function() {
			return true;
		};
		var image, candidates;

		candidates = [
			{ resolution: 1, url: "http://example.org/bar" },
		];

		image = {
			src: "foo"
		};

		pf.applyBestCandidate( candidates, image );

		equal( image.src, "foo" );

	});

	test( "`img` can be added outside the DOM without errors", function() {
		var img = document.createElement( "img" );

		img.setAttribute( "srcset", "data:img 500w" );

		picturefill( { elements: [ img ] } );

		assert.equal( img.currentSrc || img.src, "data:img" );
	});

})( window, jQuery );
