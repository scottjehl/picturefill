var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(maximumLineLength) {
        assert(
            typeof maximumLineLength === 'number',
            'maximumLineLength option requires number value'
        );

        this._maximumLineLength = maximumLineLength;
    },

    getOptionName: function() {
        return 'maximumLineLength';
    },

    check: function(file, errors) {
        var maximumLineLength = this._maximumLineLength;

        var lines = file.getLines();
        for (var i = 0, l = lines.length; i < l; i++) {
            if (lines[i].length > maximumLineLength) {
                errors.add('Line must be at most ' + maximumLineLength + ' characters', i + 1, 0);
            }
        }
    }

};
