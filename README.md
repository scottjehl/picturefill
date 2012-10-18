# Picturefill

A Responsive Images approach that you can use today, that mimics the [proposed picture element](http://www.w3.org/community/respimg/wiki/Picture_Element_Proposal) using `div`s, for safety sake.

* Author: Scott Jehl (c) 2012
* License: MIT/GPLv2

**Demo URL:** [http://scottjehl.github.com/picturefill/](http://scottjehl.github.com/picturefill/)

**Note:** Picturefill works best in browsers that support CSS3 media queries. It includes (externally) the [matchMedia polyfill](https://github.com/paulirish/matchMedia.js/) which makes matchMedia work in `media-query`-supporting browsers that don't have `matchMedia`, or at least allows media types to be tested in most any browser. `matchMedia` and the `matchMedia` polyfill are not required for `picturefill` to work, but they are required to support the `media` attributes on `picture` `source` elements.

## Size and delivery

Currently, `picturefill.js` compresses to around 498bytes (~0.5kb), after minify and gzip. To minify, you might try these online tools: [Uglify]:(http://marijnhaverbeke.nl/uglifyjs), [Yahoo Compressor]:(http://refresh-sf.com/yui/), or [Closure Compiler](http://closure-compiler.appspot.com/home). Serve with gzip compression.

## Markup pattern and explanation

Mark up your responsive images like this. 

```html
	<div data-picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<div data-src="small.jpg"></div>
		<div data-src="medium.jpg"     data-media="(min-width: 400px)"></div>
		<div data-src="large.jpg"      data-media="(min-width: 800px)"></div>
		<div data-src="extralarge.jpg" data-media="(min-width: 1000px)"></div>

		<!-- Fallback content for non-JS browsers. Same img src as the initial, unqualified source element. -->
		<noscript>
			<img src="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		</noscript>
	</div>
```

Each `div[data-src]` element’s `data-media` attribute accepts any and all CSS3 media queries—such as `min` or `max` width, or even `min-device-pixel-ratio` for HD (retina) displays. 

### Explained...

Notes on the markup above...

* The `div[data-picture]` element's `alt` attribute is used as alternate text for the generated `img` element.
* The `div[data-picture]` element can have any number of `source` elements. The above example may contain more than the average situation would call for.
* Each `div[data-src]` element must have a `data-src` attribute specifying the image path. 
* It's generally a good idea to include one source element with no `media` qualifier, so it'll apply everywhere.
* Each `data-src` element can have an optional `media` attribute to make it apply in different media settings. Both media types and queries can be used, like any `media` attribute, but support for media queries depends on the browser (unsupporting browsers fail silently).
* The `matchMedia` polyfill (included in `/external`) is necessary to support the `media` attribute across browsers, even in browsers that support media queries, although it is becoming more widely supported in new browsers.
* The `noscript` element wraps the fallback image for non-JavaScript environments, and including this wrapper prevents browsers from fetching the fallback image during page load (causing unnecessary overhead). Generally, it's a good idea to reference a small image here, as it's likely to be loaded in older/underpowered mobile devices.
	
### HD Media Queries

Picturefill natively supports HD(Retina) image replacement.  While numerous other solutions exist, picturefill has the added benefit of performance for the user in only getting served one image.

* The `data-media` attribute supports [compound media queries](https://developer.mozilla.org/en-US/docs/CSS/Media_queries), allowing for very specific behaviors to emerge.  For example, a `data-media="(min-width: 400px) and (min-device-pixel-ratio: 2.0)` attribute can be used to serve a higher resolution version of the source instead of a standard definition image. Note you currently also need to add the `-webkit-min-device-pixel-ratio` prefix (e.g. for iOS devices).

```html
	<div data-picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<div data-src="small.jpg"></div>
		<div data-src="small.jpg"         data-media="(min-device-pixel-ratio: 2.0)"></div>
		<div data-src="medium.jpg"        data-media="(min-width: 400px)"></div>
		<div data-src="medium_x2.jpg"     data-media="(min-width: 400px) and (min-device-pixel-ratio: 2.0)"></div>
		<div data-src="large.jpg"         data-media="(min-width: 800px)"></div>
		<div data-src="large_x2.jpg"      data-media="(min-width: 800px) and (min-device-pixel-ratio: 2.0)"></div>	
		<div data-src="extralarge.jpg"    data-media="(min-width: 1000px)"></div>
		<div data-src="extralarge_x2.jpg" data-media="(min-width: 1000px) and (min-device-pixel-ratio: 2.0)"></div>	

		<!-- Fallback content for non-JS browsers. Same img src as the initial, unqualified source element. -->
		<noscript>
			<img src="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		</noscript>
	</div>
```

* Note: Supporting this many breakpoints quickly adds size to the DOM and increases implementation and maintenance time, so use this technique sparingly.

### Vector (SVG) support

Picturefill also natively supports loading SVG files as replacement images, for perfect scaling at any resolution. It can detect if support for inline SVGs is available and, if so, load an SVG file when a `type` attribute is provided.

```html
	<div data-picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<!-- If browser supports inline SVG, use image below: -->
		<div data-type="image/svg+xml" data-src="vector.svg"></div>
	
		<!-- Otherwise, fallback on JPEGs -->
		<div data-src="small.jpg"></div>
		<div data-src="small.jpg"         data-media="(min-device-pixel-ratio: 2.0)"></div>
		<div data-src="medium.jpg"        data-media="(min-width: 400px)"></div>
		<div data-src="medium_x2.jpg"     data-media="(min-width: 400px) and (min-device-pixel-ratio: 2.0)"></div>
		<div data-src="large.jpg"         data-media="(min-width: 800px)"></div>
		<div data-src="large_x2.jpg"      data-media="(min-width: 800px) and (min-device-pixel-ratio: 2.0)"></div>	
		<div data-src="extralarge.jpg"    data-media="(min-width: 1000px)"></div>
		<div data-src="extralarge_x2.jpg" data-media="(min-width: 1000px) and (min-device-pixel-ratio: 2.0)"></div>	
	
		<!-- Fallback content for non-JS browsers. Same img src as the initial, unqualified source element. -->
		<noscript><img src="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia"></noscript>
	</div>
```

## WordPress Plugin

Also included is a WordPress plugin, *WP picturefill*. WordPress automatically resizes images to create thumbnail, medium, large, and fullsize versions. The plugin loads these conditionally using picturefill. It also allows for SVG upload, and association of an SVG file with a normal raster image, so that the SVG may be included as a `<source>`.

## Support

Picturefill supports a broad range of browsers and devices (there are currently no known unsupported browsers), provided that you stick with the markup conventions provided.

