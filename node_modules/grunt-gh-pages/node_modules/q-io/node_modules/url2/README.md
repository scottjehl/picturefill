
URL2
----

This module builds upon the existing URL module in NodeJS, but adds
`relative(source, target)` which returns the shortest relative path
between any two equally qualified URL’s.  If the paths are not equally
qualified, it returns the target.

In addition, this package augments the URL object definition as returned
by `parse` and consumed by `format`.

-   `pathname` is broken down into
    -   `root`: whether the path is qualified from the root of the
        domain.
    -   `relative`: the relative path, from the root if `pathname` is
        qualified from the domain root.
        -   `directories`: an array of path components
        -   `file`: the name of the file, or null if the URL points to a
            directory, indicated by a final slash.

Additionally, `format` uses the `path` property if it exists, instead of
`pathname` and `search`.

----

Based on my earlier work for [Narwhal][].

[Narwhal]: https://github.com/kriskowal/narwhal-lib/blob/master/lib/narwhal/uri.js

Copyright 2012 Kristopher Michael Kowal. All rights reserved.
MIT License

