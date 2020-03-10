class DataUtils {
    parseInt2(obj) {
        var n = parseInt(obj)
        if (isNaN(n)) {
            n = 0
        }
        return n
    }

    parseFloat2(obj) {
        var n = parseFloat(obj)
        if (isNaN(n)) {
            n = 0
        }
        return n
    }

    parseMoney(obj, isFen = true) {
        var f = this.parseFloat2(obj)
        if (f === 0) {
            return '0'
        }
        if (isFen) {
            f = f / 100
        }
        var dn = 2
        if (parseInt(f) === f) {
            dn = 0
        }
        return '' + f.toFixed(dn)
    }

    ensureInt(obj) {
        return Number.isInteger(obj) ? obj : 0
    }

    ensureArray(obj) {
        return this.isArray(obj) ? obj : []
    }

    string2date(str) {
        var dt = new Date(str)
        if (!dt || isNaN(dt.getTime())) {
            try {
                var arr = str.split(/[^0-9]/)
                if (arr.length > 5) {
                    dt = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5])
                } else if (arr.length > 2) {
                    dt = new Date(arr[0], arr[1] - 1, arr[2], 0, 0, 0)
                } else {
                    dt = null
                }
            } catch (ex) {
                dt = null
            }
        }
        return dt
    }

    isArray(obj) {
        return Array.isArray(obj)
    }

    isString(obj) {
        return (typeof obj) === 'string' || (obj instanceof String)
    }
}

export default new DataUtils()
