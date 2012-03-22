# Picturefill

A polyfill for proposed behavior of the picture element, which does not yet exist, but should. :)

* Author: Scott Jehl (c) 2012
* License: MIT/GPLv2
* Notes: For active discussion of the picture element, see [http://www.w3.org/community/respimg/](http://www.w3.org/community/respimg/). While this code does work, it is intended to be used only for example purposes until either:

	A) A W3C Candidate Recommendation for <picture> is released
		
	B) A major browser implements <picture>

Demo URL: [http://scottjehl.github.com/picturefill/](http://scottjehl.github.com/picturefill/)

Note: The demo only polyfills `picture` support for browsers that support CSS3 media queries, but it includes (externally) the [matchMedia polyfill](https://github.com/paulirish/matchMedia.js/) which makes matchMedia work in `media-query`-supporting browsers that don't have `matchMedia`, or at least allows media types to be tested in most any browser. `matchMedia` and the `matchMedia` polyfill are not required for `picture` to work, but they are required to support the `media` attributes on `picture` `source` elements.

## Size and delivery

Currently, `picturefill.js` compresses to around 498bytes (~0.5kb), after minify and gzip. To minify, you might try these online tools: [Uglify]:(http://marijnhaverbeke.nl/uglifyjs), [Yahoo Compressor]:(http://refresh-sf.com/yui/), or [Closure Compiler](http://closure-compiler.appspot.com/home). Serve with gzip compression.

`Picturefill` performs a html5-shiv style workaround to get `picture` elements recognized in IE browsers. Because of that, you must reference it from the `head` of your document. If you'd prefer not referencing it from `head`, you'll need to at least call `document.createElement("picture"); document.createElement("source");` somewhere in the head of your document, and then you can load `picturefill.js` whenever you want.

## Markup pattern and explanation

While the [proposed markup for the `picture` element](http://www.w3.org/community/respimg/) is quite simple, enabling its use in browsers that don't yet support it requires a few unfortunate tweaks. The following markup pattern is intended to "bulletproof" existing browser support for `picture` without interfering with future native implementations.

		<picture alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
			<!-- <source src="small.jpg"> -->
			<source src="small.jpg">
			<!-- <source src="medium.jpg" media="(min-width: 400px)"> -->
			<source src="medium.jpg" media="(min-width: 400px)">
			<!-- <source src="large.jpg" media="(min-width: 800px)"> -->
			<source src="large.jpg" media="(min-width: 800px)">
			
			<!-- Fallback content for non-JS browsers. Same src as the initial source element. -->
			<noscript><img src="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia"></noscript>
		</picture>

### Explained...

Notes on the markup above...

* The `picture` element's `alt` attribute is used as alternate text for the generated `img` element.
* The `picture` element can have any number of `source` elements. The above example may contain more than the average situation would call for.
* Each `source` element must have a `src` attribute specifying the image path. 
* It's generally a good idea to include one source element with no `media` qualifier, so it'll apply everywhere.
* Each `source` element can have an optional `media` attribute to make it apply in different media settings. Both media types and queries can be used, like any `media` attribute, but support for media queries depends on the browser (unsupporting browsers fail silently).
* The `matchMedia` polyfill (included in `/external`) is necessary to support the `media` attribute across browsers, even in browsers that support media queries, although it is becoming more widely supported in new browsers.
* To ensure `picture` `source` elements are recognized in browsers like iOS4.3, Android 2.x, and IE9, `source` elements should be preceded by a comment containing that `source` element's markup. See the support table for information on which browsers rely on these comments (these browsers remove `source` elements from the DOM at load, so the comments provide a fallback).
* The `noscript` element wraps the fallback image for non-JavaScript environments, and including this wrapper prevents browsers from fetching the fallback image during page load (causing unnecessary overhead). Generally, it's a good idea to reference a small image here, as it's likely to be loaded in older/underpowered mobile devices.


## Support

Picturefill supports a broad range of browsers and devices (there are currently no known unsupported browsers), provided that you stick with the markup conventions provided.

The following table covers some of the major platforms tested so far and their mode of support for the picture element, and picturefill.

<table>
	<tr><th>Browser</th>								<th>Support Type</th></tr>
	<tr><td>Android 1.6 Webkit</td>						<td>Full</td></tr>
	<tr><td>Android 2.1 Webkit</td>						<td>Comment fallbacks used</td></tr>
	<tr><td>Android 2.2 Webkit</td>						<td>Comment fallbacks used</td></tr>
	<tr><td>Android 2.3 Webkit</td>						<td>Comment fallbacks used</td></tr>
	<tr><td>Android 4.x Webkit</td>						<td>Full</td></tr>
	<tr><td>iOS 4.3 Safari</td>							<td>Comment fallbacks used</td></tr>
	<tr><td>iOS 5.0 Safari</td>							<td>Full</td></tr>
	<tr><td>Opera Mobile</td>							<td>Full</td></tr>
	
	<tr><td>Chrome Mac (tested v17)</td>				<td>Full</td></tr>
	<tr><td>Opera Mac Desktop (tested v11)</td>			<td>Full</td></tr>
	<tr><td>Firefox Mac Desktop (tested v3.0+)</td>		<td>Full</td></tr>
	<tr><td>IE 6</td>									<td>Full (*no media query support, though)</td></tr>
	<tr><td>IE 7 </td>									<td>Full (*no media query support, though)</td></tr>
	<tr><td>IE 8</td>									<td>Full (*no media query support, though)</td></tr>
	<tr><td>IE 9</td>									<td>Comment fallbacks used</td></tr>
	<tr><td>IE 10</td>									<td>Full</td></tr>
</tbody>
</table>

...More testing wanted! :)