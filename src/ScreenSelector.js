const ipc = require('electron').ipcRenderer

import Vue from 'vue'
import ScreenSelector from './ScreenSelector.vue'

import './assets/css/bootstrap.css'
import './assets/css/image-picker.css'

/* eslint-disable no-new */
const vue = new Vue({
    el: '#main',
    render: h => h(ScreenSelector)
})
