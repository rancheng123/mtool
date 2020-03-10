class NavUtils {
    getURLParam(param) {
        var toReturn = null
        try {
            /* eslint-disable no-useless-escape */
            var cmps = window.location.href.replace(window.location.hash, '').split(/[\=\?\&]/)
            var index = -1
            for (var i in cmps) {
                if (cmps[i] === param) {
                    index = parseInt(i) + 1
                    break
                }
            }
            if (index >= 0) {
                toReturn = cmps[index]
            }
        } catch (ex) {
            console.log(ex)
        }
        return toReturn
    }

    getURLHash(param) {
        var toReturn = null
        try {
            var hash = window.location.hash.slice(1)
            /* eslint-disable no-useless-escape */
            var cmps = hash.split(/[\=\&]/)
            var index = -1
            for (var i in cmps) {
                if (cmps[i] === param) {
                    index = parseInt(i) + 1
                    break
                }
            }
            if (index >= 0) {
                toReturn = cmps[index]
            }
        } catch (ex) {
            console.log(ex)
        }
        return toReturn
    }

    setURLHash(param, value) {
        try {
            var hash = window.location.hash.slice(1)
            var pairs = hash.split('&')
            var found = false
            var composedPairs = []
            for (var i in pairs) {
                var pair = pairs[i]
                if (!pair) {
                    continue
                }
                var cmps = pair.split('=')
                if (cmps[0] === param) {
                    cmps[1] = encodeURIComponent(value)
                    found = true
                }
                composedPairs.push(cmps.join('='))
                if (found) {
                    break
                }
            }
            if (!found) {
                composedPairs.push(param + '=' + encodeURIComponent(value))
            }
            var composedHash = '#' + composedPairs.join('&')
            window.location.hash = composedHash
        } catch (ex) {
            console.log(ex)
        }
    }
}

export default new NavUtils()
