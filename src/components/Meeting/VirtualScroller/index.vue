<template>
    <div class="virtual-scroller">
        <div class="virtual-scroller-inside-div" style="width: 500px;">&nbsp;</div>
    </div>
</template>

<script lang="ts">
import { Getter, State } from 'vuex-class'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Test extends Vue {
    vscroller: any
    vscrollerInsider: any
    layoutMainView: any
    panelObserver: any
    addedWindowResizeHandler: boolean = false
    ignoreVscrollerScrollOneTime: boolean = false
    ignoreLayoutMainViewScrollOneTime: boolean = false

    mounted() {
        this.initVitualScroller()
    }

    destroyed() {
        if (this.addedWindowResizeHandler) {
            window.removeEventListener('resize', this.onWindowResize)
            this.addedWindowResizeHandler = false
        }
    }

    initVitualScroller() {
        const doms: any = document.getElementsByClassName('virtual-scroller')
        if (doms.length === 0) {
            return
        }
        this.vscroller = doms[0]
        if (this.vscroller.getAttribute('data-handled') === 'true') {
            return
        }
        const d: any = document
        this.vscrollerInsider = d.getElementsByClassName('virtual-scroller-inside-div')[0]
        this.layoutMainView = d.getElementsByClassName('layout-mainview')[0]

        this.vscroller.addEventListener('scroll', this.onVscrollerScroll)
        this.layoutMainView.addEventListener('scroll', this.onLayoutMainViewScroll)
        // eslint-disable-next-line
        this.panelObserver = new MutationObserver(mutations => {
            setTimeout(() => {
                this.updateVscrollerSize()
            }, 10)
        })
        this.panelObserver.observe(this.layoutMainView, {
            childList: true
        })

        this.vscroller.setAttribute('data-handled', 'true')

        if (!this.addedWindowResizeHandler) {
            window.addEventListener('resize', this.onWindowResize)
            this.addedWindowResizeHandler = true
        }
    }
    onVscrollerScroll(evt) {
        if (this.ignoreVscrollerScrollOneTime) {
            this.ignoreVscrollerScrollOneTime = false
            return
        }
        const wView = this.layoutMainView.offsetWidth
        this.ignoreLayoutMainViewScrollOneTime = true
        this.layoutMainView.scrollLeft = Math.floor(this.vscroller.scrollLeft * (wView / 500))
    }
    onLayoutMainViewScroll(evt) {
        if (this.ignoreLayoutMainViewScrollOneTime) {
            this.ignoreLayoutMainViewScrollOneTime = false
            return
        }
        const wView = this.layoutMainView.offsetWidth
        this.ignoreVscrollerScrollOneTime = true
        this.vscroller.scrollLeft = Math.floor(this.layoutMainView.scrollLeft * (500 / wView))
    }
    updateVscrollerSize() {
        const wView = this.layoutMainView.offsetWidth
        const wAll = this.layoutMainView.scrollWidth
        const w = Math.floor(500 / wView * wAll)
        this.vscrollerInsider.style.width = w + 'px'
    }
    onWindowResize() {
        setTimeout(() => {
            this.updateVscrollerSize()
        }, 10)
    }
}
</script>

<style lang="scss">
@import './VirtualScroller'
</style>


