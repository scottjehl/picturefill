
var Q = require("q");

/**
 * Wraps a Node writable stream, providing an API similar to
 * Narwhal's synchronous `io` streams, except returning and
 * accepting promises for long-latency operations.
 *
 * @param stream any Node writable stream
 * @returns {Promise * Writer} a promise for the
 * text writer.
 */
module.exports = Writer;
function Writer(_stream, charset) {
    var self = Object.create(Writer.prototype);

    if (charset && _stream.setEncoding) // TODO complain about inconsistency
        _stream.setEncoding(charset);

    var begin = Q.defer();
    var drained = Q.defer();

    _stream.on("error", function (reason) {
        begin.reject(reason);
    });

    _stream.on("drain", function () {
        begin.resolve(self);
        drained.resolve();
        drained = Q.defer();
    });

    /***
     * Writes content to the stream.
     * @param {String} content
     * @returns {Promise * Undefined} a promise that will
     * be resolved when the buffer is empty, meaning
     * that all of the content has been sent.
     */
    self.write = function (content) {
        if (!_stream.writeable && !_stream.writable)
            return Q.reject(new Error("Can't write to non-writable (possibly closed) stream"));
        if (_stream.encoding == "binary" && !(content instanceof Buffer)) {
            content = new Buffer(content);
        }
        if (!_stream.write(content)) {
            return drained.promise;
        } else {
            return Q.resolve();
        }
    };

    /***
     * Waits for all data to flush on the stream.
     *
     * @returns {Promise * Undefined} a promise that will
     * be resolved when the buffer is empty
     */
    self.flush = function () {
        return drained.promise;
    };

    /***
     * Closes the stream, waiting for the internal buffer
     * to flush.
     *
     * @returns {Promise * Undefined} a promise that will
     * be resolved when the stream has finished writing,
     * flushing, and closed.
     */
    self.close = function () {
        _stream.end();
        drained.resolve(); // we will get no further drain events
        return Q.resolve(); // closing not explicitly observable
    };

    /***
     * Terminates writing on a stream, closing before
     * the internal buffer drains.
     *
     * @returns {Promise * Undefined} a promise that will
     * be resolved when the stream has finished closing.
     */
    self.destroy = function () {
        _stream.destroy();
        drained.resolve(); // we will get no further drain events
        return Q.resolve(); // destruction not explicitly observable
    };

    return Q.resolve(self); // todo returns the begin.promise
}

