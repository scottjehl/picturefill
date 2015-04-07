var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(requireSpaceAfterObjectKeys) {
        assert(
            typeof requireSpaceAfterObjectKeys === 'boolean',
            this.getOptionName() + ' option requires boolean value'
        );
        assert(
            requireSpaceAfterObjectKeys === true,
            this.getOptionName() + ' option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'requireSpaceAfterObjectKeys';
    },

    check: function(file, errors) {
        var tokens = file.getTokens();
        file.iterateNodesByType('ObjectExpression', function(node) {
            node.properties.forEach(function(property) {
                var key = property.key;
                var keyPos = file.getTokenPosByRangeStart(key.range[0]);
                var colon = tokens[keyPos + 1];
                if (colon.range[0] === key.range[1]) {
                    errors.add('Missing space after key', key.loc.end);
                }
            });
        });
    }

};
