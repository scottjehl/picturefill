(function(window, jQuery) {
	if( window.HTMLPictureElement ){
		test( "Picture is natively supported", function() {
			ok( window.HTMLPictureElement );
		});

		return;
	}

	test("functional: The first matching `source` is selected.", function() {
		var pic = $( ".first-match" ),
				firstsource = pic.find( "source" ).eq( 0 ),
				img = pic.find( "img" );

		equal( img[ 0 ].getAttribute( "src" ), firstsource[ 0 ].getAttribute( "srcset" ) );
	});

	var pf, originalDprMethod, originalVideoShimMethod, originalMatchesMedia;

	pf = picturefill._;

	// reset stubbing
	module( "method", {
		setup: function() {
			originalDprMethod = pf.getDpr;
			originalVideoShimMethod = pf.removeVideoShim;
			originalMatchesMedia = pf.matchesMedia;
		},

		teardown: function() {
			pf.getDpr = originalDprMethod;
			pf.removeVideoShim = originalVideoShimMethod;
			pf.matchesMedia = originalMatchesMedia;
		}
	});

	test("getWidthFromLength", function() {
		equal(pf.getWidthFromLength('750px'), 750, "returns int value of width string");
	});

	test("findWidthFromSourceSize", function() {
		var sizes = "	 (max-width: 30em) 1000px,	 (max-width: 50em) 750px, 500px	 ";
		// mock match media
		var oldMatchesMedia = pf.matchesMedia;
		pf.matchesMedia = function(media) {
			return true;
		};
		var width = pf.findWidthFromSourceSize(sizes);
		equal(width, 1000, "returns 1000 when match media returns true");

		pf.matchesMedia = function(media) {
			return false;
		};
		var width = pf.findWidthFromSourceSize(sizes);
		equal(width, 500, "returns 500 when match media returns false");

		// restore `matchesMedia`
		pf.matchesMedia = oldMatchesMedia;
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
		deepEqual(pf.getCandidatesFromSourceSet(candidate1), expectedFormattedCandidates1, "Works!");

		var candidate2 = "images/pic-medium.png 1x, images/pic-medium-2x.png 2x";
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
		deepEqual(pf.getCandidatesFromSourceSet(candidate2), expectedFormattedCandidates2, "Works!");

		// Test with multiple spaces
		var candidate3 = "			images/pic-medium.png		 1x		,		 images/pic-medium-2x.png		 2x		";
		deepEqual(pf.getCandidatesFromSourceSet(candidate3), expectedFormattedCandidates2, "Works!")

		// Test with decimals
		var candidate4 = "			images/pic-smallest.png		 0.25x	 ,		images/pic-small.png		0.5x	 , images/pic-medium.png 1x";
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
		deepEqual(pf.getCandidatesFromSourceSet(candidate4), expectedFormattedCandidates4, "Works!");

		// Test with "sizes" passed with a px length specified
		var candidate5 = "			images/pic-smallest.png		 250w		,		 images/pic-small.png		 500w		, images/pic-medium.png 1000w";
		var sizes = "1000px";
		deepEqual(pf.getCandidatesFromSourceSet(candidate5, sizes), expectedFormattedCandidates4, "Works!");

		// Test with "sizes" passed with % lengths specified
		var candidate6 = "\npic320.png 320w	 , pic640.png		640w, pic768.png 768w, \
		\npic1536.png 1536w, pic2048.png	2048w	 ";
		var sizes = "	 (max-width: 30em) 100%,	 (max-width: 50em) 50%, 33%";
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
		var oldMatchesMedia = pf.matchesMedia;
		pf.matchesMedia = function(media) {
			return true;
		};
		var oldGetWidthFromLength = pf.getWidthFromLength;
		pf.getWidthFromLength = function(width) {
			return 640;
		}
		deepEqual(pf.getCandidatesFromSourceSet(candidate6, sizes), expectedCandidates, "Works!");

		// restores `matchesMedia` and `getWidthFromLength`
		pf.matchesMedia = oldMatchesMedia;
		pf.getWidthFromLength = oldGetWidthFromLength;
	});

	test("verifyTypeSupport", function() {
		expect( 4 );

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

		pf.types[ "foo" ] = function() {
			ok( true, "foo type function executed" );
		};

		pf.verifyTypeSupport({
			getAttribute: function() {
				return "foo";
			}
		});

		pf.types[ "bar" ] = "baz";

		equal( "baz", pf.verifyTypeSupport({
			getAttribute: function() {
				return "bar";
			}
		}));
	});

	test("applyBestCandidate", function() {
		var image, candidates;

		candidates = [
			{ resolution: 100, url: "100" },
			{ resolution: 200, url: "200" },
			{ resolution: 300, url: "300" }
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

		image.src = "foo300";
		image.currentSrc = "foo300";

		pf.applyBestCandidate( candidates, image );

		deepEqual(image.src, "foo300", "src left alone when matched" );
		deepEqual(image.currentSrc, "foo300", "currentSrc left alone when matched" );
	});

	test( "removeVideoShim", function() {
		var $videoShim = $( ".video-shim" );

		equal( $videoShim.find( "video" ).length, 1 );
		equal( $videoShim.find( "source" ).length, 2 );

		pf.removeVideoShim( $videoShim[0] );

		equal( $videoShim.find( "video" ).length, 0 );
		equal( $videoShim.find( "source" ).length, 2 );
	});

	test( "getMatch returns false when a source type is pending", function() {
		pf.types["foo"] = function() {};

		equal( pf.getMatch($(".pending-check")[0]), false, "pending type should be false" );
	});

	test( "getMatch returns source when it matches the media", function() {
		var $match = $( ".match-check ");
		pf.matchesMedia = function() {
			return true;
		};

		equal( pf.getMatch( $match[0] ), $match.find( "source" )[0] );
	});

	test( "getMatch returns undefined when no match is found", function() {
		pf.matchesMedia = function() {
			return false;
		};

		var $noMatch = $( ".no-match-check ");

		equal( pf.getMatch( $noMatch[0] ), undefined );
	});

	test( "getMatch returns undefined when no srcset is found", function() {
		var $noSrcset = $( ".no-srcset-check ");

		equal( pf.getMatch( $noSrcset[0] ), undefined );
	});

	test( "picturefill ignores elements when they are marked with a property", function() {
		expect( 0 );
		var mockPicture = {};

		mockPicture[ pf.ns ] = {
			evaluated: true
		};

		pf.removeVideoShim = function() {
			ok( false );
		};

		picturefill({ reevaluate: false, elements: [mockPicture] });
	});

	test( "picturefill marks elements with a property", function() {
		// NOTE requires at least one child image for the propery to be set
		var mockPicture = $( ".prop-check" )[0];
		picturefill({ reevaluate: false, elements: [ mockPicture ] });

		ok( mockPicture[ pf.ns ].evaluated );
	});
})( window, jQuery );
