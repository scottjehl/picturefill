
# Picturefill ![build-status](https://api.travis-ci.org/scottjehl/picturefill.svg)
A Polyfill for the [HTML Picture Element](http://picture.responsiveimages.org/) that you can use today.
* Authors: Scott Jehl, Mat Marquis, Shawn Jansepar (2.0 refactor lead), and many more: see Authors.txt
* License: MIT

**Demo URL:** [http://scottjehl.github.com/picturefill/](http://scottjehl.github.com/picturefill/)

**Draft Specification:** [http://picture.responsiveimages.org/](http://picture.responsiveimages.org/)

**Note:** Picturefill works best in browsers that support CSS3 media queries. The demo page references (externally) the [matchMedia polyfill](https://github.com/paulirish/matchMedia.js/) which makes matchMedia work in media query-supporting browsers that don’t support `matchMedia`. `matchMedia` and the `matchMedia` polyfill are not required for `picturefill` to work, but they are required to support the `media` attributes on `picture` `source` elements. In browsers that don’t have native support for media queries, the `matchMedia` polyfill will allow for querying native media types, such as `screen`, `print`, etc.

## Usage

The following snippet will load the polyfill asynchronously and poll until the document is ready, in order to start image downloads as fast as possible (instead of waiting) until DOMContentLoaded). It will also conditionally load matchMedia if the browser doesn’t support it.

```html
	<head>
	<script async="true" src="picturefill.js"></script>
```

If you're loading picturefill.js asynchronously—and not already using a recent version of the [HTML5 Shiv](https://github.com/aFarkas/html5shiv) with support for `picture`—be sure to place the following in the `head` of your page to ensure old IE support:

```html
<script>
// Picture element HTML shim|v it for old IE (pairs with Picturefill.js)
document.createElement( "picture" );
document.createElement( "source" );
</script>
```

If you aren’t loading the script asynchronously, you can still 
load picturefill.js as usual just before the `</body>` tag—though we don’t recommend this. It could take a long time
before executing, causing a visible delay before images are rendered.

## Markup pattern and explanation

*Using media queries:*

```html
	<picture>
		<!-- Video tag needed in order to use <source> in IE9 -->
		<!--[if IE 9]><video style="display: none;"><![endif]-->
		<source srcset="images/extralarge.jpg" media="(min-width: 1000px)"></source>
		<source srcset="images/large.jpg" media="(min-width: 800px)"></source>
		<source srcset="images/medium.jpg" media="(min-width: 400px)"></source>
		<source srcset="images/small.jpg"></source>
		<!--[if IE 9]></video><![endif]-->

		<!-- Fallback content: -->
		<img srcset="images/small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
	</picture>
```

The `picture` element can contain any number of `source` elements. The above example likely contains more sources than you’ll need. Each `source` element accepts a `media` attribute, which tells the UA the most appropriate source file to load in the inner `img`. Both media types and queries can be used, like a native `media` attribute, but support for media _queries_ depends on the browser (unsupporting browsers fail silently).

`source` selection is based on the first matching `media` attribute. You’ll want to present the larger options first when using `min-width` media queries, and last when using `max-width` media queries.

Each `source` element must have a `srcset` attribute specifying one or more image paths. `source[srcset]` accepts a single image source to be served based entirely on the media query within the `media` attribute (`srcset="images/small.jpg"`), or a set of sources and resolution options (`srcset="images/small.png 0.5x, images/medium.png 1x, images/large.png 2x"`).

_Though media queries are well supported in modern browsers, the `matchMedia` polyfill (included in the `/external` folder) is necessary for parsing media queries in `media` attributes in browser without native media query support._

*Resolution options*

```html
	<picture>
		<!-- Video tag needed in order to use <source> in IE9 -->
		<!--[if IE 9]><video style="display: none;"><![endif]-->
		<source srcset="images/large.jpg 1x, images/extralarge.jpg 2x" media="(min-width: 800px)"></source>
		<source srcset="images/small.jpg 1x, images/medium.jpg 2x"></source>
		<!--[if IE 9]></video><![endif]-->

		<!-- Fallback content: -->
		<img srcset="images/small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
	</picture>
```

The `1x`, `2x` syntax in `source[srcset]` acts as a shorthand for more complex resolution media queries, but the native markup will allow the UA to override requests for higher-resolution options based on a bandwidth limitations or a user preference (see #9 in the [Responsive Images Use Cases and Requirements](http://usecases.responsiveimages.org/#h2_requirements)).

Resolution options can be presented via [compound media queries](https://developer.mozilla.org/en-US/docs/CSS/Media_queries) as well (`(min-width: 600px) and (min-device-pixel-ratio: 2.0)`, for example) though this will mean _significantly_ more verbose sets of `source` elements, may require vendor prefixes for full support, and will not allow the user to override requests for higher resolution sources.

*`sizes`/`srcset`*

```html
	<picture>
		<!-- Video tag needed in order to use <source> in IE9 -->
		<!--[if IE 9]><video style="display: none;"><![endif]-->
		<source sizes="(max-width: 30em) 100%, (max-width: 50em) 75%, 50%"
				srcset="images/pic-small.png 400w, images/pic-medium.png 800w, images/pic-large.png 1200w"></source>
		<!--[if IE 9]></video><![endif]-->

		<!-- Fallback content for IE8 and older -->
		<img srcset="images/pic-small.png" alt="Obama with soldiers">
	</picture>
```

The `source[sizes]` syntax is used to define the size of the image across a number of breakpoints. Then, `srcset` defines an array of images and their inherent widths.

Based on the breakpoints defined in `sizes`, appropriate image will be chosen based on the size of the image source divided against the user’s viewport size and the appropriate source will be loaded for their resolution.

In the example above: given a 800 CSS pixel wide viewport, `"images/small.png 400w, images/medium.png 800w, images/large.png 1600w"` will be calculated to `"images/small.png 0.5x, images/medium.png 1x, images/large.png 2x"`. If that 800px viewport is on a 1x display, the user will recieve `medium.png`—if on a 2x display, `large.png`.

### Supporting IE Desktop

Internet Explorer 9 has some issues rendering custom elements like `picture` and `source`.
For IE9, you have to stick `<!--[if gte IE 8]><video style="display: none;"><![endif]-->`
around the `source` elements, because in IE9 you can't have `source` as the child node of
anything except for `video`. For IE8 and less, `picture` will fall back to an `<img srcset>` element.

Internet Explorer 8 and older have no support for CSS3 Media Queries, so in the examples above, that feature will be ignored.

## Support

Picturefill supports a broad range of browsers and devices (there are currently no known unsupported browsers), provided that you stick with the markup conventions provided.

