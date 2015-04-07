
var Q = require("q");

/**
 * Wraps a Node readable stream, providing an API similar
 * to a Narwhal synchronous `io` stream except returning
 * Q promises for long latency operations.
 * @param stream any Node readable stream
 * @returns {Promise * Reader} a promise for
 * the text stream reader.
 * @constructor
 */
module.exports = Reader;
function Reader(_stream, charset) {
    var self = Object.create(Reader.prototype);

    if (charset && _stream.setEncoding) // TODO complain about inconsistency
        _stream.setEncoding(charset);

    var begin = Q.defer();
    var end = Q.defer();

    _stream.on("error", function (reason) {
        begin.reject(reason);
    });

    var chunks = [];
    var receiver;

    _stream.on("end", function () {
        begin.resolve(self);
        end.resolve()
    });

    _stream.on("data", function (chunk) {
        begin.resolve(self);
        if (receiver) {
            receiver(chunk);
        } else {
            chunks.push(chunk);
        }
    });

    function slurp() {
        var result;
        if (charset) {
            result = chunks.join("");
        } else {
            result = self.constructor.join(chunks);
        }
        chunks.splice(0, chunks.length);
        return result;
    }

    /***
     * Reads all of the remaining data from the stream.
     * @returns {Promise * String} a promise for a String
     * containing the entirety the remaining stream.
     */
    self.read = function () {
        receiver = undefined;
        var deferred = Q.defer();
        Q.done(end.promise, function () {
            deferred.resolve(slurp());
        });
        return deferred.promise;
    };

    /***
     * Reads and writes all of the remaining data from the
     * stream in chunks.
     * @param {Function(Promise * String)} write a function
     * to be called on each chunk of input from this stream.
     * @returns {Promise * Undefined} a promise that will
     * be resolved when the input is depleted.
     */
    self.forEach = function (write) {
        if (chunks && chunks.length)
            write(slurp());
        receiver = write;
        return Q.when(end.promise, function () {
            receiver = undefined;
        });
    };

    self.close = function () {
        _stream.destroy();
    };

    return begin.promise;
}

/*
    Reads an entire forEachable stream of buffers and returns a single buffer.
*/
Reader.read = read;
function read(stream, charset) {
    var chunks = [];
    stream.forEach(function (chunk) {
        chunks.push(chunk);
    });
    if (charset) {
        return chunks.join("");
    } else {
        return join(chunks);
    }
}

Reader.join = join;
function join(buffers) {
    var length = 0;
    var at;
    var i;
    var ii = buffers.length;
    var buffer;
    var result;
    for (i = 0; i < ii; i++) {
        buffer = buffers[i];
        length += buffer.length;
    }
    result = new Buffer(length);
    at = 0;
    for (i = 0; i < ii; i++) {
        buffer = buffers[i];
        buffer.copy(result, at, 0);
        at += buffer.length;
    }
    buffers.splice(0, ii, result);
    return result;
}

