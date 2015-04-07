(function(paramA, paramB) {
    var longNameA = 1;
    var longNameB = 2;
    function longFunctionC(argumentC, argumentD) {
        return longNameA + longNameB + argumentC + argumentD;
    }
    var result = longFunctionC(3, 4);
})(window.argA, window.argB);