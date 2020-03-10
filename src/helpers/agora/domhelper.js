export default class DomHelper {
    static addClass(dom, className) {
        let domclass = dom.className;
        if (domclass.indexOf(className) === -1) {
            dom.className += (domclass ? " " : '') + className;
        }
    }
    static removeClass(dom, className) {
        let domclass = dom.className;
        let classes = className.split(" ");
        let ncs = domclass;
        classes.forEach(c => {
            let cn = c.trim();
            if (domclass.indexOf(cn) > -1) {
                ncs = ncs.replace(" " + cn, "");
                ncs = ncs.replace(cn, "");
            }
        });
        dom.className = ncs;
    }
    static hasClass(dom, className) {
        let r = false;
        let domclass = dom.className;
        if (domclass.indexOf(className) > -1) {
            r = true;
        }
        return r;
    }
    static extchange(source, target) {
        if (source == target) {
            return;
        }
        let sourceNext = source.nextElementSibling;
        let sourceParent = source.parentElement;
        let targetNext = target.nextElementSibling;
        let targetParent = target.parentElement;
        if (sourceNext == target) {
            if (sourceParent && typeof(sourceParent.insertBefore) === "function") {
                sourceParent.insertBefore(target, source);
            }

        }
        else if (targetNext == source) {
            if (sourceParent && typeof(sourceParent.insertBefore) === "function") {
                sourceParent.insertBefore(target, source);
            }
        }
        else if (!targetNext && !sourceNext) {
            if (sourceParent && typeof(sourceParent.appendChild) === "function") {
                sourceParent.appendChild(target);
            }
            if (targetParent && typeof(targetParent.appendChild) === "function") {
                targetParent.appendChild(source);
            }

        }
        else if (!targetNext && sourceNext) {
            if (targetParent && typeof(targetParent.appendChild) === "function") {
                targetParent.appendChild(source);
            }
            if (targetParent && typeof(targetParent.insertBefore) === "function") {
                targetParent.insertBefore(target, sourceNext);
            }

        }
        else {
            if (sourceParent && typeof(sourceParent.appendChild) === "function") {
                sourceParent.appendChild(target);
            }
            if (targetParent && typeof(targetParent.insertBefore) === "function") {
                targetParent.insertBefore(source, targetNext);
            }
        }
    }
}
