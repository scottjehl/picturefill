var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(options) {
        assert(typeof options === 'object', 'validateJSDoc option requires object value');
        this._options = options;
    },

    getOptionName: function() {
        return 'validateJSDoc';
    },

    check: function(file, errors) {
        var options = this._options;
        var comments = file.getComments();
        file.iterateNodesByType(['FunctionDeclaration', 'FunctionExpression'], function(node) {
            var jsDoc = getJsDocForLine(node.loc.start.line);
            if (jsDoc) {
                var jsDocData = jsDoc.value;
                var jsDocLines = jsDocData.split('\n');
                var paramIndex = 0;
                if (options.checkParamNames || options.checkRedundantParams || options.requireParamTypes) {
                    for (var i = 0, l = jsDocLines.length; i < l; i++) {
                        var line = jsDocLines[i].trim();
                        if (line.charAt(0) === '*') {
                            line = line.substr(1).trim();
                            if (line.indexOf('@param') === 0) {
                                var match = line.match(/^@param\s+(?:{(.+?)})?\s*(?:\[)?([a-zA-Z0-9_\.\$]+)/);
                                if (match) {
                                    var jsDocParamType = match[1];
                                    var jsDocParamName = match[2];
                                    if (options.requireParamTypes && !jsDocParamType) {
                                        errors.add(
                                            'Missing JSDoc @param type',
                                            jsDoc.loc.start.line + i,
                                            jsDocLines[i].indexOf('@param')
                                        );
                                    }
                                    if (jsDocParamName.indexOf('.') === -1) {
                                        var param = node.params[paramIndex];
                                        if (param) {
                                            if (jsDocParamName !== param.name) {
                                                if (options.checkParamNames) {
                                                    errors.add(
                                                        'Invalid JSDoc @param argument name',
                                                        jsDoc.loc.start.line + i,
                                                        jsDocLines[i].indexOf('@param')
                                                    );
                                                }
                                            }
                                        } else {
                                            if (options.checkRedundantParams) {
                                                errors.add(
                                                    'Redundant JSDoc @param',
                                                    jsDoc.loc.start.line + i,
                                                    jsDocLines[i].indexOf('@param')
                                                );
                                            }
                                        }
                                        paramIndex++;
                                    }
                                } else {
                                    errors.add(
                                        'Invalid JSDoc @param',
                                        jsDoc.loc.start.line + i,
                                        jsDocLines[i].indexOf('@param')
                                    );
                                }
                            }
                        }
                    }
                }
            }
        });

        function getJsDocForLine(line) {
            line--;
            for (var i = 0, l = comments.length; i < l; i++) {
                var comment = comments[i];
                if (comment.loc.end.line === line && comment.type === 'Block' && comment.value.charAt(0) === '*') {
                    return comment;
                }
            }
            return null;
        }
    }

};
