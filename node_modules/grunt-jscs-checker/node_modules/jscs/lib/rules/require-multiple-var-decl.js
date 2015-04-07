var assert = require('assert');

function consecutive(file, errors) {
    file.iterateNodesByType('VariableDeclaration', function(node) {
        var pos = node.parentCollection.indexOf(node);
        if (pos < node.parentCollection.length - 1) {
            var sibling = node.parentCollection[pos + 1];
            if (sibling.type === 'VariableDeclaration') {
                errors.add(
                    'Var declarations should be joined',
                    sibling.loc.start
                );
            }
        }
    });
}

function onevar(file, errors) {
    file.iterateNodesByType(['Program', 'FunctionDeclaration', 'FunctionExpression'], function(node) {
        var firstVar = true;
        var firstParent = true;

        file.iterate(function(node) {
            var type = node && node.type;

            // Don't go in nested scopes
            if ( !firstParent && type && ['FunctionDeclaration', 'FunctionExpression'].indexOf(type) > -1) {
                return false;
            }

            if ( firstParent ) {
                firstParent = false;
            }

            if (type === 'VariableDeclaration') {
                if (!firstVar) {
                    errors.add(
                        'Var declarations should be joined',
                        node.loc.start
                    );
                } else {
                    firstVar = false;
                }
            }
        }, node);
    });
}

module.exports = function() {};

module.exports.prototype = {
    configure: function(requireMultipleVarDecl) {
        assert(
            typeof requireMultipleVarDecl === 'boolean' ||
            typeof requireMultipleVarDecl === 'string',
            'requireMultipleVarDecl option requires boolean or string'
        );
        assert(
            requireMultipleVarDecl === true || requireMultipleVarDecl === 'onevar',
            'requireMultipleVarDecl option requires true value or `onevar` string'
        );

        this._check = typeof requireMultipleVarDecl === 'string' ? onevar : consecutive;
    },

    getOptionName: function() {
        return 'requireMultipleVarDecl';
    },

    check: function() {
        return this._check.apply(this, arguments);
    }
};
