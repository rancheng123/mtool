import Error from './error'

export default {
    handleError(e) {
        let type = e.type
        let status = e.status
        let error
        if (status) {
            return
        }

        switch (type) {
            case 'client_init':
            case 'error':
                error = this.clientError(e)
                break
            case 'init_local_stream':
                break
            case 'join_room':
                break
            case 'start-share-screen':
                break
            case 'stop-share-screen':
                break
        }

        return error
    },
    clientError(e) {
        let error = e.error || {}
        let errorOpt = {
            type: 'client_error',
            code: '',
            message: ''
        }
        let reason = error.reason || ''
        errorOpt.code = reason

        switch (reason) {
            case 'ALREADY_IN_USE':
                errorOpt.message = '视频服务正在使用'
                break
            case 'CLOSE_BEFORE_OPEN':
                errorOpt.message = '视频服务未正确启动'
                break
            case 'INCOMPATIBLE_WEBAGENT':
                errorOpt.message = '不兼容的视频服务'
                break
            case 'LOST_CONNECTION_TO_AGENT':
                errorOpt.message = '无法联接视频服务'
                break
            case 'DYNAMIC_KEY_TIMEOUT':
                break
            case 'CONNECTION_INTERRUPTED':
                errorOpt.message = '网络不稳定，出现网络中断'
                break
            case 'CONNECTION_LOST':
                errorOpt.message = '无网络连接'
                break
        }

        return new Error(errorOpt)
    }
}
