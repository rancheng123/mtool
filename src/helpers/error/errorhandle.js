import {
    Message
} from 'element-ui'

let message = {
    server_error: '服务异常，请稍后重试',
    screen_control_errr: '屏幕无法接收指令'
}
let timer
let instance
export default {
    showErrorMessage(error) {
        let duration = error.duration === undefined ? 5000 : error.duration
        console.log(duration)

        let customClass = 'mt-message'
        try {
            if (window.vue.$store.state.isFullscreenMode && window.vue.$route.name === 'meeting') {
                customClass = 'mt-message fullscreenmode'
            }
        } catch (e) {}

        let opt = {
            message: message[error.code] || error.message,
            type: 'error',
            duration: duration,
            customClass
        }
        instance = Message(opt)
        clearTimeout(timer)
        if (duration !== 0) {
            timer = setTimeout(() => {
                if (instance) {
                    instance.close()
                }
            }, duration)
        }

        return instance
    },
    hideErrorMessage() {
        if (instance) {
            instance.close()
        }
    }
}
