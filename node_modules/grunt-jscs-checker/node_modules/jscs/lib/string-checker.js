var esprima = require('esprima');
var Errors = require('./errors');
var JsFile = require('./js-file');
var preset = require('./options/preset');

/**
 * Starts Code Style checking process.
 *
 * @name StringChecker
 */
var StringChecker = function() {
    this._rules = [];
    this._activeRules = [];
    this._config = {};
};

StringChecker.prototype = {
    /**
     * Registers single Code Style checking rule.
     *
     * @param {Rule} rule
     */
    registerRule: function(rule) {
        this._rules.push(rule);
    },

    /**
     * Registers built-in Code Style cheking rules.
     */
    registerDefaultRules: function() {
        this.registerRule(new (require('./rules/require-curly-braces'))());
        this.registerRule(new (require('./rules/require-multiple-var-decl'))());
        this.registerRule(new (require('./rules/disallow-multiple-var-decl'))());
        this.registerRule(new (require('./rules/disallow-empty-blocks'))());
        this.registerRule(new (require('./rules/require-space-after-keywords'))());
        this.registerRule(new (require('./rules/disallow-space-after-keywords'))());
        this.registerRule(new (require('./rules/require-parentheses-around-iife'))());

        /* deprecated rules */
        this.registerRule(new (require('./rules/require-left-sticked-operators'))());
        this.registerRule(new (require('./rules/disallow-left-sticked-operators'))());
        this.registerRule(new (require('./rules/require-right-sticked-operators'))());
        this.registerRule(new (require('./rules/disallow-right-sticked-operators'))());
        /* deprecated rules (end) */

        this.registerRule(new (require('./rules/require-operator-before-line-break'))());
        this.registerRule(new (require('./rules/disallow-implicit-type-conversion'))());
        this.registerRule(new (require('./rules/require-camelcase-or-uppercase-identifiers'))());
        this.registerRule(new (require('./rules/disallow-keywords'))());
        this.registerRule(new (require('./rules/disallow-multiple-line-breaks'))());
        this.registerRule(new (require('./rules/disallow-multiple-line-strings'))());
        this.registerRule(new (require('./rules/validate-line-breaks'))());
        this.registerRule(new (require('./rules/validate-quote-marks'))());
        this.registerRule(new (require('./rules/validate-indentation'))());
        this.registerRule(new (require('./rules/disallow-trailing-whitespace'))());
        this.registerRule(new (require('./rules/disallow-mixed-spaces-and-tabs'))());
        this.registerRule(new (require('./rules/require-keywords-on-new-line'))());
        this.registerRule(new (require('./rules/disallow-keywords-on-new-line'))());
        this.registerRule(new (require('./rules/require-line-feed-at-file-end'))());
        this.registerRule(new (require('./rules/maximum-line-length'))());
        this.registerRule(new (require('./rules/validate-jsdoc'))());
        this.registerRule(new (require('./rules/disallow-yoda-conditions'))());
        this.registerRule(new (require('./rules/require-spaces-inside-object-brackets'))());
        this.registerRule(new (require('./rules/require-spaces-inside-array-brackets'))());
        this.registerRule(new (require('./rules/disallow-spaces-inside-object-brackets'))());
        this.registerRule(new (require('./rules/disallow-spaces-inside-array-brackets'))());
        this.registerRule(new (require('./rules/disallow-spaces-inside-parentheses'))());
        this.registerRule(new (require('./rules/require-blocks-on-newline'))());
        this.registerRule(new (require('./rules/require-space-after-object-keys'))());
        this.registerRule(new (require('./rules/disallow-space-after-object-keys'))());
        this.registerRule(new (require('./rules/disallow-quoted-keys-in-objects'))());
        this.registerRule(new (require('./rules/disallow-dangling-underscores'))());
        this.registerRule(new (require('./rules/require-aligned-object-values'))());

        this.registerRule(new (require('./rules/disallow-padding-newlines-in-blocks'))());
        this.registerRule(new (require('./rules/require-padding-newlines-in-blocks'))());

        this.registerRule(new (require('./rules/disallow-trailing-comma'))());
        this.registerRule(new (require('./rules/require-trailing-comma'))());

        this.registerRule(new (require('./rules/disallow-comma-before-line-break'))());
        this.registerRule(new (require('./rules/require-comma-before-line-break'))());

        this.registerRule(new (require('./rules/disallow-space-before-block-statements.js'))());
        this.registerRule(new (require('./rules/require-space-before-block-statements.js'))());

        this.registerRule(new (require('./rules/disallow-space-before-postfix-unary-operators.js'))());
        this.registerRule(new (require('./rules/require-space-before-postfix-unary-operators.js'))());

        this.registerRule(new (require('./rules/disallow-space-after-prefix-unary-operators.js'))());
        this.registerRule(new (require('./rules/require-space-after-prefix-unary-operators.js'))());

        this.registerRule(new (require('./rules/disallow-space-before-binary-operators'))());
        this.registerRule(new (require('./rules/require-space-before-binary-operators'))());

        this.registerRule(new (require('./rules/disallow-space-after-binary-operators'))());
        this.registerRule(new (require('./rules/require-space-after-binary-operators'))());

        this.registerRule(new (require('./rules/require-spaces-in-conditional-expression'))());
        this.registerRule(new (require('./rules/disallow-spaces-in-conditional-expression'))());

        this.registerRule(new (require('./rules/require-spaces-in-function-expression'))());
        this.registerRule(new (require('./rules/disallow-spaces-in-function-expression'))());
        this.registerRule(new (require('./rules/require-spaces-in-anonymous-function-expression'))());
        this.registerRule(new (require('./rules/disallow-spaces-in-anonymous-function-expression'))());
        this.registerRule(new (require('./rules/require-spaces-in-named-function-expression'))());
        this.registerRule(new (require('./rules/disallow-spaces-in-named-function-expression'))());
        this.registerRule(new (require('./rules/require-spaces-in-function-declaration'))());
        this.registerRule(new (require('./rules/disallow-spaces-in-function-declaration'))());

        this.registerRule(new (require('./rules/require-capitalized-constructors'))());

        this.registerRule(new (require('./rules/safe-context-keyword'))());

        this.registerRule(new (require('./rules/require-dot-notation'))());
    },

    /**
     * Get processed config
     * @return {Object}
     */
    getProcessedConfig: function() {
        return this._config;
    },

    /**
     * Loads configuration from JS Object. Activates and configures required rules.
     *
     * @param {Object} config
     */
    configure: function(config) {
        this.throwNonCamelCaseErrorIfNeeded(config);
        preset(config);

        var configRules = Object.keys(config);
        var activeRules = this._activeRules;

        this._config = config;
        this._rules.forEach(function(rule) {
            var ruleOptionName = rule.getOptionName();

            if (config.hasOwnProperty(ruleOptionName)) {

                // Do not configure the rule if it's equals to null (#203)
                if (config[ruleOptionName] !== null) {
                    rule.configure(config[ruleOptionName]);
                }
                activeRules.push(rule);
                configRules.splice(configRules.indexOf(ruleOptionName), 1);
            }
        });
        if (configRules.length > 0) {
            throw new Error('Unsupported rules: ' + configRules.join(', '));
        }
    },

    /**
     * Throws error for non camel-case options.
     *
     * @param {Object} config
     */
    throwNonCamelCaseErrorIfNeeded: function(config) {
        function symbolToUpperCase(s, symbol) {
            return symbol.toUpperCase();
        }
        function fixConfig(originConfig) {
            var result = {};
            for (var i in originConfig) {
                if (originConfig.hasOwnProperty(i)) {
                    var camelCaseName = i.replace(/_([a-zA-Z])/g, symbolToUpperCase);
                    var value = originConfig[i];
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        value = fixConfig(value);
                    }
                    result[camelCaseName] = value;
                }
            }
            return result;
        }
        var hasOldStyleConfigParams = false;
        for (var i in config) {
            if (config.hasOwnProperty(i)) {
                if (i.indexOf('_') !== -1) {
                    hasOldStyleConfigParams = true;
                    break;
                }
            }
        }
        if (hasOldStyleConfigParams) {
            throw new Error('JSCS now accepts configuration options in camel case. Sorry for inconvenience. ' +
                'On the bright side, we tried to convert your jscs config to camel case.\n' +
                '----------------------------------------\n' +
                JSON.stringify(fixConfig(config), null, 4) +
                '\n----------------------------------------\n');
        }
    },

    /**
     * Checks file provided with a string.
     * @param {String} str
     * @param {String} filename
     * @returns {Errors}
     */
    checkString: function(str, filename) {
        filename = filename || 'input';
        var tree;
        str = str.replace(/^#![^\n]+\n/, '\n');
        try {
            tree = esprima.parse(str, {loc: true, range: true, comment: true, tokens: true});
        } catch (e) {
            throw new Error('Syntax error at ' + filename + ': ' + e.message);
        }
        var file = new JsFile(filename, str, tree);
        var errors = new Errors(file);
        this._activeRules.forEach(function(rule) {

            // Do not process the rule if it's equals to null (#203)
            if (this._config[rule.getOptionName()] !== null ) {
                rule.check(file, errors);
            }

        }, this);

        // sort errors list to show errors as they appear in source
        errors.getErrorList().sort(function(a, b) {
            return (a.line - b.line) || (a.column - b.column);
        });

        return errors;
    }
};

module.exports = StringChecker;
