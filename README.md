# Picturefill
A Responsive Images approach that you can use today that mimics the [proposed picture element](http://www.w3.org/TR/2013/WD-html-picture-element-20130226/) using `span`s, for safety sake.


* Author: Scott Jehl (c) 2012
* License: MIT/GPLv2

**Demo URL:** [http://scottjehl.github.com/picturefill/](http://scottjehl.github.com/picturefill/)

**Note:** Picturefill works best in browsers that support CSS3 media queries. The demo page references (externally) the [matchMedia polyfill](https://github.com/paulirish/matchMedia.js/) which makes matchMedia work in `media-query`-supporting browsers that don't support `matchMedia`. `matchMedia` and the `matchMedia` polyfill are not required for `picturefill` to work, but they are required to support the `media` attributes on `picture` `source` elements. In non-media query-supporting browsers, the `matchMedia` polyfill will allow for querying native media types, such as `screen`, `print`, etc.

## Size and delivery

Currently, `picturefill.js` compresses to around 498bytes (~0.5kb), after minify and gzip. To minify, you might try these online tools: [Uglify](http://marijnhaverbeke.nl/uglifyjs), [Yahoo Compressor](http://refresh-sf.com/yui/), or [Closure Compiler](http://closure-compiler.appspot.com/home). Serve with gzip compression.

## Markup pattern and explanation

Mark up your responsive images like this.

```html
	<span data-picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<span data-src="small.jpg"></span>
		<span data-src="medium.jpg"     data-media="(min-width: 400px)"></span>
		<span data-src="large.jpg"      data-media="(min-width: 800px)"></span>
		<span data-src="extralarge.jpg" data-media="(min-width: 1000px)"></span>

		<!-- Fallback content for non-JS browsers. Same img src as the initial, unqualified source element. -->
		<noscript>
			<img src="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		</noscript>
	</span>
```

Each `span[data-src]` element’s `data-media` attribute accepts any and all CSS3 media queries—such as `min` or `max` width, or even `min-resolution` for HD (retina) displays.

**NOTE:** if you need/prefer to use `div`s in your picturefill markup, you may want to grab v1.0.0: https://github.com/scottjehl/picturefill/tree/v1.0.0 . The current version here made the switch to `span` to better mimic an `img` element's inline nature, as well as fix a bug or two for WordPress users.

### Explained...

Notes on the markup above...

* The `span[data-picture]` element's `alt` attribute is used as alternate text for the `img` element that picturefill generates upon a successful source match.
* The `span[data-picture]` element can contain any number of `span[data-source]` elements. The above example may contain more than the average situation may call for.
* Each `span[data-src]` element must have a `data-src` attribute specifying the image path.
* It's generally a good idea to include one source element with no `media` qualifier, so it'll apply everywhere - typically a mobile-optimized image is ideal here.
* Each `[data-src]` element can have an optional `[data-media]` attribute to make it apply in specific media settings. Both media types and queries can be used, like a native `media` attribute, but support for media _queries_ depends on the browser (unsupporting browsers fail silently).
* The `matchMedia` polyfill (included in the `/external` folder) is necessary to support the `data-media` attribute across browsers (such as IE9), even in browsers that support media queries, although it is becoming more widely supported in new browsers.
* The `noscript` element wraps the fallback image for non-JavaScript environments, and including this wrapper prevents browsers from fetching the fallback image during page load (causing unnecessary overhead). Generally, it's a good idea to reference a small mobile optimized image here, as it's likely to be loaded in older/underpowered mobile devices.

### How the `img` is appended

Upon finding a matching `span[data-src]` element, picturefill will generate an `img` element referencing that `span`'s `data-src` attribute value and append the `img` to the active, matching `span[data-src]` element. This means you can target CSS styles specific to the active image based on the breakpoint that is in play, perhaps by adding a class to each span. For example, if you have the following markup...

```html
	<span class="picture" data-picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<span class="sml" data-src="small.jpg"></span>
		<span class="med" data-src="medium.jpg"     data-media="(min-width: 400px)"></span>
		<span class="lrg" data-src="large.jpg"      data-media="(min-width: 800px)"></span>
````

...then you could write styles specific to each of the images, which may be handy for certain layout situations.

```css
	.picture .sml img { /* Styles for the small image */ }
	.picture .med img { /* Styles for the medium image */ }
	.picture .lrg img { /* Styles for the large image */ }
````


### HD Media Queries

Picturefill natively supports HD(Retina) image replacement.  While numerous other solutions exist, picturefill has the added benefit of performance for the user in only being served one image.

* The `data-media` attribute supports [compound media queries](https://developer.mozilla.org/en-US/docs/CSS/Media_queries), allowing for very specific behaviors to emerge.  For example, a `data-media="(min-width: 400px) and (min-device-pixel-ratio: 2.0)` attribute can be used to serve a higher resolution version of the source instead of a standard definition image. Note you currently also need to add the `-webkit-min-device-pixel-ratio` prefix (e.g. for iOS devices).

```html
	<span data-picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<span data-src="small.jpg"></span>
		<span data-src="small_x2.jpg"      data-media="(min-device-pixel-ratio: 2.0)"></span>
		<span data-src="medium.jpg"        data-media="(min-width: 400px)"></span>
		<span data-src="medium_x2.jpg"     data-media="(min-width: 400px) and (min-device-pixel-ratio: 2.0)"></span>
		<span data-src="large.jpg"         data-media="(min-width: 800px)"></span>
		<span data-src="large_x2.jpg"      data-media="(min-width: 800px) and (min-device-pixel-ratio: 2.0)"></span>
		<span data-src="extralarge.jpg"    data-media="(min-width: 1000px)"></span>
		<span data-src="extralarge_x2.jpg" data-media="(min-width: 1000px) and (min-device-pixel-ratio: 2.0)"></span>

		<!-- Fallback content for non-JS browsers. Same img src as the initial, unqualified source element. -->
		<noscript>
			<img src="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		</noscript>
	</span>
```

* Note: Supporting this many breakpoints quickly adds size to the DOM and increases implementation and maintenance time, so use this technique sparingly.

### Supporting IE Desktop

Internet Explorer 8 and older have no support for CSS3 Media Queries, so in the examples above, IE will receive the first `data-src`
 image reference (or the last one it finds that has no `data-media` attribute). If you'd like to serve a larger image to IE desktop
browsers, you might consider using conditional comments, like this:

```html
	<span data-picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<span data-src="small.jpg"></span>
		<span data-src="medium.jpg" data-media="(min-width: 400px)"></span>

		<!--[if (lt IE 9) & (!IEMobile)]>
		    <span data-src="medium.jpg"></span>
		<![endif]-->

		<!-- Fallback content for non-JS browsers. Same img src as the initial, unqualified source element. -->
		<noscript>
			<img src="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		</noscript>
	</span>
```

### Deferred loading

If picturefill is deferred until after load is fired, images will not load unless the browser window is resized.
Picturefill is intentionally exposed to the global space, in the unusual situation where you might want to defer loading of picturefill you can explicitly call window.picturefill().

## Support

Picturefill supports a broad range of browsers and devices (there are currently no known unsupported browsers), provided that you stick with the markup conventions provided.

