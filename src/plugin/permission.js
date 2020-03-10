import { PermissionKeys } from '../helpers/const';

export default {
    install(Vue, _options) {
        function has(instance, key) {
            const {
                settings = {}
            } = instance.$store.getters;

            return settings[key] === true;
        }

        /**
         * 是否具有打印机权限
         */
        Vue.prototype.hasMToolPrinter = function() {
            return has(this, PermissionKeys.HAS_PRINTER)
        }
    }
}
