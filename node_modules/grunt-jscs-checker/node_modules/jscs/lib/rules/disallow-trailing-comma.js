var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {
    configure: function(disallowTrailingComma) {
        assert(
            typeof disallowTrailingComma === 'boolean',
            'disallowTrailingComma option requires boolean value'
        );
        assert(
            disallowTrailingComma === true,
            'disallowTrailingComma option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'disallowTrailingComma';
    },

    check: function(file, errors) {
        file.iterateTokensByType('Punctuator', function(token, i, tokens) {
            if (token.value === ',') {
                var nextToken = tokens[i + 1];
                if (nextToken && nextToken.type === 'Punctuator' &&
                    (nextToken.value === '}' || nextToken.value === ']')) {
                    errors.add(
                        'Extra comma following the final element of an array or object literal',
                        token.loc.start
                    );
                }
            }
        });
    }

};
