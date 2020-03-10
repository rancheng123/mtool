class DomUtils {
    findElementInChildren(elem, criteria) {
        var toReturn = null
        var es = elem.children
        for (var i in es) {
            var e = es[i]
            if (criteria(e)) {
                toReturn = e
                break
            }
        }
        return toReturn
    }
}

export default new DomUtils()
