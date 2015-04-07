var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(keywords) {
        assert(
            typeof keywords === 'string' ||
            typeof Array.isArray(keywords),
            'safeContextKeyword option requires string or array value'
        );

        this._keywords = keywords;
    },

    getOptionName: function() {
        return 'safeContextKeyword';
    },

    check: function(file, errors) {
        var keywords = typeof this._keywords === 'string' ? [this._keywords] : this._keywords;

        // var that = this
        file.iterateNodesByType('VariableDeclaration', function(node) {
            for (var i = 0; i < node.declarations.length; i++) {
                var decl = node.declarations[i];

                // decl.init === null in case of "var foo;"
                if (decl.init &&
                    (decl.init.type === 'ThisExpression' && checkKeywords(decl.id.name, keywords))
                ) {
                    errors.add(
                        'You should use "' + keywords.join('" or "') + '" to save a reference to "this"',
                        node.loc.start
                    );
                }
            }
        });

        // that = this
        file.iterateNodesByType('AssignmentExpression', function(node) {

            if (
                // filter property assignments "foo.bar = this"
                node.left.type === 'Identifier' &&
                (node.right.type === 'ThisExpression' && checkKeywords(node.left.name, keywords))
            ) {
                errors.add(
                    'You should use "' + keywords.join('" or "') + '" to save a reference to "this"',
                    node.loc.start
                );
            }
        });
    }
};

/**
 * Check if at least one keyword equals to passed name
 * @param {String} name
 * @param {Array} keywords
 * @return {Boolean}
 */
function checkKeywords(name, keywords) {
    for (var i = 0; i < keywords.length; i++) {
        if (name === keywords[i]) {
            return false;
        }
    }

    return true;
}
