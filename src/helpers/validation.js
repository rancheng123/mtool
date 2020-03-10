class ValidationUtils {
    validatePhoneNumber(str) {
        /* eslint-disable no-useless-escape */
        var re = /^1[0-9]{10}$/
        return re.test(str)
    }

    validateEmail(str) {
        // http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
        /* eslint-disable no-useless-escape */
        var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+[^<>()\.,;:\s@\"]{2,})$/
        return re.test(str)
    }
}

export default new ValidationUtils()
