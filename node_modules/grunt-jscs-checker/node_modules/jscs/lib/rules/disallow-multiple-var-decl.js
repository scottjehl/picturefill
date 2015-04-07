var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(disallowMultipleVarDecl) {
        assert(
            typeof disallowMultipleVarDecl === 'boolean',
            'disallowMultipleVarDecl option requires boolean value'
        );
        assert(
            disallowMultipleVarDecl === true,
            'disallowMultipleVarDecl option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'disallowMultipleVarDecl';
    },

    check: function(file, errors) {
        file.iterateNodesByType('VariableDeclaration', function(node) {
            // allow multiple var declarations in for statement
            // for (var i = 0, j = myArray.length; i < j; i++) {}
            if (node.declarations.length > 1 && node.parentNode.type !== 'ForStatement') {
                errors.add('Multiple var declaration', node.loc.start);
            }
        });
    }

};
