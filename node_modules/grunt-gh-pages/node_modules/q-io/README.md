
[![Build Status](https://secure.travis-ci.org/kriskowal/q-io.png)](http://travis-ci.org/kriskowal/q-io)

# Q-IO

Interfaces for IO that make use of promises.

Q-IO now subsumes all of [Q-HTTP][] and [Q-FS][].

[Q-HTTP]: https://github.com/kriskowal/q-http
[Q-FS]: https://github.com/kriskowal/q-fs

The Q-IO package does not export a main module.  You must reach in
directly for `q-io/fs`, `q-io/http`, and `q-io/http-apps`.

## Filesystem

```javascript
var FS = require("q-io/fs");
```

File system API for Q promises with method signatures patterned after
[CommonJS/Fileystem/A](http://wiki.commonjs.org/wiki/Filesystem/A) but
returning promises and promise streams.

### open(path, options)

Open returns a promise for either a buffer or string Reader or a Writer
depending on the flags.

The options can be omitted, abbreviated to a `flags` string, or expanded
to an `options` object.

-   ``flags``: ``r``, ``w``, ``a``, ``b``, default of `r`, not binary
-   ``charset``: default of ``utf-8``
-   ``bufferSize``: in bytes
-   ``mode``: UNIX permissions
-   ``begin`` first byte to read (defaults to zero)
-   ``end`` one past the last byte to read.  ``end - begin == length``

### read(path, options)

`read` is a shortcut for opening a file and reading the entire contents
into memory.  It returns a promise for the whole file contents.  By
default, `read` provides a string decoded from UTF-8.  With the binary
mode flag, provides a `Buffer`.

The options argument is identical to that of `open`.  

```javascript
return FS.read(__filename, "b")
.then(function (content) {
    // ...
})
```

```javascript
return FS.read(__filename, {
    flags: "b"
})
```

### write(path, content, options)

`write` is a shortcut for opening a file and writing its entire content
from a single string or buffer.

The options are identical to that of `open`, but the "w" flag is
implied, and the "b" flag is implied if the content is a buffer.

```javascript
return FS.write("hello.txt", "Hello, World!\n")
.then(function () {
    return FS.read("hello.txt")
})
.then(function (hello) {
    expect(hello).toBe("Hello, World!\n")
})
```

### append(path, content, options)

`append` is a shorthand for opening a file for writing from the end of
the existing content from a single string or buffer.

The options are identical to that of `open`, but the "w+" flags are
implied, and the "b" flag is implied if the content is a buffer.

### copy(source, target)

Copies a single file from one path to another.  The target must be the
full path, including the file name.  Unlike at the shell, the file name
is not inferred from the source path if the target turns out to be a
directory.

Returns a promise for the completion of the operation.

### copyTree(source, target)

Copies a file or tree of files from one path to another.  Symbolic links
are copied but not followed.

Returns a promise for the completion of the operation.

### list(path)

Returns a promise for a list of file names in a directory.  The file
names are relative to the given path.

### listTree(path, guard(path, stat))

Returns a promise for a list of files in a directory and all the
directories it contains.  Does not follow symbolic links.

The second argument is an optional guard function that determines what
files to include and whether to traverse into another directory.  It
receives the path of the file, relative to the starting path, and also
the stats object for that file.  The guard must return a value like:

-   `true` indicates that the entry should be included
-   `false` indicates that the file should be excluded, but should still
    be traversed if it is a directory.
-   `null` indiciates that a directory should not be traversed.

### listDirectoryTree(path)

Returns a promise for a deep list of directories.

### makeDirectory(path, mode)

Makes a directory at a given path.  Fails if the parent directory does
not exist.  Returns a promise for the completion of the operation.

The mode is an optional Unix mode as an integer or string of octal
digits.

### makeTree(path, mode)

Finishes a path of directories.  For any branch of the path that does
not exist, creates a directory.  Fails if any branch of the path already
exists but is not a directory.

Makes any directories with the given Unix mode.

### remove(path)

Removes a file at the given path.  Fails if a directory exists at the
given path or if no file exists at the path.

### removeTree(path)

Removes a file or directory at a given path, recursively removing any
contained files and directories, without following symbolic links.

### move(source, target)

Moves a file or directory from one path to another.  Cannot move over a
target directory, even if it is empty.  Otherwise, does nothing if the
source and target are the same entry in the file system.

Node's `rename` implementation, at least on Mac OS X, does not enforce
the rule that writing over an empty directory should fail.  Since Q-IO
enforces this rule in software, it is not atomic and there is a chance
that an empty directory will be created over the target path between
when `move` checks for it and when it overwrites it.

### link(source, taget)

Creates a hard link from the source

### symbolicCopy(source, target, type)

Creates a relative symoblic link from the target to the source with an
effect that resembles copying a file.

The type is important for Windows.  It is "file" by default, but may be
"directory" or "junction".

### symbolicLink(target, link, type)

Creates a symbolic link at the target path.  The link may be absolute or
relative.  The type *must* be "file", "directory", or "junction" and is
mandatory to encourage Windows portability.

### chown(path, uid, gid)

Changes the owner for a path using Unix user-id and group-id numbers.

### chmod(path, mode)

Changes the Unix mode for a path.  Returns a promise.

### stat(path)

Follows all symoblic links along a path and returns a promise for the
metadata about a path as a `Stats` object.  The Stats object implements:

-   `size` the size of the file in bytes
-   `isDirectory()`: returns whether the path refers to a directory with
    entries for other paths.
-   `isFile()`: returns whether the path refers to a file physically
    stored by the file system.
-   `isBlockDevice()`: returns whether the path refers to a Unix device
    driver, in which case there is no actual data in storage but the
    operating system may allow you to communicate with the driver as a
    blocks of memory.
-   `isCharacterDevice()`: returns whether the path refers to a Unix
    device driver, in which case there is no actual data in storage but
    the operating system may allow you to communicate with the driver as
    a stream.
-   `isSymbolicLink()`: returns whether the path refers to a symbolic
    link or junction.  Stats for symbolic links are only discoverable
    through `statLink` since `stat` follows symbolic links.
-   `isFIFO()`: returns whether the path refers to a Unix named pipe.
-   `isSocket()`: returns whether the path refers to a Unix domain
    socket.
-   `lastModified()`: returns the last time the path was opened for
    writing as a `Date`
-   `lastAccessed()`: returns the last time the path was opened for
    reading or writing as a `Date`

### statLink(path)

Returns a promise for the `Stats` for a path without following symbolic
links.

### statFd(fd)

Returns a promise for the `Stats` for a Unix file descriptor number.

### exists(path)

Follows symoblic links and returns a promise for whether an entry exists
at a given path.

### isFile(path)

Follows symbolic links and returns a promise for whether a file exists
at a given path and does not cause an exception if nothing exists at
that path.

### isDirectory(path)

Follows symbolic links and returns a promise for whether a directory
exists at a given path and does not cause an exception if nothing exists
at that path.

### isSymbolicLink(path)

Returns a promise for whether a symbolic link exists at a given path and
does not cause an exception if nothing exists at that path.

### lastModified(path)

Follows symbolic links and returns a promise for the `Date` when the
entry at the given path was last opened for writing, but causes an
exception if no file exists at that path.

### lastAccessed(path)

Follows symbolic links and returns a promise for the `Date` when the
entry at the given path was last opened for reading or writing, but
causes an exception if no file exists at that path.

### split(path)

Splits a path into the names of entries along the path.  If the path is
absolute, the first component is either a drive (with a colon) on
Windows or an empty string for the root of a Unix file system.

### join(paths) or join(...paths)

Joins a sequence of paths into a single normalized path.  All but the
last path are assumed to refer to directories.

### resolve(...paths)

Like join but treats each path like a relative URL, so a terminating
slash indicates that a path is to a directory and the next path begins
at that directory.

### normal(...paths)

Takes a single path or sequence of paths and joins them into a single
path, eliminating self `.` and parent `..` entries when possible.

### absolute(path)

Joins and normalizes a path from the current working directory,
returning a string.

### canonical(path)

Returns a promise for the absolute, canonical location of a given path,
following symbolic links and normalizing path components.  An entry does
not need to exist at the end of the path.

### readLink(path)

Returns a promise for the path string of a symbolic link at a given
path.

### contains(parent, child)

For any two absolute or relative paths, computes whether the parent path
is an ancestor of the child path.

### relative(source, target)

Returns a promise for the relative path from one path to another using
`..` parent links where necessary.  This operation is asynchronous
because it is necessary to determine whether the source path refers to a
directory or a file.

### relativeFromFile(source, target)

Assuming that the source path refers to a file, returns a string for the
relative path from the source to the target path.

### relativeFromDirectory(source, target)

Assuming that the source path refers to a directory, returns a string
for the relative path from the source to the target path.

### isAbsolute(path)

Returns whether a path begins at the root of a Unix file system or a
Windows drive.

### isRelative(path)

Returns whether a path does not begin at the root of a Unix file system
or Windows drive.

### isRoot(path)

Returns whether a path is to the root of a Unix file system or a Windows
drive.

### root(path)

Returns the Windows drive that contains a given path, or the root of a
Unix file system.

### directory(path)

Returns the path to the directory containing the given path.

### base(path, extension)

Returns the last entry of a path.  If an extension is provided and
matches the extension of the path, removes that extension.

### extension(path)

Returns the extension for a path (everything following the last dot `.`
in a path, unless that dot is at the beginning of the entry).

### reroot(path)

Returns an attenuated file system that uses the given path as its root.
The resulting file system object is identical to the parent except that
the child cannot open any file that is not within the root.  Hard links
are effectively inside the root regardless, but symbolic links cannot be
followed outside of the jail.

### toObject(path)

Reads every file in the file system under a given path and returns a
promise for an object that contains the absolute path and a Buffer for
each of those files.

### glob(pattern)

Not yet implemented

### match(pattern, path)

Not yet implemented

## Mock Filesystem

Q-IO provides a mock filesystem interface. The mock filesystem has the
same interface as the real one and has most of the same features, but
operates on a purely in-memory, in-process, in-javascript filesystem.

A mock filesystem can be created from a data structure. Objects are
directories.  Keys are paths.  A buffer is a file’s contents.  Anything
else is coerced to a string, then to a buffer in the UTF-8 encoding.

```javascript
var MockFs = require("q-io/fs-mock");
var mockFs = MockFs({
    "a": {
        "b": {
            "c.txt": "Content of a/b/c.txt"
        }
    },
    "a/b/d.txt": new Buffer("Content of a/b/d.txt", "utf-8")
})
```

You can also instantiate a mock file system with the content of a
subtree of a real file system.  You receive a promise for the mock
filesystem.

```javascript
var FS = require("q-io/fs");
FS.mock(__dirname)
.then(function (fs) {
    //
})
.done();
```

## HTTP

The HTTP module resembles [CommonJS/JSGI][].

```javascript
var HTTP = require("q-io/http");
```

[CommonJS/JSGI]: http://wiki.commonjs.org/wiki/JSGI

### Server(app)

The `http` module exports a `Server` constructor.

-   accepts an application, returns a server.
-   calls the application function when requests are received.
    -   if the application returns a response object, sends that
        response.
-   ``listen(port)``
    -   accepts a port number.
    -   returns a promise for undefined when the server has begun
        listening.
-   ``stop()``
    -   returns a promise for undefined when the server has stopped.

### request(request object or url)

The `http` module exports a `request` function that returns a promise
for a response.

-   accepts a request or a URL string.
-   returns a promise for a response.

### read(request object or url)

The `http` module exports a `read` function, analogous to
`Fs.read(path)`, but returning a promise for the contento of an OK HTTP
response.

-   accepts a request or a URL string.
-   returns a promise for the response body as a string provided
    that the request is successful with a 200 status.
    -   rejects the promise with the response as the reason for
        failure if the request fails.

### normalizeRequest(request object or url)

-   coerces URLs into request objects.
-   completes an incomplete request object based on its `url`.

### normalizeResponse(response)

-   coerces strings, arrays, and other objects supporting
    ``forEach`` into proper response objects.
-   if it receives `undefined`, it returns `undefined`.  This is used as
    a singal to the requester that the responder has taken control of
    the response stream.

### request

A complete request object has the following properties.

-   ``url`` the full URL of the request as a string
-   ``path`` the full path as a string
-   ``scriptName`` the routed portion of the path, like ``""`` for
    ``http://example.com/`` if no routing has occurred.
-   ``pathInfo`` the part of the path that remains to be routed,
    like ``/`` for ``http://example.com`` or ``http://example.com/``
    if no routing has occurred.
-   ``version`` the requested HTTP version as an array of strings.
-   ``method`` like ``"GET"``
-   ``scheme`` like ``"http:"``
-   ``host`` like ``"example.com"``
-   ``port`` the port number, like ``80``
-   ``remoteHost``
-   ``remotePort``
-   ``headers``
    corresponding values, possibly an array for multiple headers
    of the same name.
-   ``body``
-   ``node`` the wrapped Node request object

### response

A complete response object has the following properties.

-   ``status`` the HTTP status code as a number, like ``200``.
-   ``headers``
-   ``body`` an IO reader
-   ``onclose`` is an optional function that this library will call
    when a response concludes.
-   ``node`` the wrapped Node response object.

### headers

Headers are an object mapping lower-case header-names to corresponding
values, possibly an array for multiple headers of the same name, for
both requests and responses.

### body

body is a representation of a readable stream, either for the content of
a request or a response.  It is implemented as a Q-IO reader.

-   ``forEach(callback)``
    -   accepts a ``callback(chunk)`` function
        -   accepts a chunk as either a string or a ``Buffer``
        -   returns undefined or a promise for undefined when the
            chunk has been flushed.
    -   returns undefined or a promise for undefined when the stream
        is finished writing.
    -   the ``forEach`` function for arrays of strings or buffers is
        sufficient for user-provided bodies
-   the ``forEach`` function is the only necessary function for
    bodies provided to this library.
-   in addition to ``forEach``, bodies provided by this library
    support the entire readable stream interface provided by
    ``q-io``.
-   ``read()``
    -   returns a promise for the entire body as a string or a
        buffer.

### application

An HTTP application is a function that accepts a request and returns a
response.  The `request` function itself is an application.
Applications can be chained and combined to make advanced servers and
clients.

-   accepts a request
-   returns a response, a promise for a response, or nothing if no
    response should be sent.


## Streams

### Reader

Reader instances have the following methods:

-   `read()`
-   `forEach(callback)`
-   `close()`
-   `node` the underlying node reader

Additionally, the `Reader` constructor has the following methods:

-   `read(stream, charset)` accepts any foreachable and returns either a
    buffer or a string if given a charset.
-   `join(buffers)` consolidates an array of buffers into a single
    buffer.  The buffers array is collapsed in place and the new first
    and only buffer is returned.

The `reader` module exports a function that accepts a Node reader and
returns a Q reader.

### Writer

Writer instances have the following methods:

-   `write(content)` writes a chunk of content, either from a string or
    a buffer.
-   `flush()` returns a promise to drain the outbound content all the
    way to its destination.
-   `close()`
-   `destroy()`
-   `node` the underlying node writer

The `writer` module exports a function that accepts a Node writer and
returns a Q writer.

### Buffer

```javascript
var BufferStream = require("q-io/buffer-stream");
var stream = BufferStream(new Buffer("Hello, World!\n", "utf-8"), "utf-8")
```

## HTTP Applications

The HTTP applications module provides a comprehensive set of JSGI-alike
applications and application factories, suitable for use with the `http`
server and client.

```javascript
var Apps = require("q-io/http-apps");
```

### ok(content, contentType, status) : Response

Creates an `HTTP 200 Ok` response with the given content, content type,
and status.

The content may be a string, buffer, array of strings, array of buffers,
a readable stream of strings or buffers, or (generally) anything that
implements `forEach`.

The default content type is `text/plain`.

The default status is `200`.

### badRequest(request) : Response

An application that returns an `HTTP 400 Bad request` response for any
request.

### notFound(request) : Response

An application that returns an `HTTP 404 Not found` response for any
request.

### methodNotAllowed(request) : Response

An application that returns an `HTTP 405 Method not allowed` response
for any request.  This is suitable for any endpoint where there is no
viable handler for the request method.

### notAcceptable(request) : Response

An application that returns an `HTTP 406 Not acceptable` response for
any request.  This is suitable for any situation where content
negotiation has failed, for example, if you cannot response with any of
the accepted encoding, charset, or language.

### redirect(request, location, status, tree) : Response

Not to be confused with an HTTP application, this is a utility that
generates redirect responses.

The returns response issues a redirect to the given location.  The
utility fully qualifies the location.

This particular method should be used directly to generate an `HTTP 301
Temporary redirect` response, but passing `307` in the status argument
turns it into an `HTTP 307 Permanent redirect` response.

This particular method should be used to send all requests to a specific
location, but setting the `tree` argument to `true` causes the redirect
to follow the remaining unrouted path from the redirect location, so if
you move an entire directory tree from one location to another, this
redirect can forward to all of them.

### redirectTree(request, location) : Response

Produces an `HTTP 301 Temporary redirect` from one directory tree to
another, using `redirect`.

### permanentRedirect(request, location) : Response

Produces an `HTTP 307 Permanent redirect` to a given location, using
`redirect`.

### permanentRedirectTree(request, location) : Response

Produces an `HTTP 307 Permanent redirect` from one directory tree to
another, using `redirect`.

### file(request, path, contentType) : Response

Produces an HTTP response with the file at a given path.  By default, it
infers the content type from the extension of the path.

The file utility produces an `e-tag` header suitable for cache control,
and may produce an `HTTP 304 Not modified` if the requested resource has
the same entity tag.

The file utility may produce an `HTTP 206 Partial content` response with
a `content-range` header if the request has a `range` header.  If the
partial range request cannot be satisified, it may respond `HTTP 416 Not
satisfiable`.

In all cases, the response body is streamed from the file system.

### etag(stat)

Computes an entity tag for a file system `Stats` object, using the
`node.ino`, `size`, and last modification time.

### directory(request, path)

This is not yet implemented.

### json(object, visitor, tabs) : Response

Returns an `HTTP 200 Ok` response from some JSON, using the same
argumensts as `JSON.stringify`.

### Content(body, contentType, status) : Application

A factory that produces an HTTP application that will always respond
with the given content, content type, and status.  The default content
type is `text/plain` and the default status is `200`.

The body may be a string, array of strings or buffers, or a readable
stream of strings or buffers.

### File(path, contentType) : Application

A factory that produces an HTTP application that will always respond
with the file at the given path.  The content type is inferred from the
path extension by default, but can be overridden with `contentType`.

### FileTree(path, options) : Application

A factory that produces an HTTP application that responds to all
requests with files within a branch of the file system starting at the
given path and using any unprocessed portion of the request location.

### Redirect(path) : Application

A factory that produces an HTTP application that temporarily redirects
to the given path.

### RedirectTree(path) : Application

A factory that produces an HTTP application that redirects all requests
under the requested path to parallel locations at the given path.

### PermanentRedirect(path) : Application

A factory that produces an HTTP application that redirects all requests
to an exact location and instructs the requester's cache never to ask
again.

### PermanentRedirectTree(path) : Application

A factory that produces an HTTP application that redirects all requests
under the request path to a parallel location under the given path and
instructs the requester's cache never to ask again.

### Cap(app, notFound) : Application

A factory that produces an HTTP application that will cause an `HTTP 404
Not found` response if the request has not reached the end of its route
(meaning `pathInfo` is not `""` or `"/"`), or will forward to the given
application.

### Routing

Several routing application factories have the same form.  They all take
an object as their first argument and an optional fallback application
as their second.  The object maps each of the supported options for keys
to an HTTP application for handling that option.

-   Branch(paths, notFound) routes the next unprocessed path component
-   Method(methods, notFound) routes the HTTP method. Methods are
    upper-case.
-   ContentType(contentTypes, notAcceptable) routes based on the
    "accept" request header and produces a "content-type" response
    header.
-   Langauge(languages, notAcceptable) routes based on the
    "accept-language" header and produces a "language" response header.
-   Charaset(charsets, notAcceptable) routes based on the
    "accept-charset" header and produces a "charset" response header.
-   Encoding(encodings, notAcceptable) routes based on the
    "accept-encoding" request header and produces an "encoding" response
    header.
-   Host(hosts, notFound) routes based on the host name of the request
    "host" header, which defaults to "*".  This is equivalent to virtual
    host mapping.

### Select(selector) : Application

Produces an HTTP application that uses a function to determine the next
application to route.  The `selector` is a function that accepts the
request and returns an HTTP application.

### FirstFound(apps)

Returns an HTTP application that attempts to respond with each of a
series of applications and returns the first response that does not have
a `404 Not found` status, or whatever response comes last.

### Error(application, debug) : Application

Wraps an application such that any exceptions get converted into `HTTP
500 Server error` responses.  If `debug` is enabled, produces the
exception and stack traces in the body of the response.

### Log(application, log, stamp) : Application

Wraps an application such that request and response times are logged.
The `log` function reports to `console.log` by default.  The
`stamp(message)` function prefixes an ISO time stamp by default.

### Time(application) : Application

Adds an `x-response-time` header to the response, with the time from receiving
starting the request to starting the response in miliseconds.

### Date(application) : Application

Adds a `date` header to the response with the current date for cache
control purposes.

### Tap(app, tap) : Application

Wraps an application such that the `tap` function receives the request
first.  If the tap returns nothing, the request goes to the `app`.  If
the `tap` returns a response, the `app` never gets called.

### Trap(app, trap) : Application

Wraps an application such that the `trap` function receives the
response.  If it returns nothing, the response if forwarded.  If the
`trap` returns a response, the original response is discarded.

### ParseQuery(application)

Wraps an application such that the query string is parsed and placed in
`request.parse`.


## Coverage

Use `npm run cover` to generate and view a coverage report of Q-IO.

<table>
    <thead>
        <tr>
            <th>File</th>
            <th>Percentage</th>
            <th>Missing</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>fs-boot.js</code></td>
            <td>87%</td>
            <td>41</td>
        </tr>
        <tr>
            <td><code>fs.js</code></td>
            <td>72%</td>
            <td>100</td>
        </tr>
        <tr>
            <td><code>reader.js</code></td>
            <td>94%</td>
            <td>8</td>
        </tr>
        <tr>
            <td><code>writer.js</code></td>
            <td>91%</td>
            <td>8</td>
        </tr>
        <tr>
            <td><code>fs-common.js</code></td>
            <td>87%</td>
            <td>52</td>
        </tr>
        <tr>
            <td><code>fs-root.js</code></td>
            <td>88%</td>
            <td>11</td>
        </tr>
        <tr>
            <td><code>fs-mock.js</code></td>
            <td>91%</td>
            <td>46</td>
        </tr>
        <tr>
            <td><code>buffer-stream.js</code></td>
            <td>89%</td>
            <td>6</td>
        </tr>
        <tr>
            <td><code>http.js</code></td>
            <td>93%</td>
            <td>25</td>
        </tr>
        <tr>
            <td><code>http-apps.js</code></td>
            <td>80%</td>
            <td>286</td>
        </tr>
        <tr>
            <td><code>http-cookie.js</code></td>
            <td>79%</td>
            <td>15</td>
        </tr>
    </tbody>
</table>

---

Copyright 2009–2012 Kristopher Michael Kowal
MIT License (enclosed)

