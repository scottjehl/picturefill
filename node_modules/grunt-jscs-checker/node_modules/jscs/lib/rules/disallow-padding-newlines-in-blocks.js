var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(disallowPaddingNewlinesInBlocks) {
        assert(
            disallowPaddingNewlinesInBlocks === true,
            'disallowPaddingNewlinesInBlocks option requires the value true or should be removed'
        );
    },

    getOptionName: function() {
        return 'disallowPaddingNewlinesInBlocks';
    },

    check: function(file, errors) {
        var _commentLineMap;

        function getCommentLines() {
            if (!_commentLineMap) {
                _commentLineMap = file.getComments().reduce(function(map, comment) {
                    for (var x = comment.loc.start.line; x <= comment.loc.end.line; x++) {
                        map[x] = 1;
                    }
                    return map;
                }, {});
            }

            return _commentLineMap;
        }

        function hasEmptyLine(startLine, endLine) {
            var commentLines = getCommentLines();

            for (var x = startLine; x < endLine; x++) {
                if (!commentLines[x]) {
                    return true;
                }
            }

            return false;
        }

        file.iterateNodesByType('BlockStatement', function(node) {
            if (node.body.length === 0) {
                return;
            }

            var tokens = file.getTokens();
            var openingBracketPos = file.getTokenPosByRangeStart(node.range[0]);

            var openingBracket = tokens[openingBracketPos];
            var nextToken = tokens[openingBracketPos + 1];
            var startLine = openingBracket.loc.start.line + 1;
            var nextLine = nextToken.loc.start.line;

            if (startLine < nextLine && hasEmptyLine(startLine, nextLine)) {
                errors.add('Expected no padding newline after opening curly brace', openingBracket.loc.end);
            }

            var closingBracketPos = file.getTokenPosByRangeStart(node.range[1] - 1);
            var closingBracket = tokens[closingBracketPos];
            var prevToken = tokens[closingBracketPos - 1];
            var closingLine = closingBracket.loc.start.line;
            var prevLine = prevToken.loc.start.line + 1;

            if (closingLine > prevLine && hasEmptyLine(prevLine, closingLine)) {
                errors.add('Expected no padding newline before closing curly brace', prevToken.loc.end);
            }
        });
    }

};
