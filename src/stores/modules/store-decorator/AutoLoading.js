import { createMapping } from './util';
import { KEYS } from './index';
export default function AutoLoading(target) {
    const proto = target.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'state');
    // 创建 state.loadings
    proto.state = () => ({
        loadings: {},
        ...descriptor.value(),
    });
    // 创建映射
    createMapping(proto, KEYS.mutations, KEYS.loadingMutation);
    createMapping(proto, KEYS.getters, 'loadings');
    // 创建 mutations
    proto[KEYS.loadingMutation] = (state, payload) => {
        const { loadings } = state;
        const { name, value } = payload;
        if (loadings && loadings[name] !== undefined) {
            loadings[name] = value;
        }
    };
    // 创建 getters
    proto.loadings = (state) => ({ ...state.loadings });
    return target;
}
//# sourceMappingURL=AutoLoading.js.map