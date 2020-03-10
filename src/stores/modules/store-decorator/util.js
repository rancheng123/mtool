export function getMethods(Store, typeName) {
    let methods = {};
    const proto = Store.prototype;
    Object.getOwnPropertyNames(proto).forEach((key) => {
        if (key === typeName) {
            // function names
            const names = proto[key];
            if (typeof names === 'function') {
                methods = Object.getOwnPropertyDescriptor(proto, key).value;
            }
            else {
                names.forEach((name) => {
                    const descriptor = Object.getOwnPropertyDescriptor(proto, name);
                    methods[name] = descriptor.value;
                });
            }
        }
    });
    return methods;
}
/**
 * 创建映射
 *
 * @param context es5.lib -> Object
 * @param key
 * @param funcName
 */
export function createMapping(context, key, funcName) {
    if (!context[key]) {
        context[key] = [];
    }
    context[key].push(funcName);
}
//# sourceMappingURL=util.js.map