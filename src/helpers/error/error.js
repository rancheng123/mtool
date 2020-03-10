export default class CustomError {
    constructor(opt) {
        let o = opt || {}
        this.code = o.code || ''
        this.type = o.type || ''
        this.message = o.message || ''
    }
}
