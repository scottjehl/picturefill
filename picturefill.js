/*! Picturefill - Responsive Images that work today.
 *  Author: Scott Jehl, Filament Group, 2012
 *  License: MIT/GPLv2
 *  Spec: http://picture.responsiveimages.org/
 */

(function(w, doc) {
	// Enable strict mode
	"use strict";

	var img;
	w.srcsetSupported = function() {
		img = img || new Image();
		return 'srcset' in img;
	}

    // /**
    //  * Get width of browser in CSS pixels
    //  * http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
    //  */
    w._getViewportWidth = function() {
        if (typeof( window.innerWidth ) == 'number') {
            return window.innerWidth;
        } else {
            return document.documentElement.clientWidth || document.body && document.body.clientWidth;
        }
    };

    w._matchesMedia = function(media) {
    	return w.matchMedia && w.matchMedia(media).matches;
    }

    /*
     * Takes a string of sizes and returns the width in pixels as an int
     */
	w._findWidthFromSourceSize = function(sourceSizeListStr) {
		// Split up source size list, ie (max-width: 30em) 100%, (max-width: 50em) 50%, 33%
		var sourceSizeList = sourceSizeListStr.trim().split(/\s*,\s*/);
		var winningLength;
		for (var i=0, len=sourceSizeList.length; i < len; i++) {
			// Match <media-query>? length, ie (min-width: 50em) 100%
			var sourceSize = sourceSizeList[i];
	        var match = sizes.match(/(\([^\s]+\))?\s*([^\s]+)/g);
	        if (!match) {
	        	continue;
	        }
	        var length = match[1];
	        var media;
	        if (!sourceSize[0]) {
	        	// if there is no media query, choose this as our winning length
	        	winningLength = length;
	        	break;   	
	        } else {
	        	media = sourceSize[0];
	        }

	        if (w._matchesMedia(media)) {
	        	// if the media query matches, choose this as our winning length
	        	// and end algorithm
	        	winningLength = length;
	        	break;
	        }
		}

		// default to 300px if no length was selected
		if (!winningLength) {
			winningLength = '300px';
		}

		// if winningLength is a percentage, calculate width, else, use number
        var winningLengthInt;
        if (winningLength.slice(-1) === '%') {
        	// grab the width of the viewport to determine # of pixeles based on
        	// percentage
        	var viewportWidth = w._getViewportWidth();
            winningLengthInt = viewportWidth * (parseInt(winningLength.slice(0, -1), 10) / 100);
        } else {
            winningLengthInt = parseInt(winningLength, 10);
        }
        return winningLengthInt;
	};

	w._getDpr = function() {
		return (window.devicePixelRatio || 1);
	}

    /**
     * Takes a srcset in the form of url/
     * ex. images/pic-medium.png 1x, images/pic-medium-2x.png 2x and
     *     images/pic-medium.png 400w, images/pic-medium-2x.png 800w
     * Get an array of image candidates in the form of 
     *      {url: "/foo/bar.png", resolution: 1}
     * where resolution is http://dev.w3.org/csswg/css-values-3/#resolution-value
     * If sizes is specified, resolution is calculated
     */
    w._getCandidatesFromSourceSet = function(srcset, sizes) {
        var candidates = srcset.trim().split(/\s*,\s*/);
        var formattedCandidates = [];
        for (var i = 0; i < candidates.length; i++) {
            var candidate = candidates[i];
            var candidateArr = candidate.split(/\s+/);
            var sizeDescriptor = candidateArr[1];
            var resolution;
            if (sizes) {
            	var width = w._findWidthFromSourceSize(sizes);
                // get the dpr by taking the length / image width
                // TODO: must take into account the "w" on sizeDescriptors
                resolution = parseFloat((parseInt(sizeDescriptor, 10)/width).toFixed(2));
            } else {
                // get the dpr by grabbing the value of Nx
                resolution = sizeDescriptor ? parseFloat(sizeDescriptor.slice(0, -1), 10) : w._getDpr();
            }

            var formattedCandidate = {
                url: candidateArr[0],
                resolution: resolution
            };
            formattedCandidates.push(formattedCandidate);
        }
        return formattedCandidates;
    };

	w.picturefill = function() {
        // Loop through all images on the page that are `<picture>` or `<span data-picture>`
        var pictures = doc.getElementsByTagName("picture");
        pictures = pictures.length ? pictures : doc.getElementsByTagName("span");
        for (var i=0, plen = pictures.length; i < plen; i++) {
            var picture = pictures[i];
            if (picture.nodeName !== 'PICTURE' && picture.getAttribute('data-picture') === null) {
                continue;
            }
            var matches = [];
            var sources = picture.childNodes;
            // Go through each child, and if they have media queries, evaluate them
            // and add them to matches
            for (var j=0, slen = sources.length; j < slen; j++) {
            	var source = sources[j];
            	if (source.nodeName !== 'SOURCE' && source.nodeName !== 'SPAN') {
            		continue;
            	}
 				var media = sources[j].getAttribute( "data-media" );
 
 				// if source does not have a srcset attribute, skip
 				if (!source.hasAttribute('data-srcset')) {
 					continue;
 				}

 				// if there's no media specified, OR w.matchMedia is supported
 				if(!media || w._matchesMedia(media)){
 					matches.push(source);
 				}
            }

	 		// Find any existing img element in the picture element
	 		var picImg = picture.getElementsByTagName("img")[0];
	 		if (matches.length) {
	 			var matchedEl = matches.pop();
				if( !picImg || picImg.parentNode.nodeName === "NOSCRIPT" ){
					picImg = doc.createElement( "img" );
					picImg.alt = picture.getAttribute( "data-alt" );
				}
	 			var srcset = matchedEl.getAttribute('data-srcset');
	 			var candidates;
	 			if (matchedEl.hasAttribute('sizes')) {
	 				var sizes = matchedEl.getAttribute('sizes');
	 				candidates = w._getCandidatesFromSourceSet(srcset, sizes);
	 			} else {
	 				candidates = w._getCandidatesFromSourceSet(srcset);
	 			}

	            // Sort image candidates before figuring out which one to use
	            var sortedCandidates = candidates.sort(function(a, b) {
	                return a.resolution > b.resolution;
	            });
	            // Determine which image to use based on image candidates array
	            for (var j=0; j < sortedCandidates.length; j++) {
	                var candidate = sortedCandidates[j];
	                if (candidate.resolution >= w._getDpr()) {
	                    picImg.src = candidate.url;
	                    break;
	                }
	            }

	            // If none of the image candidates worked out,
	            // set src to data-src
	            if (!picImg.src && picImg.hasAttribute('data-src')) {
	                picImg.src = picImg.getAttribute('data-src');
	            }
	            matchedEl.appendChild(picImg);
	 		}

	 	}
	};


	// w.picturefill = function() {
	// 	var ps = w.document.getElementsByTagName( "span" );

	// 	// Loop the pictures
	// 	for( var i = 0, il = ps.length; i < il; i++ ){
	// 		if( ps[ i ].getAttribute( "data-picture" ) !== null ){

	// 			var sources = ps[ i ].getElementsByTagName( "span" ),
	// 				matches = [];

	// 			// See if which sources match
	// 			for( var j = 0, jl = sources.length; j < jl; j++ ){
	// 				var media = sources[ j ].getAttribute( "data-media" );
	// 				// if there's no media specified, OR w.matchMedia is supported 
	// 				if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){
	// 					matches.push( sources[ j ] );
	// 				}
	// 			}

	// 		// Find any existing img element in the picture element
	// 		var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];

	// 		if( matches.length ){
	// 			var matchedEl = matches.pop();
	// 			if( !picImg || picImg.parentNode.nodeName === "NOSCRIPT" ){
	// 				picImg = w.document.createElement( "img" );
	// 				picImg.alt = ps[ i ].getAttribute( "data-alt" );
	// 			}
	// 			else if( matchedEl === picImg.parentNode ){
	// 				// Skip further actions if the correct image is already in place
	// 				continue;
	// 			}

	// 			picImg.src =  matchedEl.getAttribute( "data-src" );
	// 			matchedEl.appendChild( picImg );
	// 			picImg.removeAttribute("width");
	// 			picImg.removeAttribute("height");
	// 		}
	// 		else if( picImg ){
	// 			picImg.parentNode.removeChild( picImg );
	// 		}
	// 	}
	// 	}
	// };

	// Run on resize and domready (w.load as a fallback)
	if( w.addEventListener ){
		w.addEventListener( "resize", w.picturefill, false );
		w.addEventListener( "DOMContentLoaded", function(){
			w.picturefill();
			// Run once only
			w.removeEventListener( "load", w.picturefill, false );
		}, false );
		w.addEventListener( "load", w.picturefill, false );
	}
	else if( w.attachEvent ){
		w.attachEvent( "onload", w.picturefill );
	}

})(this, document);
