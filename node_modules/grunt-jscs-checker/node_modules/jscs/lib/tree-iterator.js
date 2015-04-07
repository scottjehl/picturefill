module.exports = {
    iterate: iterate
};

var iterableProperties = {
    'body': true,
    'expression': true,

    // if
    'test': true,
    'consequent': true,
    'alternate': true,

    'object': true,

    //switch
    'discriminant': true,
    'cases': true,

    // return
    'argument': true,
    'arguments': true,

    // try
    'block': true,
    'guardedHandlers': true,
    'handlers': true,
    'finalizer': true,

    // catch
    'handler': true,

    // for
    'init': true,
    'update': true,

    // for in
    'left': true,
    'right': true,

    // var
    'declarations': true,

    // array
    'elements': true,

    // object
    'properties': true,
    'key': true,
    'value': true,

    // new
    'callee': true,

    // xxx.yyy
    'property': true
};

function iterate(node, cb, parentNode, parentCollection) {
    if (cb(node, parentNode, parentCollection) === false) {
        return;
    }

    for (var propName in node) {
        if (node.hasOwnProperty(propName)) {
            if (iterableProperties[propName]) {
                var contents = node[propName];
                if (typeof contents === 'object') {
                    if (Array.isArray(contents)) {
                        for (var i = 0, l = contents.length; i < l; i++) {
                            iterate(contents[i], cb, node, contents);
                        }
                    } else {
                        iterate(contents, cb, node, [contents]);
                    }
                }
            }
        }
    }
}
