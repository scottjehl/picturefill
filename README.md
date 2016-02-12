# Picturefill
A [responsive image](http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content.html#embedded-content) polyfill.
* Authors: See [Authors.txt](https://raw.githubusercontent.com/scottjehl/picturefill/master/Authors.txt)
* License: MIT

[![build-status](https://api.travis-ci.org/scottjehl/picturefill.svg)](https://travis-ci.org/scottjehl/picturefill) [<img src="https://pf-slackin.herokuapp.com/badge.svg" alt="Join Slack channel">](https://pf-slackin.herokuapp.com/) [![picturefill on npm](https://img.shields.io/npm/v/picturefill.svg?style=flat)](https://www.npmjs.com/package/picturefill)

Picturefill has three versions:

* Version 1 mimics the Picture element pattern with `span` elements. It is no longer maintained.
* Version 2 is a lightweight polyfill of the [Picture element draft specification](http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content.html#embedded-content).
* Version 3.0.1 is the current stable release.

## Usage, Demos, Docs
To find out how to use Picturefill, visit the [project site](http://scottjehl.github.com/picturefill/).

## The gotchas
Be it browser issues, the responsive images specifications, or Picturefill itself, there are a couple gotchas you should be aware of when working with Picturefill:

- Firefox 38 and 39 has some bugs [[1]](https://bugzilla.mozilla.org/show_bug.cgi?id=1139560) [[2]](https://bugzilla.mozilla.org/show_bug.cgi?id=1139554) [[3]](https://bugzilla.mozilla.org/show_bug.cgi?id=1135812) where images won't update on screen resize. These issues are addressed by Picturefill 3.0.0, and was fixed in Firefox 41.

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
    <img srcset="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
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
There are currently no known unsupported browsers, provided that you use the markup patterns provided.
