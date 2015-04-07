var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(types) {
        assert(Array.isArray(types), 'disallowImplicitTypeConversion option requires array value');
        this._typeIndex = {};
        for (var i = 0, l = types.length; i < l; i++) {
            this._typeIndex[types[i]] = true;
        }
    },

    getOptionName: function() {
        return 'disallowImplicitTypeConversion';
    },

    check: function(file, errors) {
        var types = this._typeIndex;
        if (types.numeric || types.boolean || types.binary) {
            file.iterateNodesByType('UnaryExpression', function(node) {
                if (types.numeric && node.operator === '+') {
                    errors.add('Implicit numeric conversion', node.loc.start);
                }
                if (types.binary && node.operator === '~') {
                    errors.add('Implicit binary conversion', node.loc.start);
                }
                if (types.boolean &&
                    node.operator === '!' &&
                    node.argument.type === 'UnaryExpression' &&
                    node.argument.operator === '!'
                ) {
                    errors.add('Implicit boolean conversion', node.loc.start);
                }
            });
        }
        if (types.string) {
            file.iterateNodesByType('BinaryExpression', function(node) {
                if (node.operator === '+' && (
                        (node.left.type === 'Literal' && node.left.value === '') ||
                        (node.right.type === 'Literal' && node.right.value === '')
                    )
                ) {
                    errors.add('Implicit string conversion', node.loc.start);
                }
            });
        }
    }

};
