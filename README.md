# Picturefill
A [responsive image](http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content.html#embedded-content) polyfill.
* Authors: Scott Jehl, Mat Marquis, Shawn Jansepar (2.0 refactor lead), and many more: see Authors.txt
* License: MIT

**Demo URL:** [http://scottjehl.github.com/picturefill/](http://scottjehl.github.com/picturefill/)

**Draft Specification:** [http://picture.responsiveimages.org/](http://picture.responsiveimages.org/)

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

## Markup Pattern and Explanation

### Using Media Queries

```html
<picture>
	<!-- Video tag needed in order to use <source> in IE9 -->
	<!--[if IE 9]><video style="display: none;"><![endif]-->
	<source srcset="extralarge.jpg" media="(min-width: 1000px)"></source>
	<source srcset="large.jpg" media="(min-width: 800px)"></source>
	<source srcset="medium.jpg" media="(min-width: 400px)"></source>
	<source srcset="small.jpg"></source>
	<!--[if IE 9]></video><![endif]-->

	<!-- Fallback content: -->
	<img srcset="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
</picture>
```

The `picture` element can contain any number of `source` elements. The above example likely contains more sources than you’ll need. Each `source` element accepts a `media` attribute, which tells the UA the most appropriate source file to load in the inner `img`. Both media types and queries can be used, like a native `media` attribute, but support for media _queries_ depends on the browser (unsupporting browsers fail silently).

Each `source` element must have a `srcset` attribute specifying one or more image paths.

`source` selection is based on the first matching `media` attribute. You’ll want to present the larger options first when using `min-width` media queries, and last when using `max-width` media queries.

_Though media queries are well supported in modern browsers, the `matchMedia` polyfill (included in the `/external` folder) is necessary for parsing media queries in `media` attributes in browser without native media query support._

### Resolution Options

```html
<img src="small.jpg" srcset="large.jpg 2x" alt="…">
```

```html
<picture>
	<!--[if IE 9]><video style="display: none;"><![endif]-->
	<source srcset="large.jpg 1x, extralarge.jpg 2x" media="(min-width: 800px)"></source>
	<source srcset="small.jpg 1x, medium.jpg 2x"></source>
	<!--[if IE 9]></video><![endif]-->

	<img srcset="small.jpg" alt="…">
</picture>
```

The `1x`, `2x` syntax in `srcset` acts as a shorthand for more complex resolution media queries, but the native markup will allow the UA to override requests for higher-resolution options based on a bandwidth limitations or a user preference (see #9 in the [Responsive Images Use Cases and Requirements](http://usecases.responsiveimages.org/#h2_requirements)).

### `sizes`/`srcset`


```html
<img sizes="100%, (min-width: 50em) 75%"
     srcset="large.jpg 1024w, medium.jpg 640w, small.jpg 320w"
     alt="…">
```

```html
<picture>
	<!--[if IE 9]><video style="display: none;"><![endif]-->
	<source sizes="100%, (min-width: 50em) 75%"
			srcset="large.jpg 1024w, medium.jpg 640w, small.jpg 320w"></source>
	<!--[if IE 9]></video><![endif]-->

	<img srcset="small.png" alt="…">
</picture>
```

Picturefill has two versions:
* Version 2 is a strict polyfill of the [Picture element draft specification](http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content.html#embedded-content) and is the main version in development.
* Version 1 mimics the Picture element pattern with `span` elements. It is maintained in the 1.2 branch.

## Usage, Demos, Docs
To find out how to use Picturefill on your sites, visit the project and demo site:

[Picturefill Documentation, Downloads, and Demos Site](http://scottjehl.github.com/picturefill/)

## Contributing
For information on how to contribute code to Picturefill, check out `CONTRIBUTING.md`

## Issues
If you find a bug in Picturefill, please add it to [the issue tracker](https://github.com/scottjehl/picturefill/issues)

## Support

Picturefill supports a broad range of browsers and devices (there are currently no known unsupported browsers), provided that you stick with the markup conventions provided.
