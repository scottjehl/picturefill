var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(operators) {
        assert(Array.isArray(operators), 'disallowRightStickedOperators option requires array value');
        this._operatorIndex = {};
        for (var i = 0, l = operators.length; i < l; i++) {
            this._operatorIndex[operators[i]] = true;
        }
    },

    getOptionName: function() {
        return 'disallowRightStickedOperators';
    },

    check: function(file, errors) {
        var operators = this._operatorIndex;

        file.iterateTokensByType('Punctuator', function(token, i, tokens) {
            if (operators[token.value]) {
                var nextToken = tokens[i + 1];
                if (nextToken && nextToken.range[0] === token.range[1]) {
                    errors.add(
                        'Operator ' + token.value + ' should not stick to following expression',
                        token.loc.start
                    );
                }
            }
        });
    }

};
