var treeIterator = require('./tree-iterator');

/**
 * File representation for JSCS.
 *
 * @name JsFile
 */
var JsFile = function(filename, source, tree) {
    this._filename = filename;
    this._source = source;
    this._tree = tree;
    this._lines = source.split(/\r\n|\r|\n/);
    this._tokenIndex = null;
    var index = this._index = {};
    var _this = this;
    this.iterate(function(node, parentNode, parentCollection) {
        if (node) {
            var type = node.type;
            if (type) {
                node.parentNode = parentNode;
                node.parentCollection = parentCollection;
                (index[type] || (index[type] = [])).push(node);

                // Temporary fix (i hope) for esprima tokenizer
                // (https://code.google.com/p/esprima/issues/detail?id=481)
                // Fixes #83, #180
                switch (type) {
                    case 'Property':
                        convertKeywordToIdentifierIfRequired(node.key);
                        break;
                    case 'MemberExpression':
                        convertKeywordToIdentifierIfRequired(node.property);
                        break;
                }
            }
        }
    });

    // Part of temporary esprima fix.
    function convertKeywordToIdentifierIfRequired(node) {
        var tokenPos = _this.getTokenPosByRangeStart(node.range[0]);
        if (tokenPos !== undefined) {
            var token = _this._tree.tokens[tokenPos];
            if (token.type === 'Keyword') {
                token.type = 'Identifier';
            }
        }
    }
};

JsFile.prototype = {
    /**
     * Builds token index by starting pos for futher navigation.
     */
    _buildTokenIndex: function() {
        var tokens = this._tree.tokens;
        var tokenIndex = {};
        for (var i = 0, l = tokens.length; i < l; i++) {
            tokenIndex[tokens[i].range[0]] = i;
        }
        this._tokenIndex = tokenIndex;
    },
    /**
     * Returns token position using range start from the index.
     *
     * @returns {Object}
     */
    getTokenPosByRangeStart: function(start) {
        if (!this._tokenIndex) {
            this._buildTokenIndex();
        }
        return this._tokenIndex[start];
    },
    /**
     * Iterates through the token tree using tree iterator.
     * Calls passed function for every token.
     *
     * @param {Function} cb
     * @param {Function} [tree]
     */
    iterate: function(cb, tree) {
        return treeIterator.iterate(tree || this._tree, cb);
    },
    /**
     * Returns nodes by type(s) from earlier built index.
     *
     * @param {String|String[]} type
     * @returns {Object[]}
     */
    getNodesByType: function(type) {
        if (typeof type === 'string') {
            return this._index[type] || [];
        } else {
            var result = [];
            for (var i = 0, l = type.length; i < l; i++) {
                var nodes = this._index[type[i]];
                if (nodes) {
                    result = result.concat(nodes);
                }
            }
            return result;
        }
    },
    /**
     * Iterates nodes by type(s) from earlier built index.
     * Calls passed function for every matched node.
     *
     * @param {String|String[]} type
     * @param {Function} cb
     */
    iterateNodesByType: function(type, cb) {
        return this.getNodesByType(type).forEach(cb);
    },
    /**
     * Iterates tokens by type(s) from the token array.
     * Calls passed function for every matched token.
     *
     * @param {String|String[]} type
     * @param {Function} cb
     */
    iterateTokensByType: function(type, cb) {
        var types = (typeof type === 'string') ? [type] : type;
        var typeIndex = {};
        types.forEach(function(type) {
            typeIndex[type] = true;
        });

        this.getTokens().forEach(function(token, index, tokens) {
            if (typeIndex[token.type]) {
                cb(token, index, tokens);
            }
        });
    },
    /**
     * Returns string representing contents of the file.
     *
     * @returns {String}
     */
    getSource: function() {
        return this._source;
    },
    /**
     * Returns token tree, built using esprima.
     *
     * @returns {Object}
     */
    getTree: function() {
        return this._tree;
    },
    /**
     * Returns token list, built using esprima.
     *
     * @returns {Object[]}
     */
    getTokens: function() {
        return this._tree.tokens;
    },
    /**
     * Returns comment token list, built using esprima.
     */
    getComments: function() {
        return this._tree.comments;
    },
    /**
     * Returns source filename for this object representation.
     *
     * @returns {String}
     */
    getFilename: function() {
        return this._filename;
    },
    /**
     * Returns array of source lines for the file.
     *
     * @returns {String[]}
     */
    getLines: function() {
        return this._lines;
    }
};

module.exports = JsFile;
