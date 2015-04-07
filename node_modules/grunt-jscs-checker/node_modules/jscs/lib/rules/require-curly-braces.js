var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(statementTypes) {
        assert(Array.isArray(statementTypes), 'requireCurlyBraces option requires array value');
        this._typeIndex = {};
        for (var i = 0, l = statementTypes.length; i < l; i++) {
            this._typeIndex[statementTypes[i]] = true;
        }
    },

    getOptionName: function() {
        return 'requireCurlyBraces';
    },

    check: function(file, errors) {

        function addError(typeString, node) {
            errors.add(
                typeString + ' statement without curly braces',
                node.loc.start.line,
                node.loc.start.column
            );
        }

        function checkBody(type, typeString) {
            file.iterateNodesByType(type, function(node) {
                if (node.body && node.body.type !== 'BlockStatement') {
                    addError(typeString, node);
                }
            });
        }

        var typeIndex = this._typeIndex;
        if (typeIndex['if'] || typeIndex['else']) {
            file.iterateNodesByType('IfStatement', function(node) {
                if (typeIndex.if && node.consequent && node.consequent.type !== 'BlockStatement') {
                    addError('If', node);
                }
                if (typeIndex['else'] && node.alternate &&
                    node.alternate.type !== 'BlockStatement' &&
                    node.alternate.type !== 'IfStatement'
                ) {
                    addError('Else', node);
                }
            });
        }
        if (typeIndex['case'] || typeIndex['default']) {
            file.iterateNodesByType('SwitchCase', function(node) {
                // empty case statement
                if (!node.consequent || node.consequent.length === 0) {
                    return;
                }

                if (node.consequent.length === 1 && node.consequent[0].type === 'BlockStatement') {
                    return;
                }

                if (node.test === null && typeIndex['default']) {
                    addError('Default', node);
                }

                if (node.test !== null && typeIndex['case']) {
                    addError('Case', node);
                }
            });
        }
        if (typeIndex['while']) {
            checkBody('WhileStatement', 'While');
        }
        if (typeIndex['for']) {
            checkBody('ForStatement', 'For');
            checkBody('ForInStatement', 'For in');
        }
        if (typeIndex['do']) {
            checkBody('DoWhileStatement', 'Do while');
        }
    }

};
