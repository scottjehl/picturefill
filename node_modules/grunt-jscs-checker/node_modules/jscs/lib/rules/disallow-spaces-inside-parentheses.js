var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(disallowSpacesInsideParentheses) {
        assert(
            typeof disallowSpacesInsideParentheses === 'boolean',
            'disallowSpacesInsideParentheses option requires boolean value'
        );
        assert(
            disallowSpacesInsideParentheses === true,
            'disallowSpacesInsideParentheses option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'disallowSpacesInsideParentheses';
    },

    check: function(file, errors) {
        function isCommentInRange(start, end) {
            return file.getComments().some(function(comment) {
                return start <= comment.range[0] && end >= comment.range[1];
            });
        }
        file.iterateTokensByType('Punctuator', function(token, index, tokens) {
            if (token.value === '(') {
                var nextToken = tokens[index + 1];
                if (token.range[1] !== nextToken.range[0] &&
                        token.loc.end.line === nextToken.loc.start.line &&
                        !isCommentInRange(token.range[1], nextToken.range[0])) {
                    errors.add('Illegal space after opening round bracket', token.loc.end);
                }
            }

            if (token.value === ')') {
                var prevToken = tokens[index - 1];
                if (prevToken.range[1] !== token.range[0] &&
                        prevToken.loc.end.line === token.loc.start.line &&
                        !isCommentInRange(prevToken.range[1], token.range[0])) {
                    errors.add('Illegal space before closing round bracket', prevToken.loc.end);
                }
            }
        });
    }

};
