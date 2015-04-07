var presets = {
    jquery: require('../../presets/jquery.json'),
    google: require('../../presets/google.json')
};

module.exports = function(config) {
    if (!config.preset) {
        return;
    }

    var preset = presets[config.preset];

    delete config.preset;
    for (var rule in preset) {
        if (!(rule in config)) {
            config[rule] = preset[rule];
        }
    }
};
