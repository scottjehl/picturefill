var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {
    configure: function(options) {
        var validProperties = [
            'afterTest',
            'beforeConsequent',
            'afterConsequent',
            'beforeAlternate'
        ];
        var optionName = this.getOptionName();

        if (options === true) {
            options = {
                'afterTest': true,
                'beforeConsequent': true,
                'afterConsequent': true,
                'beforeAlternate': true
            };
        }

        assert(
            typeof options === 'object',
            optionName + ' option must be an object or boolean true'
        );

        var isProperlyConfigured = validProperties.some(function(key) {
            var isPresent = key in options;

            if (isPresent) {
                assert(
                    options[key] === true,
                    optionName + '.' + key + ' property requires true value or should be removed'
                );
            }

            return isPresent;
        });

        assert(
            isProperlyConfigured,
            optionName + ' must have at least 1 of the following properties: ' + validProperties.join(', ')
        );

        validProperties.forEach(function(property) {
            this['_' + property] = Boolean(options[property]);
        }.bind(this));
    },

    getOptionName: function() {
        return 'disallowSpacesInConditionalExpression';
    },

    check: function(file, errors) {
        var tokens = file.getTokens();

        file.iterateNodesByType(['ConditionalExpression'], function(node) {

            var test = node.test;
            var testTokenPos = file.getTokenPosByRangeStart(test.range[0]);
            var consequent = node.consequent;
            var consequentTokenPos = file.getTokenPosByRangeStart(consequent.range[0]);
            var alternate = node.alternate;
            var questionMarkToken = tokens[testTokenPos + 1];
            var colonToken = tokens[consequentTokenPos + 1];
            var questionMark;
            var colon;

            if (this._afterTest && test.loc.end.line === questionMarkToken.loc.start.line) {
                questionMark = tokens[file.getTokenPosByRangeStart(test.range[1])];
                if (!questionMark || questionMark.value !== '?') {
                    errors.add(
                        'Illegal space after test',
                        test.loc.end
                    );
                }
            }

            if (this._beforeConsequent && consequent.loc.end.line === questionMarkToken.loc.start.line) {
                questionMark = tokens[file.getTokenPosByRangeStart(consequent.range[0] - 1)];
                if (!questionMark || questionMark.value !== '?') {
                    errors.add(
                        'Illegal space before consequent',
                        consequent.loc.start
                    );
                }
            }

            if (this._afterConsequent && consequent.loc.end.line === colonToken.loc.start.line) {
                colon = tokens[file.getTokenPosByRangeStart(consequent.range[1])];
                if (!colon || colon.value !== ':') {
                    errors.add(
                        'Illegal space after consequent',
                        consequent.loc.end
                    );
                }
            }

            if (this._beforeAlternate && alternate.loc.end.line === colonToken.loc.start.line) {
                colon = tokens[file.getTokenPosByRangeStart(alternate.range[0] - 1)];
                if (!colon || colon.value !== ':') {
                    errors.add(
                        'Illegal space before alternate',
                        alternate.loc.start
                    );
                }
            }
        }.bind(this));
    }

};
