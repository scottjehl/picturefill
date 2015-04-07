var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {
    configure: function(options) {
        assert(
            typeof options === 'object',
            'disallowSpacesInNamedFunctionExpression option must be the object'
        );

        if ('beforeOpeningRoundBrace' in options) {
            assert(
                options.beforeOpeningRoundBrace === true,
                'disallowSpacesInNamedFunctionExpression.beforeOpeningRoundBrace ' +
                'property requires true value or should be removed'
            );
        }

        if ('beforeOpeningCurlyBrace' in options) {
            assert(
                options.beforeOpeningCurlyBrace === true,
                'disallowSpacesInNamedFunctionExpression.beforeOpeningCurlyBrace ' +
                'property requires true value or should be removed'
            );
        }

        assert(
            options.beforeOpeningCurlyBrace || options.beforeOpeningRoundBrace,
            'disallowSpacesInNamedFunctionExpression must have beforeOpeningCurlyBrace ' +
            'or beforeOpeningRoundBrace property'
        );

        this._beforeOpeningRoundBrace = Boolean(options.beforeOpeningRoundBrace);
        this._beforeOpeningCurlyBrace = Boolean(options.beforeOpeningCurlyBrace);
    },

    getOptionName: function() {
        return 'disallowSpacesInNamedFunctionExpression';
    },

    check: function(file, errors) {
        var beforeOpeningRoundBrace = this._beforeOpeningRoundBrace;
        var beforeOpeningCurlyBrace = this._beforeOpeningCurlyBrace;
        var tokens = file.getTokens();

        file.iterateNodesByType(['FunctionExpression'], function(node) {

            // named function expressions only
            if (node.id) {

                if (beforeOpeningRoundBrace) {
                    var nodeBeforeRoundBrace = node.id;

                    var functionTokenPos = file.getTokenPosByRangeStart(nodeBeforeRoundBrace.range[0]);
                    var functionToken = tokens[functionTokenPos];

                    var nextTokenPos = file.getTokenPosByRangeStart(functionToken.range[1]);
                    var nextToken = tokens[nextTokenPos];

                    if (!nextToken) {
                        errors.add(
                            'Illegal space before opening round brace',
                            functionToken.loc.start
                        );
                    }
                }

                if (beforeOpeningCurlyBrace) {
                    var tokenBeforeBodyPos = file.getTokenPosByRangeStart(node.body.range[0] - 1);
                    var tokenBeforeBody = tokens[tokenBeforeBodyPos];

                    if (!tokenBeforeBody) {
                        errors.add(
                            'Illegal space before opening curly brace',
                            node.body.loc.start
                        );
                    }
                }
            }
        });
    }

};
