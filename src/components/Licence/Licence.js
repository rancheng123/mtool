export default {
    components: {
    },

    props: {
        closeClicked: {
            type: Function,
            default: undefined
        },

        isCloseBtnOpacity: {
            type: Boolean,
            default: false
        }
    },

    data() {
        let self = this
        return {
            btnCls: {
                'btn-close': true,
                'btn-opacity': self.isCloseBtnOpacity
            }
        }
    },

    computed: {
    },

    watch: {
    },

    created() {
    },

    mounted() {
        var self = this
        self.$nextTick(() => {
        })
    },

    destroyed() {

    },

    methods: {

        btnCloseClicked() {
            let self = this
            if (self.closeClicked) {
                self.closeClicked()
            }
        }
    }
}
