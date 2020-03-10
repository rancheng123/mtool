<template>
    <div id="video-call-con" class="video-view" >
        <div class="layout-main" :class="{'layout-fullscreen': isFullscreenMode, 'layout-normal': !isFullscreenMode}" data="1">
            <div class="layout-mainview">
                <panle
                    v-for="(item, index) in members"
                    :key="item.uid"
                    :userInfo="item"
                    v-show="item && item.visble"
                    v-if="!isFullscreenMode"
                    :index="index"
                    width="175px"
                    height="210px"
                />
                <panle
                    :key="storeGetMajor.uid +'-'+ storeGetMajor.streamId"
                    :userInfo="storeGetMajor"
                    class="major"
                    v-if="storeGetMajor && storeGetMajor.visble && isFullscreenMode"
                    width="100%"
                    height="100%"
                />
            </div>
            <virtual-scroller />
            <div class="layout-thumbnail">
                <div class="layout-thumbnail-content" :class="{'show': thumnailVisible, 'hide': !thumnailVisible}">
                    <panle
                        v-for="(item, index) in members"
                        :key="item.uid"
                        :userInfo="item"
                        v-show="item && item.visble"
                        v-if="isFullscreenMode && storeGetMajor.uid !== item.uid"
                        :index="index"
                    />
                </div>
                <div class="layout-thumbnail-ctl">
                    <div class="info">{{storeGetMemberCount}}人参会</div>
                    <div
                        class="switch"
                        :class="{'fold': thumnailVisible, 'unfold': !thumnailVisible}"
                        @click="handleThumbnailVisible"
                        v-if="storeGetMemberCount > 1"
                    >
                        <img src="">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Getter, State } from 'vuex-class'
import { mapState } from 'vuex'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import Panle from './Panle.vue'
import VirtualScroller from '../VirtualScroller/index.vue'

@Component({
    components: {
        Panle,
        VirtualScroller
    }
})
export default class View extends Vue {
    @Getter('isFullscreenMode') isFullscreenMode: boolean
    @Getter('isShowHeader') isShowHeader: boolean
    @Getter('isShowInviteMenu') isShowInviteMenu: boolean
    @Getter('meeting/members') members: any
    @Getter('meeting/major') storeGetMajor: any
    @Getter('meeting/getMemberCount') storeGetMemberCount: any

    thumnailVisible: boolean = true

    handleThumbnailVisible() {
        this.thumnailVisible = !this.thumnailVisible
    }

    mounted() {
    }
}
</script>

<style lang="scss">
</style>


