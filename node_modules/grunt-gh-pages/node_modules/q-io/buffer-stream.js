
var Q = require("q");
var Reader = require("./reader");

module.exports = BufferStream;
function BufferStream(chunks, charset) {
    if (!(this instanceof BufferStream)) {
        return new BufferStream(chunks, charset);
    }
    if (!chunks) {
        chunks = [];
    } else if (!Array.isArray(chunks)) {
        chunks = [chunks];
    }
    this._charset = charset;
    this._chunks = chunks;
    this._close = Q.defer();
    this.closed = this._close.promise;
}

BufferStream.prototype.forEach = function (write, thisp) {
    var self = this;
    var chunks = self._chunks;
    return Q.fcall(function () {
        chunks.splice(0, chunks.length).forEach(write, thisp);
    });
};

BufferStream.prototype.read = function () {
    var result;
    result = Reader.join(this._chunks);
    if (this._charset) {
        result = result.toString(this._charset);
    }
    return Q.resolve(result);
};

BufferStream.prototype.write = function (chunk) {
    if (this._charset) {
        chunk = new Buffer(String(chunk), this._charset);
    } else {
        if (!(chunk instanceof Buffer)) {
            throw new Error("Can't write strings to buffer stream without a charset: " + chunk);
        }
    }
    this._chunks.push(chunk);
    return Q.resolve();
};

BufferStream.prototype.close = function () {
    this._close.resolve();
    return Q.resolve();
};

BufferStream.prototype.destroy = function () {
    this._close.resolve();
    return Q.resolve();
};

