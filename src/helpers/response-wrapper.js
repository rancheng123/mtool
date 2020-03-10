import DataUtils from '../helpers/data'
import BaseModel from '../models/base-model'

/*
 Require response format:
 {
 code: 0,
 message: '',
 data: [] or {}
 }
 */

export default class ResponseWrapper {
    constructor() {
        this.raw = null
        this.success = false
        this.code = 0
        this.message = null
        this.data = null
    }

    /**
     * 创建HTTP级的未知错误信息
     * @param code HTTP status code
     * @param message 自定义错误消息
     * @returns {ResponseWrapper}
     */
    static createWithUnkownError(code, message) {
        let wrapper = new ResponseWrapper()
        if (code) {
            wrapper.code = code
        } else {
            wrapper.code = 0
        }
        if (message) {
            wrapper.message = message + ''
        } else {
            wrapper.message = '未知错误'
        }
        return wrapper
    }

    /**
     * 根据服务器返回的结果创建ResponseWrapper
     * @param response 服务器返回的JSON Object
     * @param modelClass 要转化为Model的类
     * @returns {ResponseWrapper}
     */
    static createWithResponse(response, modelClass) {
        let wrapper = new ResponseWrapper()
        wrapper.raw = response
        wrapper.code = DataUtils.parseInt2(response.code)
        wrapper.success = (wrapper.code >= 200 && wrapper.code < 300)
        if (response.message) {
            wrapper.message = response.message + ''
        } else {
            if (!wrapper.success) {
                wrapper.message = '未知错误'
            }
        }

        try {
            if (response.data instanceof Array) {
                wrapper.data = []
                response.data.forEach(e => {
                    /* eslint-disable new-cap */
                    let model = BaseModel.createFromObject(modelClass, e)
                    wrapper.data.push(model)
                })
            } else {
                /* eslint-disable new-cap */
                let model = BaseModel.createFromObject(modelClass, response.data)
                wrapper.data = model
            }
        } catch (ex) {
            console.log(ex)
        }
        return wrapper
    }
}
