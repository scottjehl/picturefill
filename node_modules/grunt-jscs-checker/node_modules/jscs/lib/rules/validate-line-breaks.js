var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(options) {
        assert(
            typeof options === 'string' || typeof options === 'object',
            'validateLineBreaks option requires string or object value'
        );

        if (typeof options === 'string') {
            options = { character: options };
        }

        var lineBreaks = {
            CR: '\r',
            LF: '\n',
            CRLF: '\r\n'
        };
        this._allowedLineBreak = lineBreaks[options.character];

        this._reportOncePerFile = options.reportOncePerFile !== false;
    },

    getOptionName: function() {
        return 'validateLineBreaks';
    },

    check: function(file, errors) {
        var lines = file.getLines();
        if (lines.length < 2) {
            return;
        }

        var lineBreaks = file.getSource().match(/\r\n|\r|\n/g);
        for (var i = 0, len = lineBreaks.length; i < len; i++) {
            if (lineBreaks[i] !== this._allowedLineBreak) {
                errors.add('Invalid line break', i + 1, lines[i].length);
                if (this._reportOncePerFile) {
                    break;
                }
            }
        }
    }

};
