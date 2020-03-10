// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const sso = remote.require('./app/sso')
const logger = remote.require('./app/logger')
const printer = remote.require('./app/printer-polyfill')
const utils = remote.require('./app/utils')
const config = remote.require('./app/configuration')
const appUpdater = remote.require('./app/app-updater')

import SmartOfficeAPI from './service/SmartOfficeAPI'

import Vue from 'vue'
import VueRouter from 'vue-router'

import Main from './Main.vue'
import MainRoutes from './MainRoutes'
import store from './stores'
import { PermissionKeys } from './helpers/const'
import './plugin'

Vue.use(VueRouter)

window.onerror = (messageOrEvent, source, lineno, colno, error) => {
    logger.info(`${source}, ${lineno},${colno}: ${messageOrEvent},${error.stack}`)
}

let router = new VueRouter(MainRoutes)
router.beforeEach((to, from, next) => {
    console.debug(`change router from ${from.path} to ${to.path}`)
    if (((to.path === '/app/home') || (to.path === '/app/printer') || (to.path === '/app/account')) && !store.state.isLogin) {
        router.replace({
            path: '/'
        })
    } else {
        next()
    }

})
router.afterEach((to, from) => {
    logger.debug(`app swith to path: ${to.path}`)
    let canShowUpdatePrompt =
        (to.path === '/app/home') ||
        (to.path === '/app/config') ||
        (to.path === '/app/about') ||
        (to.path === '/')
    logger.info(`set update flag: ${canShowUpdatePrompt}`)
    if (typeof appUpdater.setUpateFlag === 'function') {
        appUpdater.setUpateFlag(canShowUpdatePrompt)
    }
})

function dispatchInitPermissionAction() {
    const settings = [PermissionKeys.HAS_PRINTER].reduce((acc, key) => {
        acc[key] = config.readSettings(key)

        return acc;
    }, {})

    store.dispatch('initSettings', settings)
}

/* eslint-disable no-new */
const vue = new Vue({
    el: '#main',
    router,
    store,
    data() {
        return {}
    },
    created() {
        dispatchInitPermissionAction()
    },
    mounted() {
        this.$router.replace({
            path: '/'
        })
    },
    methods: {
    },
    render: h => h(Main)
})
window.vue = vue
ipc.on('redirect-vue-router', function (event, param) {
    logger.info(`redirect vue router: ${param}`)
    vue.$router.replace({
        path: param
    })
})

ipc.on('login-expired', (event, param) => {
    if (!store.isLogin) return

    logger.info('login expired...')
    store.state.isLogin = false
    utils.cleanUserInfo(config)
    let mainWin = remote.getCurrentWindow()
    mainWin.setResizable(false)
    mainWin.center()
    mainWin.show()

    vue.$router.replace({
        path: '/'
    })
    let elem = document.querySelector('#app-msg')
    elem.innerText = '登录过期，请重新登录'
    elem.setAttribute('style', '')
    elem.setAttribute('class', 'app-error-msg')

    setTimeout(() => {
        elem.setAttribute('style', 'display:none')
    }, 3000)
})

let viptimer = null
ipc.on('login-success', (event, param) => {
    logger.info(`login success, goto: ${param.routerPath}`)
    store.state.isLogin = true
    let mainWin = remote.getCurrentWindow()
    mainWin.setResizable(true)
    mainWin.center()
    sso.refreshAuthToken()

    SmartOfficeAPI.permission().then((res) => {
        logger.info(`SmartOfficeAPI.permission res ${JSON.stringify(res)}`)
        if (res) {
            store.state.isVip = !!res.result
        } else {
            store.state.isVip = false
        }
    })
    clearInterval(viptimer)
    viptimer = setInterval(function () {
        SmartOfficeAPI.permission().then((res) => {
            logger.info(`SmartOfficeAPI.permission res ${JSON.stringify(res)}`)
            if (res) {
                store.state.isVip = !!res.result
            } else {
                store.state.isVip = false
            }
        })
    }, 1000 * 60 * 60)


    if (config.readSettings('hasPrinter')) {
        printer.initialize(param.userInfo.login)
    }
    vue.$router.replace({
        path: param.routerPath
    })
})

ipc.on('error-msg', (event, msg) => {
    remote.getCurrentWindow().show()
    let elem = document.querySelector('#app-msg')
    elem.innerText = msg
    elem.setAttribute('style', '')
    elem.setAttribute('class', 'app-error-msg')

    setTimeout(() => {
        elem.setAttribute('style', 'display:none')
    }, 3000)

    // window.alert(msg)
})

ipc.on('info-msg', (event, msg) => {
    let elem = document.querySelector('#app-msg')
    elem.innerText = msg
    elem.setAttribute('style', '')
    elem.setAttribute('class', 'app-info-msg')

    setTimeout(() => {
        elem.setAttribute('style', 'display:none')
    }, 3000)

    // window.alert(msg)
})

ipc.on('save-config-finished', (event, param) => {
    if (store.isLogin) {
        let routerPath = param || '/app/projector'
        logger.info(`save config finished (${param}), goto ${routerPath}`)
        vue.$router.replace({
            path: routerPath
        })
    } else {
        remote.getCurrentWindow().reload()
    }
})

let progressInterval
let progress = 0
ipc.on('start-update-app', () => {
    let elem = document.querySelector('#update-app-info')
    let bar = document.querySelector('#progressBar')
    let text = document.querySelector('#progressText')
    if (progressInterval) {
        clearInterval(progressInterval)
    }
    bar.setAttribute('style', 'width: 0%;')
    text.innerText = '0%'
    elem.setAttribute('style', '')
    elem.setAttribute('class', 'update-app-info')

    progressInterval = setInterval(() => {

        if (progress >= 0 && progress < 70) {
            progress += 5
        }

        if (progress >= 70 && progress < 99) {
            progress += 1
        }

        bar.setAttribute('style', `width: ${progress}%;`)
        text.innerText = `${progress}%`
    }, 1000)
})

ipc.on('stop-update-app', () => {
    let elem = document.querySelector('#update-app-info')
    elem.setAttribute('style', 'display:none')
})


ipc.on('start-setup-sys-printer', () => {
    let elem = document.querySelector('#setup-sys-printer')
    elem.setAttribute('style', '')
    elem.setAttribute('class', 'update-app-info')

    // let infoElem = document.querySelector('#setup-sys-printer-info')
    // infoElem.setAttribute('style', '')

    let progressElem = document.querySelector('#setup-sys-printer-progress')
    progressElem.setAttribute('style', 'display:none')
})

ipc.on('download-sys-printer-progress', (event, param) => {
    let infoElem = document.querySelector('#setup-sys-printer-info')
    infoElem.setAttribute('style', 'display:none')

    let progressElem = document.querySelector('#setup-sys-printer-progress')
    progressElem.setAttribute('style', '')

    let bar = document.querySelector('#sys-setup-progressBar')
    let text = document.querySelector('#sys-setup-progressText')

    bar.setAttribute('style', `width: ${Number(param.percent * 100).toFixed(0)}%;`)
    text.innerText = `${Number(param.percent * 100).toFixed(0)}%`

    if (param.percent === 1) {
        text.innerText = '安装中......'
    }
})

ipc.on('end-setup-sys-printer', () => {
    setTimeout(() => {
        let elem = document.querySelector('#setup-sys-printer')
        elem.setAttribute('style', 'display:none')
    })
})
