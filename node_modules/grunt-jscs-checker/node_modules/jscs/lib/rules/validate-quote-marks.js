var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(quoteMark) {
        this._allowEscape = false;

        if (typeof quoteMark === 'object') {
            assert(
                typeof quoteMark.escape === 'boolean' && quoteMark.mark !== undefined,
                'validateQuoteMarks option requires the "escape" and "mark" property to be defined'
            );
            this._allowEscape = quoteMark.escape;
            quoteMark = quoteMark.mark;
        }

        assert(
            quoteMark === '"' || quoteMark === '\'' || quoteMark === true,
            'validateQuoteMarks option requires \'"\', "\'", or boolean true'
        );

        this._quoteMark = quoteMark;
    },

    getOptionName: function() {
        return 'validateQuoteMarks';
    },

    check: function(file, errors) {
        var quoteMark = this._quoteMark;
        var allowEscape = this._allowEscape;
        var opposite = {
            '"': '\'',
            '\'': '"'
        };

        file.iterateTokensByType('String', function(token) {
            var str = token.value;
            var mark = str[0];
            var stripped = str.substring(1, str.length -1);

            if (quoteMark === true) {
                quoteMark = mark;
            }

            if (mark !== quoteMark) {
                if (allowEscape && stripped.indexOf(opposite[mark]) > -1) {
                    return;
                }

                errors.add(
                    'Invalid quote mark found',
                    token.loc.start.line,
                    token.loc.start.column
                );
            }
        });
    }

};
