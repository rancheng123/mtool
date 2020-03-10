const ipc = require('electron').ipcRenderer

export default {
    components: { },

    props: {
        title: String
    },

    data() {
        return {
        }
    },

    computed: {
    },

    watch: {
        '$route': 'routeChange'
    },

    created() {
    },

    mounted() {
        var self = this

        console.log(`nav-menu :only-show-config ${self.onlyShowConfig}`)

        self.$nextTick(() => {
            self.routeChange()
        })
    },

    destroyed() {

    },

    methods: {
        homeSelected(event) {
            this.$router.replace({path: '/app/home'})
        },
        projectorSelected(event) {
            this.$router.replace({path: '/app/projector'})
        },

        printerSelected(event) {
            this.$router.replace({path: '/app/printer'})
        },

        aboutSelected(event) {
            this.$router.replace({path: '/app/about'})
        },

        configSelected(event) {
            this.$router.replace({path: '/app/config'})
        },

        resetMenuItems() {
            let linkNodes = document.querySelectorAll('a.link')
            for (let i = 0; i < linkNodes.length; i++) {
                linkNodes[i].setAttribute('class', 'link')
            }
        },

        routeChange() {
            let self = this
            let route = self.$route
            console.log(route)
            switch (route.path) {
            case '/app/home':
                self.resetMenuItems()
                document.querySelector('#homeLink').setAttribute('class', 'link actived')
                break
            case '/app/projector':
                self.resetMenuItems()
                document.querySelector('#projectorLink').setAttribute('class', 'link actived')
                break
            case '/app/printer':
            case '/app/print-success':
                self.resetMenuItems()
                console.log('set printer actived')
                document.querySelector('#printerLink').setAttribute('class', 'link actived')
                break
            case '/app/config':
                self.resetMenuItems()
                document.querySelector('#configLink').setAttribute('class', 'link actived')
                break
            case '/app/about':
                self.resetMenuItems()
                document.querySelector('#aboutLink').setAttribute('class', 'link actived')
                break
            }
        }
    }
}
