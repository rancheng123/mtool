/**
 * @file store/index.ts
 * @author shijh
 *
 * store入口文件
 */
import Vue from 'vue'
import Vuex from 'vuex'
import common from './modules/common'
import Meeting from './modules/meeting'
import Stream from './modules/stream'

Vue.use(Vuex)

const state = {
    isLogin: false,
    isFullscreenMode: false,
    isShowHeader: true,
    isVip: false,
    isShowInviteMenu: false,
    settings: {}
}

const getters = {
    isLogin(state) {
        return state.isLogin
    },
    isFullscreenMode(state) {
        return state.isFullscreenMode
    },
    isShowHeader(state) {
        return state.isShowHeader
    },
    isVip(state) {
        return state.isVip
    },
    isShowInviteMenu(state) {
        return state.isShowInviteMenu
    },
    settings(state) {
        return state.settings;
    }
}

const mutations = {
    login(state) {
        state.isLogin = true
    },
    logout(state) {
        state.isLogin = false
    },
    toFullscreenMode(state) {
        state.isFullscreenMode = true
    },
    toNormalMode(state) {
        state.isFullscreenMode = false
    },
    setSettings(state, payload) {
        state.settings = {
            ...state.settings,
            ...payload
        };
    }
}

const actions = {
    test() {
        console.log('test-----------')
    },
    initSettings(context, payload) {
        context.commit('setSettings', payload);
    }
}

export default new Vuex.Store({
    state,
    getters,
    mutations,
    actions,
    modules: {
        common,
        meeting: Meeting,
        stream: Stream
    }
})
