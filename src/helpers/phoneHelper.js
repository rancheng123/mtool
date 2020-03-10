/**
 * @file helper.js
 * @author shijh
 *
 * 拨打电话辅助类
 */

import CnbService from '../service/cnbService'

class PhoneHelper {
    phones = []
    reset() {
        this.phones = []
    }
    add(number) {
        if (this.has(number)) return
        this.phones.push(number)
    }
    has(number) {
        return this.phones.indexOf(number) > -1
    }
    get() {
        return this.phones
    }
    remove(number) {
        const { phones } = this
        if (this.has(number)) {
            const i = phones.indexOf(number)
            phones.splice(i, 1)
        }
        this.phones = phones
    }
    hidePhone(number) {
        const numStr = `${number}`
        const len = numStr.length
        return `${numStr.substring(0, 3)}****${numStr.substring(7, len)}`
    }
    showPhone(number) {
        if (this.has(number)) {
            return number
        } else {
            return this.hidePhone(number)
        }
    }

    // 电话名字显示
    names = {}
    /**
     * 重置名字
     */
    resetNames() {
        this.names = {}
    }
    /**
     * 删除电话缓存姓名
     */
    removeName(phone) {
        delete this.names[phone]
    }
    /**
     * 通过电话获取姓名
     * @param {*} phone 电话号码
     */
    getName(phone) {
        let name = this.names[phone]

        // 如果name 是promise对象直接返回
        if (name && name instanceof Object) {
            return name
        }

        return new Promise((resolve, reject) => {
            // 优先拿缓存
            if (name && typeof name === 'string') {
                resolve(name)
                return
            }

            // 获取用户信息
            this.names[phone] = CnbService.users(phone)
            .then(res => {
                if (
                    res.status &&
                    res.data.length === 1 &&
                    res.data[0].phoneNumber === phone
                ) {
                    name = res.data[0].firstName
                } else {
                    name = this.showPhone(phone)
                }
                this.names[phone] = name
                resolve(name)
                return name
            })
            .catch(e => {
                name = this.showPhone(phone)
                this.names[phone] = name
                reject(name)
                return name
            })
        })
    }
}

export default new PhoneHelper()
