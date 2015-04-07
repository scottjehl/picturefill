
module.exports = Chain;
function Chain(end) {
    var self = Object.create(Chain.prototype);
    self.end = end || function (next) {
        return next;
    };
    return self;
};

Chain.prototype.use = function (App /*, ...args*/) {
    if (!App) throw new Error("App is not defined after " + this.app);
    var args = Array.prototype.slice.call(arguments, 1);
    var self = this;
    this.end = (function (End) {
        return function Self(next) {
            if (self.end !== Self && !next) throw new Error("App chain is broken after " + App);
            return End(App.apply(null, [next].concat(args)));
        };
    })(this.end);
    this.app = App;
    return this;
};

