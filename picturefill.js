/*! Picturefill - Responsive Images that work today.
 *  Author: Scott Jehl, Filament Group, 2012 (new proposal implemented by Shawn Jansepar)
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

    /*
     * Shortcut method for matchMedia (for easy overriding in tests)
     */
    w._matchesMedia = function(media) {
        return w.matchMedia && w.matchMedia(media).matches;
    }

    /*
     * Shortcut method for `devicePixelRatio` (for easy overriding in tests)
     */
    w._getDpr = function() {
        return (window.devicePixelRatio || 1);
    }

    /** 
     * Get width in css pixel value from a "length" value
     * http://dev.w3.org/csswg/css-values-3/#length-value
     */
    var lengthEl;
    w._getCachedLengthEl = function() {
        lengthEl = lengthEl || document.createElement('div');
        if (!doc.body) {
            return;
        }
        doc.body.appendChild(lengthEl);
        return lengthEl;
    } 
    w._getWidthFromLength = function(length) {
        var lengthEl = w._getCachedLengthEl();
        lengthEl.style.cssText = 'width: ' + length + ';';
        // Using offsetWidth to get width from CSS
        return lengthEl.offsetWidth;
    };

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
            
            // Split "(min-width: 50em) 100%" into separate strings
            var match = /(\([^)]+\))?\s*([^\s]+)/g.exec(sourceSize);
            if (!match) {
                continue;
            }
            var length = match[2];
            var media;
            if (!match[1]) {
                // if there is no media query, choose this as our winning length
                winningLength = length;
                break;      
            } else {
                media = match[1];
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
            return 300;
        }

        // pass the length to a method that can properly determine length
        // in pixels based on these formats: http://dev.w3.org/csswg/css-values-3/#length-value
        var winningLengthInt = w._getWidthFromLength(winningLength);
        return winningLengthInt;
    };

    /**
     * Takes a srcset in the form of url/
     * ex. "images/pic-medium.png 1x, images/pic-medium-2x.png 2x" or
     *     "images/pic-medium.png 400w, images/pic-medium-2x.png 800w" or
     *     "images/pic-small.png"
     * Get an array of image candidates in the form of 
     *      {url: "/foo/bar.png", resolution: 1}
     * where resolution is http://dev.w3.org/csswg/css-values-3/#resolution-value
     * If sizes is specified, resolution is calculated
     */
    w._getCandidatesFromSourceSet = function(srcset, sizes) {
        var candidates = srcset.trim().split(/\s*,\s*/);
        var formattedCandidates = [];
        if (sizes) {
            var widthInCssPixels = w._findWidthFromSourceSize(sizes);
        }
        for (var i = 0, len = candidates.length; i < len; i++) {
            var candidate = candidates[i];
            var candidateArr = candidate.split(/\s+/);
            var sizeDescriptor = candidateArr[1];
            var resolution;
            if (sizeDescriptor && (sizeDescriptor.slice(-1) === 'w' || sizeDescriptor.slice(-1) === 'x')) {
                sizeDescriptor = sizeDescriptor.slice(0, -1);
            }
            if (sizes) {
                // get the dpr by taking the length / width in css pixels
                resolution = parseFloat((parseInt(sizeDescriptor, 10)/widthInCssPixels).toFixed(2));
            } else {
                // get the dpr by grabbing the value of Nx
                resolution = sizeDescriptor ? parseFloat(sizeDescriptor, 10) : w._getDpr();
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
                if (matchedEl.hasAttribute('data-sizes')) {
                    var sizes = matchedEl.getAttribute('data-sizes');
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
    //  var ps = w.document.getElementsByTagName( "span" );

    //  // Loop the pictures
    //  for( var i = 0, il = ps.length; i < il; i++ ){
    //      if( ps[ i ].getAttribute( "data-picture" ) !== null ){

    //          var sources = ps[ i ].getElementsByTagName( "span" ),
    //              matches = [];

    //          // See if which sources match
    //          for( var j = 0, jl = sources.length; j < jl; j++ ){
    //              var media = sources[ j ].getAttribute( "data-media" );
    //              // if there's no media specified, OR w.matchMedia is supported 
    //              if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){
    //                  matches.push( sources[ j ] );
    //              }
    //          }

    //      // Find any existing img element in the picture element
    //      var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];

    //      if( matches.length ){
    //          var matchedEl = matches.pop();
    //          if( !picImg || picImg.parentNode.nodeName === "NOSCRIPT" ){
    //              picImg = w.document.createElement( "img" );
    //              picImg.alt = ps[ i ].getAttribute( "data-alt" );
    //          }
    //          else if( matchedEl === picImg.parentNode ){
    //              // Skip further actions if the correct image is already in place
    //              continue;
    //          }

    //          picImg.src =  matchedEl.getAttribute( "data-src" );
    //          matchedEl.appendChild( picImg );
    //          picImg.removeAttribute("width");
    //          picImg.removeAttribute("height");
    //      }
    //      else if( picImg ){
    //          picImg.parentNode.removeChild( picImg );
    //      }
    //  }
    //  }
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
