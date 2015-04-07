var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(operators) {
        assert(Array.isArray(operators), this.getOptionName() + ' option requires array value');
        this._operatorIndex = {};
        for (var i = 0, l = operators.length; i < l; i++) {
            this._operatorIndex[operators[i]] = true;
        }
    },

    getOptionName: function() {
        return 'requireSpaceBeforePostfixUnaryOperators';
    },

    check: function(file, errors) {
        var operatorIndex = this._operatorIndex;
        var tokens = file.getTokens();

        // 'UpdateExpression' involve only ++ and -- operators
        file.iterateNodesByType('UpdateExpression', function(node) {
            // "!node.prefix" means postfix type of (inc|dec)rement
            if (!node.prefix && operatorIndex[node.operator]) {
                var operatorStartPos = node.range[1] - node.operator.length;
                var operatorTokenIndex = file.getTokenPosByRangeStart(operatorStartPos);
                var operatorToken = tokens[operatorTokenIndex];
                var prevToken = tokens[operatorTokenIndex - 1];
                if (operatorToken.range[0] === prevToken.range[1]) {
                    errors.add('Operator ' + node.operator + ' should not stick to operand', node.loc.start);
                }
            }
        });
    }
};
