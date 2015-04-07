var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(validateIndentation) {
        assert(
            validateIndentation === '\t' ||
                (typeof validateIndentation === 'number' && validateIndentation > 0),
            'validateIndentation option requires a positive number of spaces or "\\t"'
        );

        if (typeof validateIndentation === 'number') {
            this._indentChar = ' ';
            this._indentSize = validateIndentation;
        } else {
            this._indentChar = '\t';
            this._indentSize = 1;
        }

        this._indentableNodes = {
            BlockStatement: 'body',
            Program: 'body',
            ObjectExpression: 'properties',
            ArrayExpression: 'elements',
            SwitchStatement: 'cases',
            SwitchCase: 'consequent'
        };
    },

    getOptionName: function() {
        return 'validateIndentation';
    },

    check: function(file, errors) {
        function getLinesWithCommentsRemoved() {
            var lines = file.getLines().concat();
            file.getComments().reverse().forEach(function(comment) {
                var startLine = comment.loc.start.line;
                var startCol = comment.loc.start.column;
                var endLine = comment.loc.end.line;
                var endCol = comment.loc.end.column;
                var i = startLine - 1;

                if (startLine === endLine) {
                    lines[i] = lines[i].substring(0, startCol) + lines[i].substring(endCol);
                } else {
                    lines[i] = lines[i].substring(0, startCol);
                    for (var x = i + 1; x < endLine - 1; x++) {
                        lines[x] = '';
                    }
                    lines[x] = lines[x].substring(endCol + 1);

                    if (lines[x] !== '') {
                        errors.add(
                            'Multiline comments should not have tokens on its ending line',
                            x + 1,
                            endCol
                        );
                    }
                }
            });
            return lines;
        }

        function isMultiline(node) {
            return node.loc.start.line !== node.loc.end.line;
        }

        function getIndentationFromLine(i) {
            var rNotIndentChar = new RegExp('[^' + indentChar + ']');
            var firstContent = Math.max(lines[i].search(rNotIndentChar), 0);
            return firstContent;
        }

        function markPop(node, indents, popAfter) {
            var loc = node.loc;
            if ( popAfter ) {
                linesToCheck[loc.end.line - 1].popAfter = true;
            } else {
                linesToCheck[loc.end.line - 1].pop = indents;
            }
        }

        function markPushAndCheck(pushNode, indents) {
            linesToCheck[pushNode.loc.start.line - 1].push = indents;
            linesToCheck[pushNode.loc.end.line - 1].check = true;
        }

        function markChildren(node) {
            var childrenProperty = indentableNodes[node.type],
                children = node[childrenProperty];

            children.forEach(function(childNode, i) {
                /* temporary fix for holes in arrays: https://github.com/ariya/esprima/pull/241 */
                if (childNode === null) {
                    var leftLine, rightLine, j;
                    for (j = i - 1; j >= 0; j -= 1) {
                        if (children[j]) {
                            leftLine = children[j].loc.end.line;
                            break;
                        }
                    }
                    for (j = i + 1; j < children.length; j += 1) {
                        if (children[j]) {
                            rightLine = children[j].loc.start.line;
                            break;
                        }
                    }
                    leftLine = leftLine || node.loc.start.line;
                    rightLine = rightLine || node.loc.end.line;
                    for (j = leftLine; j < rightLine; j++) {
                        linesToCheck[j - 1].check = lines[j - 1].replace(/[\s\t]/g, '').length > 0;
                    }
                    return;
                }
                /* /fix */
                if (childNode.loc.start.line !== node.loc.start.line) {
                    linesToCheck[childNode.loc.start.line - 1].check = true;
                }
            });
        }

        function checkIndentations() {
            linesToCheck.forEach(function(line, i) {
                var expectedIndentation;
                var actualIndentation = getIndentationFromLine(i);

                if (line.pop !== null) {
                    expectedIndentation = indentStack.pop() - (indentSize * line.pop);
                } else {
                    expectedIndentation = indentStack[indentStack.length - 1];
                }
                if (line.check) {
                    if (actualIndentation !== expectedIndentation) {
                        errors.add(
                            'Expected indentation of ' + expectedIndentation + ' characters',
                            i + 1,
                            expectedIndentation
                        );
                        // correct the indentation so that future lines
                        // can be validated appropriately
                        actualIndentation = expectedIndentation;
                    }
                }

                if (line.popAfter) {
                    indentStack.pop();
                }

                if (line.push !== null) {
                    indentStack.push(actualIndentation + (indentSize * line.push));
                }
            });
        }

        function checkAlternateBlockStatement(node, property) {
            var child =  node[property];
            if (child && child.type === 'BlockStatement') {
                linesToCheck[child.loc.start.line - 1].push = 1;
                linesToCheck[child.loc.start.line - 1].check = true;
            }
        }

        function generateIndentations() {
            file.iterateNodesByType([
                'Program'
            ], function(node) {
                if (!isMultiline(node)) {
                    return;
                }

                markChildren(node);
            });

            file.iterateNodesByType([
                'ObjectExpression',
                'ArrayExpression'
            ], function(node) {
                if (!isMultiline(node)) {
                    return;
                }

                markChildren(node);
                markPop(node, 1);
                markPushAndCheck(node, 1);
            });

            file.iterateNodesByType('BlockStatement', function(node) {
                if (!isMultiline(node)) {
                    return;
                }

                markChildren(node);
                markPop(node, 1);
                markPushAndCheck(node.parentNode, 1);
            });

            file.iterateNodesByType('IfStatement', function(node) {
                checkAlternateBlockStatement(node, 'alternate');

                var test = node.test,
                    endLine = test.loc.end.line - 1;

                if (isMultiline(test) && linesToCheck[endLine].pop !== null) {
                    linesToCheck[endLine].push = 1;
                }

            });

            file.iterateNodesByType('TryStatement', function(node) {
                checkAlternateBlockStatement(node, 'handler');
                checkAlternateBlockStatement(node, 'finalizer');
            });

            file.iterateNodesByType('SwitchStatement', function(node) {
                if (!isMultiline(node)) {
                    return;
                }
                var indents = 1;

                var childrenProperty = indentableNodes[node.type];
                var children = node[childrenProperty];

                if ( children.length > 0 &&
                    node.loc.start.column === children[0].loc.start.column ) {
                    indents = 0;
                }

                markChildren(node);
                markPop(node, indents);
                markPushAndCheck(node, indents);
            });

            file.iterateNodesByType('SwitchCase', function(node) {
                if (!isMultiline(node)) {
                    return;
                }

                var childrenProperty = indentableNodes[node.type];
                var children = node[childrenProperty];

                if (children.length > 1 || children[0].type !== 'BlockStatement') {
                    markChildren(node);
                    markPop(node, 1, true);
                    markPushAndCheck(node, 1);
                }
            });

            file.iterateNodesByType('VariableDeclaration', function(node) {
                var startLine = node.loc.start.line - 1;
                var decls = node.declarations;
                var declStartLine = decls[0].loc.start.line - 1;
                var actualIndents;
                var newIndents;

                if (startLine !== declStartLine) {
                    return;
                }

                if (linesToCheck[startLine].push !== null) {
                    actualIndents = getIndentationFromLine(startLine);

                    if (decls.length > 1) {
                        newIndents = getIndentationFromLine(decls[1].loc.start.line - 1);
                    } else {
                        newIndents = getIndentationFromLine(decls[0].loc.end.line - 1);
                    }
                    linesToCheck[startLine].push = ((newIndents - actualIndents) / indentSize) + 1;
                }
            });
        }

        var indentableNodes = this._indentableNodes;
        var indentChar = this._indentChar;
        var indentSize = this._indentSize;

        var lines = getLinesWithCommentsRemoved();
        var indentStack = [0];
        var linesToCheck = lines.map(function() {
            return {
                push: null,
                pop: null,
                popAfter: null,
                check: null
            };
        });

        generateIndentations();
        checkIndentations();
    }

};
