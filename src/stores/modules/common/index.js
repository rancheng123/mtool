/**
 * @file common/index.ts
 * @author shijh
 *
 * 公共状态管理
 */
const state = {
    isLogin: false,
    isFullscreenMode: false,
    isShowHeader: true,
    isVip: false,
    isShowInviteMenu: false
};
const getters = {};
const mutations = {
    login(state) {
        state.isLogin = true;
    },
    logout(state) {
        state.isLogin = false;
    },
    toFullscreenMode(state) {
        state.isFullscreenMode = true;
    },
    toNormalMode(state) {
        state.isFullscreenMode = false;
    }
};
const actions = {};
export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
};
//# sourceMappingURL=index.js.map