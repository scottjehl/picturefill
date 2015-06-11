# Picturefill
A [responsive image](http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content.html#embedded-content) polyfill.
* Authors: Scott Jehl, Mat Marquis, Shawn Jansepar (2.0 refactor lead), and many more: see Authors.txt
* License: MIT

[![build-status](https://api.travis-ci.org/scottjehl/picturefill.svg)](https://travis-ci.org/scottjehl/picturefill) [<img src="https://pf-slackin.herokuapp.com/badge.svg" alt="Join Slack channel">](https://pf-slackin.herokuapp.com/)

Picturefill has three versions:
* Version 2 (recommended) is a strict polyfill of the [Picture element draft specification](http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content.html#embedded-content) and is the main version in development.
* Version 1 mimics the Picture element pattern with `span` elements. It is maintained in the 1.2 branch.

## Usage, Demos, Docs
To find out how to use Picturefill on your sites, visit the project and demo site:

[Picturefill Documentation, Downloads, and Demos Site](http://scottjehl.github.com/picturefill/)

## The gotchas
Be it browsers, the `picture` spec, or picturefill, there are a couple gotchas you should be aware of when working with Picturefill.

- Firefox 38 and 39 has some bugs [[1]](https://bugzilla.mozilla.org/show_bug.cgi?id=1139560) [[2]](https://bugzilla.mozilla.org/show_bug.cgi?id=1139554) [[3]](https://bugzilla.mozilla.org/show_bug.cgi?id=1135812) where images won't update on screen resize. These should be fixed in Firefox 40.

- Per the `picture` spec, using `%` _isn't_ allowed in the `sizes` attribute. Using `%` will fallback to `100vw`.

- Trying to use the `src` attribute in a browser that _doesn't_ support `picture` natively can result in a double download. To avoid this, don't use the `src` attribute on the `img` tag:

```html
<picture>
    <source srcset="../img/sample.svg" media="(min-width: 768px)" />
    <img srcset="default.png" alt="Sample pic" />
</picture>
```

- If you only want to have an image show up at certain sizes, and not show up at others, you will need to use a transparent placeholder gif:

```html
<picture>
    <source srcset="../img/sample.svg" media="(min-width: 768px)" />
    <img srcset="data:image/gifbase64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        alt="Sample pic" />
</picture>
```

## Contributing
For information on how to contribute code to Picturefill, check out [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Issues
If you find a bug in Picturefill, please add it to [the issue tracker](https://github.com/scottjehl/picturefill/issues)

## Discussion
Picturefill discussion takes place via Slack. For an invitation, visit [https://pf-slackin.herokuapp.com/](https://pf-slackin.herokuapp.com/)

## Support

Picturefill supports a broad range of browsers and devices (there are currently no known unsupported browsers), provided that you stick with the markup conventions provided.
