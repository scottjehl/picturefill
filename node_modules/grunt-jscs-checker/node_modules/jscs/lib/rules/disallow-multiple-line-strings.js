var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(disallowMultipleLineStrings) {
        assert(
            typeof disallowMultipleLineStrings === 'boolean',
            'disallowMultipleLineStrings option requires boolean value'
        );
        assert(
            disallowMultipleLineStrings === true,
            'disallowMultipleLineStrings option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'disallowMultipleLineStrings';
    },

    check: function(file, errors) {
        file.iterateTokensByType('String', function(token) {
            if (token.loc.start.line !== token.loc.end.line) {
                errors.add(
                    'Multiline strings are disallowed.',
                    token.loc.start.line,
                    token.loc.start.column
                );
            }
        });
    }

};
