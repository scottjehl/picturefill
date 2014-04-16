
# Picturefill
A [responsive image](http://picture.responsiveimages.org/) polyfill.
* Authors: Scott Jehl, Mat Marquis, Shawn Jansepar (2.0 refactor lead), and many more: see Authors.txt
* License: MIT

![build-status](https://api.travis-ci.org/scottjehl/picturefill.svg)

Picturefill has two versions:
* Version 2 is a strict polyfill of the (Picture element draft specification](http://picture.responsiveimages.org/) and is the main version in development.
* Version 1 mimics the Picture element pattern with `span` elements. It is maintained in the 1.2 branch.

## Usage, Demos, Docs
To find out how to use Picturefill on your sites, visit the project and demo site:

[Picturefill Documentation, Downloads, and Demos Site](http://scottjehl.github.com/picturefill/)

## contributing
For information on how to contribute code to Picturefill, check out `Contributing.md`

## issues
If you find a bug in Picturefill, please add it to [the issue tracker](https://github.com/scottjehl/picturefill/issues)





TODO: move content below to index.html or delete

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

The `source[sizes]` syntax is used to define the size of the image across a number of breakpoints. Then, `srcset` defines an array of images and their inherent widths.

Based on the breakpoints defined in `sizes`, appropriate image will be chosen based on the size of the image source divided against the user’s viewport size and the appropriate source will be loaded for their resolution.

In the example above: given a 800 CSS pixel wide viewport, `"small.png 400w, medium.png 800w, large.png 1600w"` will be calculated to `"small.png 0.5x, medium.png 1x, large.png 2x"`. If that 800px viewport is on a 1x display, the user will recieve `medium.png`—if on a 2x display, `large.png`.


## Support

Picturefill supports a broad range of browsers and devices (there are currently no known unsupported browsers), provided that you stick with the markup conventions provided.

