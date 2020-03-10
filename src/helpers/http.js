import ResponseWrapper from './response-wrapper'

class HTTPUtils {
    /**
     * 处理vue-resource返回的Promise，并将其返回。返回的Promise的then带的参数是一个ResponseWrapper
     * @param vueResourcePromise vue-resource返回的Promise
     * @param modelClass 要转化为Model的类
     * @returns {Promise.<TResult>}
     */
    wrapVueResourceResponse(vueResourcePromise, modelClass) {
        return vueResourcePromise.then(
            function(response) {
                var responseBody = response.body
                return ResponseWrapper.createWithResponse(responseBody, modelClass)
            },
            function(response) {
                return ResponseWrapper.createWithUnkownError(response.status, response)
            }
        )
    }
}

export default new HTTPUtils()
