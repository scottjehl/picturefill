var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {
    configure: function(requireSpaceBeforeBlockStatements) {
        assert(
            typeof requireSpaceBeforeBlockStatements === 'boolean',
            'requireSpaceBeforeBlockStatements option requires boolean value'
        );
        assert(
            requireSpaceBeforeBlockStatements === true,
            'requireSpaceBeforeBlockStatements option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'requireSpaceBeforeBlockStatements';
    },

    check: function(file, errors) {
        var tokens = file.getTokens();

        file.iterateNodesByType('BlockStatement', function(node) {
            var tokenBeforeBodyPos = file.getTokenPosByRangeStart(node.range[0] - 1);
            var tokenBeforeBody = tokens[tokenBeforeBodyPos];
            if (tokenBeforeBody) {
                errors.add(
                    'Missing space before opening curly brace for block expressions',
                    tokenBeforeBody.loc.start
                );
            }
        });
    }

};
