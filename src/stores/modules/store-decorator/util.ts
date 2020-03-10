/**
 * 获取对应的类型的 store actions, mutations, getters
 *
 * @param context
 * @param type 要查找的 proto 上的属性
 */
export type ProtoType = '__actions__' | '__mutations__' | '__getters__' | 'state';

export function getMethods(Store: ObjectConstructor, typeName: ProtoType) {
  let methods: any = {};
  const proto: any = Store.prototype;

  Object.getOwnPropertyNames(proto).forEach((key: string) => {
    if (key === typeName) {
      // function names
      const names = proto[key];

      if (typeof names === 'function') {
        methods = Object.getOwnPropertyDescriptor(proto, key).value;
      } else {
        names.forEach((name: string) => {
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
export function createMapping(context: any, key: ProtoType, funcName: string) {
  if (!context[key]) {
    context[key] = [];
  }

  context[key].push(funcName);
}
