var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(disallowDanglingUnderscores) {
        assert(
            typeof disallowDanglingUnderscores === 'boolean',
            'disallowDanglingUnderscores option requires boolean value'
        );
        assert(
            disallowDanglingUnderscores === true,
            'disallowDanglingUnderscores option requires true value or should be removed'
        );

        this._allowedIdentifiers = {
            _: true,
            __dirname: true,
            __filename: true
        };
    },

    getOptionName: function() {
        return 'disallowDanglingUnderscores';
    },

    check: function(file, errors) {
        var allowedIdentifiers = this._allowedIdentifiers;

        file.iterateTokensByType('Identifier', function(token) {
            var value = token.value;
            if ((value[0] === '_' || value.slice( -1 ) === '_') &&
                !allowedIdentifiers[value]
            ) {
                errors.add(
                    'Invalid dangling underscore found',
                    token.loc.start.line,
                    token.loc.start.column
                );
            }
        });
    }

};
