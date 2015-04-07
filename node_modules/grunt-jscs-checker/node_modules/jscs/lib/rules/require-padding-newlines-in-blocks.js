var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(requirePaddingNewlinesInBlocks) {
        assert(
            requirePaddingNewlinesInBlocks === true || typeof requirePaddingNewlinesInBlocks === 'number',
            'requirePaddingNewlinesInBlocks option requires the value true or an Integer'
        );

        this._minStatements = requirePaddingNewlinesInBlocks === true ? 0 : requirePaddingNewlinesInBlocks;
    },

    getOptionName: function() {
        return 'requirePaddingNewlinesInBlocks';
    },

    check: function(file, errors) {
        var minStatements = this._minStatements;

        file.iterateNodesByType('BlockStatement', function(node) {
            if (node.body.length <= minStatements) {
                return;
            }

            var tokens = file.getTokens();
            var openingBracketPos = file.getTokenPosByRangeStart(node.range[0]);

            var openingBracket = tokens[openingBracketPos];
            var nextToken = tokens[openingBracketPos + 1];

            if (nextToken.loc.start.line - openingBracket.loc.start.line < 2) {
                errors.add('Expected a padding newline after opening curly brace', openingBracket.loc.end);
            }

            var closingBracketPos = file.getTokenPosByRangeStart(node.range[1] - 1);
            var closingBracket = tokens[closingBracketPos];
            var prevToken = tokens[closingBracketPos - 1];

            if (closingBracket.loc.start.line - prevToken.loc.start.line < 2) {
                errors.add('Expected a padding newline before closing curly brace', prevToken.loc.end);
            }

            file.getComments().some(function(comment) {
                if (comment.range[1] < openingBracket.range[0] || closingBracket.range[1] < comment.range[0]) {
                    return false;
                }

                if (comment.loc.start.line - openingBracket.loc.start.line < 2) {
                    errors.add('Expected a padding newline after opening curly brace', comment.loc.start);
                } else if (closingBracket.loc.start.line - comment.loc.end.line < 2) {
                    errors.add('Expected a padding newline before closing curly brace', comment.loc.end);
                }

                return false;
            });
        });
    }

};
