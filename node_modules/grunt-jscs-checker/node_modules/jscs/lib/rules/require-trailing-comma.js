var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {
    configure: function(requireTrailingComma) {
        assert(
            typeof requireTrailingComma === 'boolean',
            'requireTrailingComma option requires boolean value'
        );
        assert(
            requireTrailingComma === true,
            'requireTrailingComma option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'requireTrailingComma';
    },

    check: function(file, errors) {
        file.iterateTokensByType('Punctuator', function(token, i, tokens) {
            if (token.value === '}' || token.value === ']') {
                var prevToken = tokens[i - 1];
                var error = false;
                if (prevToken) {
                    if (prevToken.type !== 'Punctuator') {
                        error = true;
                    } else {
                        if (token.value === '}' && prevToken.value === '{') {
                            // This is just a new object declaration.
                        } else if (token.value === ']' && prevToken.value === '[') {
                            // This is just new array declaration.
                        } else if (prevToken.value !== ',') {
                            error = true;
                        }
                    }

                    if (error) {
                        errors.add(
                            'Require extra comma following the final element of an array or object literal',
                            token.loc.start
                        );
                    }
                }
            }
        });
    }

};
