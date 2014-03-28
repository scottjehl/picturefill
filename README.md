# Picturefill
A Polyfill for the [HTML Picture Element](http://picture.responsiveimages.org/) that you can use today.
* Authors: Scott Jehl, Mat Marquis, Shawn Jansepar (2.0 refactor lead), and many more: see Authors.txt
* License: MIT

**Demo URL:** [http://jansepar.github.com/picturefill/](http://jansepar.github.com/picturefill/)

**Draft Specification:** [http://picture.responsiveimages.org/](http://picture.responsiveimages.org/)

**Note:** Picturefill works best in browsers that support CSS3 media queries. The demo page references (externally) the [matchMedia polyfill](https://github.com/paulirish/matchMedia.js/) which makes matchMedia work in `media-query`-supporting browsers that don't support `matchMedia`. `matchMedia` and the `matchMedia` polyfill are not required for `picturefill` to work, but they are required to support the `media` attributes on `picture` `source` elements. In non-media query-supporting browsers, the `matchMedia` polyfill will allow for querying native media types, such as `screen`, `print`, etc.

## Usage

The following snippet will load the polyfill asynchronously and poll until the document
is ready, in order to start image downloads as fast as possible (instead of waiting)
until DOMContentLoaded). It will also conditionally load matchMedia if the browser
doesn't support it.

```html
    <head>
    <script async="true" src="picturefill.js"></script>
```

If you don't want to load the script asynchronously, you can still insert the following script right above
the closing `</body>` tag (although not recommended, since this could take a long time
before executing, waiting precious time that could have been spend downloading images).

## Markup pattern and explanation

The following is an example based on the latest spec without using `sizes`:

```html
    <picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
        <!-- Video tag needed in order to use <source> in IE9 -->
        <!--[if IE 9]><video style="display: none;"><![endif]-->
        <source srcset="images/small.jpg"></source>
        <source srcset="images/medium.jpg" media="(min-width: 400px)"></source>
        <source srcset="images/large.jpg" media="(min-width: 800px)"></source>
        <source srcset="images/extralarge.jpg" media="(min-width: 1000px)"></source>
        <!--[if IE 9]></video><![endif]-->

        <!-- Fallback content for IE8 and older -->
        <img data-picture-src="images/small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
    </picture>
```

And using `sizes`:

```html
    <picture data-alt="Obama with soldiers">
        <!-- Video tag needed in order to use <source> in IE9 -->
        <!--[if IE 9]><video style="display: none;"><![endif]-->
        <source sizes="(max-width: 30em) 100%, (max-width: 50em) 75%, 50%"
                srcset="images/pic-small.png 400w, images/pic-medium.png 800w, images/pic-large.png 1200w"></source>
        <!--[if IE 9]></video><![endif]-->

        <!-- Fallback content for IE8 and older -->
        <img data-picture-src="images/pic-small.png" alt="Obama with soldiers">
    </picture>
```

### Explained...

Notes on the markup above...

* The `picture` element's `alt` attribute is used as alternate text for the `img` element that picturefill generates upon a successful source match.
* The `picture` element can contain any number of `source` elements. The above example may contain more than the average situation may call for.
* Each `picture[srcset]` element must have a `srcset` attribute specifying the image path.
* It's generally a good idea to include one source element with no `media` qualifier, so it'll apply everywhere - typically a mobile-optimized image is ideal here.
* The `picture[srcset]` can take in a single image (like "images/small.jpg"), or an array of images ("images/pic-small.png 0.5x, images/pic-medium.png 1x, images/pic-large.png 1.5x).
* The `picture[sizes]` attribute is available to specify the size of the image at different breakpoints. Then, in `srcset`, an array of images at different widths are supplied, and based on the breakpoints defined in `sizes`, the appropriate image will be chosen. So in the example above, "images/pic-small.png 400w, images/pic-medium.png 800w, images/pic-large.png 1200w" will be converted to "images/pic-small.png 0.5x, images/pic-medium.png 1x, images/pic-large.png 1.5x" if the width of the device (in css pixels) was 800px;
* Each `[picture-srcset]` element can have an optional `[media]` attribute to make it apply in specific media settings. Both media types and queries can be used, like a native `media` attribute, but support for media _queries_ depends on the browser (unsupporting browsers fail silently).
* The `matchMedia` polyfill (included in the `/external` folder) is necessary to support the `media` attribute across browsers (such as IE9), even in browsers that support media queries, although it is becoming more widely supported in new browsers.
* The `noscript` element wraps the fallback image for non-JavaScript environments, and including this wrapper prevents browsers from fetching the fallback image during page load (causing unnecessary overhead). Generally, it's a good idea to reference a small mobile optimized image here, as it's likely to be loaded in older/underpowered mobile devices.
* If you want to use the `picture` markup with IE9, you have to stick `<!--[if gte IE 8]><video style="display: none;"><![endif]-->`
around the `source` elements, because in IE9 you can't have `source` as the child node of anything except for `video`.
* If you want to use IE8 or less, you must specify a fallback `<img data-picture-src="foo.jpg">`.


### How the `img` is appended

Upon finding a matching `picture` element, picturefill will generate an `img` element referencing that `picture`'s `srcset` attribute value and append the `img` to the picture element. This means you can target CSS styles specific to the active image based on the breakpoint that is in play, perhaps by adding a class to each `picture`. For example, if you have the following markup...


```html
	<picture class="picture" data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<source class="sml" src="small.jpg"></source>
		<source class="med" src="medium.jpg" media="(min-width: 400px)"></source>
		<source class="lrg" src="large.jpg" media="(min-width: 800px)"></source>
````

...then you could write styles specific to each of the images, which may be handy for certain layout situations.

```css
	.picture .sml img { /* Styles for the small image */ }
	.picture .med img { /* Styles for the medium image */ }
	.picture .lrg img { /* Styles for the large image */ }
````


### HD Media Queries

Picturefill natively supports HD(Retina) image replacement.  While numerous other solutions exist, picturefill has the added benefit of performance for the user in only being served one image.

* The `media` attribute supports [compound media queries](https://developer.mozilla.org/en-US/docs/CSS/Media_queries), allowing for very specific behaviors to emerge.  For example, a `media="(min-width: 400px) and (min-device-pixel-ratio: 2.0)` attribute can be used to serve a higher resolution version of the source instead of a standard definition image. Note you currently also need to add the `-webkit-min-device-pixel-ratio` prefix (e.g. for iOS devices).

```html
	<picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<source src="small.jpg"></source>
		<source src="small_x2.jpg"      media="(min-device-pixel-ratio: 2.0)"></source>
		<source src="medium.jpg"        media="(min-width: 400px)"></source>
		<source src="medium_x2.jpg"     media="(min-width: 400px) and (min-device-pixel-ratio: 2.0)"></source>
		<source src="large.jpg"         media="(min-width: 800px)"></source>
		<source src="large_x2.jpg"      media="(min-width: 800px) and (min-device-pixel-ratio: 2.0)"></source>
		<source src="extralarge.jpg"    media="(min-width: 1000px)"></source>
		<source src="extralarge_x2.jpg" media="(min-width: 1000px) and (min-device-pixel-ratio: 2.0)"></source>

		<img data-picture-src="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
	</picture>
```

* Note: Supporting this many breakpoints quickly adds size to the DOM and increases implementation and maintenance time, so use this technique sparingly.

### Supporting IE Desktop

Internet Explorer 9 has some issues rendering custom elements like `picture` and `source`.
For IE9, you have to stick `<!--[if gte IE 8]><video style="display: none;"><![endif]-->`
around the `source` elements, because in IE9 you can't have `source` as the child node of
anything except for `video`. For IE8 and less, `picture` cannot have any children, and thus
we must fall back to an `<img data-picture-src>` element.

Internet Explorer 8 and older have no support for CSS3 Media Queries, so in the examples above, IE will receive the
first `data-picture-src` image reference (or the last one it finds that has no `data-media` attribute). If you'd like to serve a
larger image to IE desktop browsers, you might consider using conditional comments, like this:

```html
	<picture data-alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
		<source srcset="small.jpg"></source>
		<source srcset="medium.jpg" data-media="(min-width: 400px)"></source>

		<!--[if (lt IE 9) & (!IEMobile)]>
		    <source srcset="medium.jpg"></source>
		<![endif]-->

		<!-- Fallback content for IE8 and below. Same img src as the initial, unqualified source element. -->
		<img data-picture-src="small.jpg" alt="A giant stone face at The Bayon temple in Angkor Thom, Cambodia">
	</picture>
```

### Deferred loading

If picturefill is deferred until after load is fired, images will not load unless the browser window is resized.
Picturefill is intentionally exposed to the global space, in the unusual situation where you might want to defer loading of picturefill you can explicitly call window.picturefill().

## Support

Picturefill supports a broad range of browsers and devices (there are currently no known unsupported browsers), provided that you stick with the markup conventions provided.

