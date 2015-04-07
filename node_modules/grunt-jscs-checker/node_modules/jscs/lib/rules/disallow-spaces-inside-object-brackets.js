var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(disallowSpacesInsideObjectBrackets) {
        assert(
            typeof disallowSpacesInsideObjectBrackets === 'boolean',
            'disallowSpacesInsideObjectBrackets option requires boolean value'
        );
        assert(
            disallowSpacesInsideObjectBrackets === true,
            'disallowSpacesInsideObjectBrackets option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'disallowSpacesInsideObjectBrackets';
    },

    check: function(file, errors) {
        file.iterateNodesByType('ObjectExpression', function(node) {
            var tokens = file.getTokens();
            var openingBracketPos = file.getTokenPosByRangeStart(node.range[0]);

            var openingBracket = tokens[openingBracketPos];
            var nextToken = tokens[openingBracketPos + 1];

            if (openingBracket.loc.start.line === nextToken.loc.start.line &&
                openingBracket.range[1] !== nextToken.range[0]
            ) {
                errors.add('Illegal space after opening curly brace', openingBracket.loc.end);
            }

            var closingBracketPos = file.getTokenPosByRangeStart(node.range[1] - 1);
            var closingBracket = tokens[closingBracketPos];
            var prevToken = tokens[closingBracketPos - 1];

            if (closingBracket.loc.start.line === prevToken.loc.start.line &&
                closingBracket.range[0] !== prevToken.range[1]
            ) {
                errors.add('Illegal space before closing curly brace', prevToken.loc.end);
            }
        });
    }

};
