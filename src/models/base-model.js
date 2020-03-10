/**
 * 规范：
 * 定义：服务器返回的数据项叫"字段（field）"，JS Model中对应的叫"属性（property）"
 * 自动以camelCase的形式映射服务器的字段到属性
 * 为所有需要的字段创建属性
 * 若有其它要求（比如类型转化，边界检测）的属性，请使用addCustomProperty实现
 * 根据需要，如果有不以camelCase形式映射的属性，子类覆盖 transformFieldName 来实现
 */

import camelCase from 'camelcase'

export default class BaseModel {
    constructor() {
    }

    /**
     * 子类覆盖此方法来实现自定义字段映射
     * @param field
     */
    static transformFieldName(field) {
        return camelCase(field)
    }

    /**
     * 根据from的值创建modelClass类型的对象
     * @param from
     */
    static createFromObject(modelClass, from) {
        /* eslint-disable new-cap */
        let obj = new modelClass()
        for (let field in from) {
            obj[obj.constructor.transformFieldName(field)] = from[field]
        }
        return obj
    }

    /**
     * 添加自定义属性，以实现自定义getter/setter。该方法会自动创建与getter/setter相关联的私有属性，
     * 名字为下划线加属性名
     * @param model Model实例，一般在了类的constructor中调用，所以传this
     * @param name 属性名
     * @param value 属性的默认值
     * @param getter 属性的getter，不传默认返回关联的私有属性
     * @param setter 属性的setter，不传默认设置关联的私有属性
     */
    static addCustomProperty(model, {name, value, getter, setter}) {
        const prv = '_' + name
        const pub = name
        if (!getter) {
            getter = () => {
                return model[prv]
            }
        }
        if (!setter) {
            setter = (value) => {
                model[prv] = value
            }
        }
        Object.defineProperty(model, prv, {
            enumerable: false,
            writable: true,
            configurable: true,
            value: value
        })
        Object.defineProperty(model, pub, {
            enumerable: true,
            configurable: true,
            get: getter,
            set: setter
        })
    }

}
