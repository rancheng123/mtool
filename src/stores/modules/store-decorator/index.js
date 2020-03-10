/**
 * @file index.ts
 * @author denglingbo
 *
 * stores-decorator
 */
'use strict';
import AutoLoading from './AutoLoading';
import { createMapping, getMethods } from './util';
const KEYS = {
    state: 'state',
    actions: '__actions__',
    mutations: '__mutations__',
    getters: '__getters__',
    loadingMutation: 'onLoadingStateChange',
};
export { AutoLoading, KEYS };
/**
 * 用于多处需要使用的计算缓存使用
 */
export function Getter(target, name, descriptor) {
    createMapping(target, KEYS.getters, name);
    return descriptor;
}
/**
 * 同步更新 name 被作为 Action Key 与 @Action 进行关联
 *
 * @param stateName state.$key = ...
 */
export function Mutation(stateName) {
    return (target, name, descriptor) => {
        const method = descriptor.value;
        let ret;
        createMapping(target, KEYS.mutations, name);
        descriptor.value = (state, ...args) => {
            ret = method.apply(target, [state, ...args]);
            state[stateName] = ret;
            return ret;
        };
        return descriptor;
    };
}
/**
 * loadings[name] 状态更新
 *
 * @param context
 * @param auto 是否自动更新相应的 loading 状态
 * @param name Action function name
 * @param value
 */
function loadingDispatch(context, auto, name, value) {
    if (auto) {
        context.commit(KEYS.loadingMutation, { name, value });
    }
}
const defaultActionOptions = {
    autoLoading: true,
};
/**
 * 异步更新
 *
 * @param mutationsFnName @Action($mutationsFnName) | @Action([$mutationsFnName, $mutationsFnName1])
 */
export function Action(mutationsFnName, options = defaultActionOptions) {
    return (target, name, descriptor) => {
        const method = descriptor.value;
        const opt = Object.assign({}, defaultActionOptions, options);
        let ret;
        createMapping(target, KEYS.actions, name);
        if (options.autoLoading) {
            const stateDescriptor = Object.getOwnPropertyDescriptor(target, KEYS.state);
            const state = stateDescriptor.value();
            stateDescriptor.value = () => {
                const { loadings = {} } = state;
                loadings[name] = false;
                return { ...state, loadings };
            };
            Object.defineProperty(target, KEYS.state, stateDescriptor);
        }
        descriptor.value = (context, ...args) => {
            ret = method.apply(target, [context, ...args]);
            if (mutationsFnName && Object.prototype.toString.call(ret) === '[object Promise]') {
                let data;
                // if <auto loading> state.loadings.$funcName
                loadingDispatch(context, opt.autoLoading, name, true);
                ret.then((res) => {
                    [].concat(mutationsFnName).forEach((k) => {
                        data = res.data ? res.data : res;
                        context.commit(k, data);
                    });
                    loadingDispatch(context, opt.autoLoading, name, false);
                }).catch((ex) => {
                    loadingDispatch(context, opt.autoLoading, name, false);
                    // console.error('[StoreDecorator Action]: ', ex);
                });
            }
            return ret;
        };
        return descriptor;
    };
}
function StoreDecoratorFactory(Store, options = {}) {
    return () => ({
        namespaced: true,
        state: getMethods(Store, KEYS.state),
        mutations: getMethods(Store, KEYS.mutations),
        actions: getMethods(Store, KEYS.actions),
        getters: getMethods(Store, KEYS.getters),
    });
}
/**
 *
 * @param options
 *  1. @StoreDecorator
 *    Class xxx
 *    options: {undefined}
 *  2. @StoreDecorator(...)
 *    Class xxx
 *    options: {function}
 */
export default function StoreDecorator(options) {
    if (typeof options === 'function') {
        return StoreDecoratorFactory(options);
    }
    return (Store) => {
        return StoreDecoratorFactory(Store, options);
    };
}
//# sourceMappingURL=index.js.map