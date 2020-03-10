const electron = require('electron')
const remote = electron.remote
const config = remote.require('./app/configuration')

import PhoneHelper from '../../../helpers/phoneHelper'


let id = ''
let callCache = {}
let phoneCache = []

getUser()

/**
 * 获取用户
 */
function getUser() {
    const userInfo = config.readSettings('userInfo') || {}
    const callPhoneHistory = config.readSettings('callPhoneHistory')
    id = userInfo.id
    callCache = callPhoneHistory || {}
    phoneCache = callCache[id] || []
}

/**
 * 格式化名字
 * 两个字及以下直接显示*
 * 三个字及以上显示第一个和最后一个字符中间显示*
 * @param {*} name
 */
function cutName(name = '') {
    const arr = name.split('')
    const len = arr.length

    if (len >= 3) {
        return `${arr[0]}*${arr[len - 1]}`
    }

    return '*'
}

/**
 * 对搜索结果排序
 * @param {*} x
 * @param {*} y
 */
function compare(x, y) {
    if (x.index > y.index) {
        return 1
    } else if (x.index < y.index) {
        return -1
    } else {
        return 0
    }
}

/**
 * 对后端返回数据处理，便于排序
 * 排序逻辑
 * 1. 优先匹配名字，全匹配最上面，其次从左到右
 * 2. 电话号码匹配，从左至右
 * @param {*} name
 * @param {*} phone
 * @param {*} keyWord
 */
function findKeyWordIndex(name, phone, keyWord) {
    const phoneIndx = phone.indexOf(keyWord)
    let nameIndx = name.indexOf(keyWord)

    if (nameIndx === -1 && phoneIndx === -1) {
        return -1
    }
    if (nameIndx !== -1) {
        const len = name.length
        if (keyWord.length === name.length) {
            return 0
        } else {
            return ++nameIndx
        }
    } else {
        return phoneIndx
    }
}

/**
 * 格式化后端返回数据
 * @param {*} lists
 */
export function parseList(lists, keyWord) {
    const start = []
    const end = []

    for (let i = 0; i < lists.length; i++) {
        const item = {}
        const { firstName, phoneNumber, userId } = lists[i]
        const hidePhone = PhoneHelper.hidePhone(phoneNumber)
        const index = findKeyWordIndex(firstName, hidePhone, keyWord)

        item.firstName = firstName
        item.phoneNumber = phoneNumber
        item.userId = userId
        item.displayName = firstName
        item.displayNumber = hidePhone
        item.index = index

        if (index === -1) {
            end.push(item)
        } else {
            start.push(item)
        }
    }

    return start.sort(compare).concat(end)
}

/**
 * 获取cache
 */
export function getCache() {
    getUser()
    return phoneCache
}

/**
 * 添加cache
 * @param {*} item
 */
export function addCache(item) {
    const oldList = phoneCache
    const result = {}
    let index = -1

    for (let i = 0; i < oldList.length; i++) {
        if (oldList[i].phoneNumber === item.phoneNumber) {
            index = i
            break
        }
    }

    if (index > -1) {
        oldList.splice(index, 1)
    }

    oldList.unshift(item)
    const newList = oldList.splice(0, 6)
    result[id] = newList
    phoneCache = [...newList]

    Object.assign(callCache, result)

    config.saveSettings('callPhoneHistory', JSON.parse(JSON.stringify(callCache)))

    return newList
}
