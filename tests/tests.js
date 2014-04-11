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

	var originalDprMethod;

	// reset stubbing
	module( "method", {
		setup: function() {
			originalDprMethod = picturefill._.getDpr;
		},

		teardown: function() {
			picturefill._.getDpr = originalDprMethod;
		}
	});

	test("getWidthFromLength", function() {
		equal(picturefill._.getWidthFromLength('750px'), 750, "returns int value of width string");
	});

	test("findWidthFromSourceSize", function() {
		var sizes = "	 (max-width: 30em) 1000px,	 (max-width: 50em) 750px, 500px	 ";
		// mock match media
		var oldMatchesMedia = picturefill._.matchesMedia;
		picturefill._.matchesMedia = function(media) {
			return true;
		};
		var width = picturefill._.findWidthFromSourceSize(sizes);
		equal(width, 1000, "returns 1000 when match media returns true");

		picturefill._.matchesMedia = function(media) {
			return false;
		};
		var width = picturefill._.findWidthFromSourceSize(sizes);
		equal(width, 500, "returns 500 when match media returns false");

		// restore `matchesMedia`
		picturefill._.matchesMedia = oldMatchesMedia;
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
		deepEqual(picturefill._.getCandidatesFromSourceSet(candidate1), expectedFormattedCandidates1, "Works!");

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
		deepEqual(picturefill._.getCandidatesFromSourceSet(candidate2), expectedFormattedCandidates2, "Works!");

		// Test with multiple spaces
		var candidate3 = "			images/pic-medium.png		 1x		,		 images/pic-medium-2x.png		 2x		";
		deepEqual(picturefill._.getCandidatesFromSourceSet(candidate3), expectedFormattedCandidates2, "Works!")

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
		deepEqual(picturefill._.getCandidatesFromSourceSet(candidate4), expectedFormattedCandidates4, "Works!");

		// Test with "sizes" passed with a px length specified
		var candidate5 = "			images/pic-smallest.png		 250w		,		 images/pic-small.png		 500w		, images/pic-medium.png 1000w";
		var sizes = "1000px";
		deepEqual(picturefill._.getCandidatesFromSourceSet(candidate5, sizes), expectedFormattedCandidates4, "Works!");

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
		var oldMatchesMedia = picturefill._.matchesMedia;
		picturefill._.matchesMedia = function(media) {
			return true;
		};
		var oldGetWidthFromLength = picturefill._.getWidthFromLength;
		picturefill._.getWidthFromLength = function(width) {
			return 640;
		}
		deepEqual(picturefill._.getCandidatesFromSourceSet(candidate6, sizes), expectedCandidates, "Works!");

		// restores `matchesMedia` and `getWidthFromLength`
		picturefill._.matchesMedia = oldMatchesMedia;
		picturefill._.getWidthFromLength = oldGetWidthFromLength;
	});

	test("verifyTypeSupport", function() {
		expect( 4 );

		// if the type attribute is supported it should return true
		ok(picturefill._.verifyTypeSupport({
			getAttribute: function() {
				return "";
			}
		}));

		// if the type attribute is supported it should return true
		ok(picturefill._.verifyTypeSupport({
			getAttribute: function() {
				return null;
			}
		}));

		picturefill._.types[ "foo" ] = function() {
			ok( true, "foo type function executed" );
		};

		picturefill._.verifyTypeSupport({
			getAttribute: function() {
				return "foo";
			}
		});

		picturefill._.types[ "bar" ] = "baz";

		equal( "baz", picturefill._.verifyTypeSupport({
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

		picturefill._.getDpr = function() {
			return 300;
		};

		picturefill._.applyBestCandidate( candidates, image );

		deepEqual(image.src, candidates[2].url, "uses the url from the best px fit" );
		deepEqual(image.currentSrc, candidates[2].url, "uses the url from the best px fit" );

		image.src = "foo300";
		image.currentSrc = "foo300";

		picturefill._.applyBestCandidate( candidates, image );

		deepEqual(image.src, "foo300", "src left alone when matched" );
		deepEqual(image.currentSrc, "foo300", "currentSrc left alone when matched" );
	});

	test( "removeVideoShim", function() {
		var $videoShim = $( ".video-shim" );

		equal( $videoShim.find( "video" ).length, 1 );
		equal( $videoShim.find( "source" ).length, 2 );

		picturefill._.removeVideoShim( $videoShim[0] );

		equal( $videoShim.find( "video" ).length, 0 );
		equal( $videoShim.find( "source" ).length, 2 );
	});

	test( "picturefill ignores elements when they are marked with an attr", function() {
		expect( 0 );
		var mockPicture = {
			hasAttribute: function() {
				return true
			},

			setAttribute: function() {
				ok( false, "should not be called" );
			}
		};

		picturefill({ force: false, pictures: [mockPicture] });
	});

	test( "picturefill marks with an attr", function() {
		var mockPicture = $( ".attr-check" )[0];
		picturefill({ force: false, pictures: [ mockPicture ] });

		ok( mockPicture.hasAttribute( "data-picture-evaluated" ) );
	});
})( window, jQuery );
