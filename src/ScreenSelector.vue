<template>
    <div id="screenSelector">
        <div class="selectDialog">
            <div class="selectDialog-header">
                <h3>请选择屏幕或窗口</h3>
            </div>
    
            <div class="selectDialog-body">
                <select id="picture" class="image-picker show-html">
                </select>
            </div>
    
            <div id="btn-div" class="selectDialog-footer">
                <button id="save-btn" class="button save-button">
                    确定
                </button>
                <button id="inner-close-btn" class="button close-button">
                    取消
                </button>
            </div>
        </div>
    </div>
</template>

<script>
/* eslint-disable no-undef */
import { ipcRenderer, desktopCapturer } from 'electron'

export default {
    name: 'app',
    data() {
        return {
            refreshScreeSourcesInterval: undefined,
            selectedSource: undefined
        }
    },
    created() {
        const vm = this
        ipcRenderer.on('refresh-screen-sources', vm.onRefreshScreenResources)
    },
    destroyed() {
        ipcRenderer.removeListener('refresh-screen-sources', vm.onRefreshScreenResources)
    },
    mounted() {
        const vm = this

        if (vm.refreshScreeSourcesInterval) {
            clearInterval(vm.refreshScreeSourcesInterval)
        }

        vm.refreshScreeSourcesInterval = setInterval(() => {
            vm.refreshScreenSources()
        }, 5000)

        this.$nextTick(() => {
            // 初始化
            vm.refreshScreenSources()

            const saveEl = document.querySelector('#save-btn')
            saveEl.addEventListener('click', (e) => {
                const id = ($('select').val()).replace(/window|screen/g, (match) => { return match + ':' })
                ipcRenderer.send('confirm-select-screen', id)
                ipcRenderer.send('close-select-screen-window')
                clearInterval(vm.refreshScreeSourcesInterval)
                vm.selectedSource = undefined
            })

            const innerCloseEl = document.querySelector('#inner-close-btn')
            innerCloseEl.addEventListener('click', (e) => {
                ipcRenderer.send('close-select-screen-window')
                clearInterval(vm.refreshScreeSourcesInterval)
                vm.selectedSource = undefined
            })
        })
    },
    methods: {
        onRefreshScreenResources(event, arg) {
            vm.refreshScreenSources()
            if (vm.refreshScreeSourcesInterval) {
                clearInterval(vm.refreshScreeSourcesInterval)
            }

            vm.refreshScreeSourcesInterval = setInterval(() => {
                vm.refreshScreenSources()
            }, 5000)
        },

        refreshScreenSources() {
            const vm = this
            $('select').hide()
            $('select').empty()
            desktopCapturer.getSources({ types: ['window', 'screen'] }, (err, data) => {
                if (!err) {

                    console.log(data)
                    for (let i = 0; i < data.length; i++) {
                        const source = data[i]
                        vm.addSource(source)
                    }
                    vm.refresh()
                } else {
                    console.log(err)
                }
            })
        },

        refresh() {
            const vm = this
            $('select').show()
            $('select').imagepicker({
                hide_select: true,
                show_label: true,
                changed: (oldVal, newVal) => {
                    vm.selectedSource = newVal
                }
            })

            if (vm.selectedSource) {
                $('select').val(vm.selectedSource)
                $('select').data('picker').sync_picker_with_select()
            }
        },
        addSource(source) {
            const vm = this
            $('select').append($('<option>', {
                value: source.id.replace(':', ''),
                text: source.name
            }))
            $('select option[value="' + source.id.replace(':', '') + '"]').attr('data-img-src', source.thumbnail.toDataURL())
        }
    }
}
</script>

<style>
html.selectScreenPage {
    height: 600px;
}

html.selectScreenPage body {
    height: 100%;
}

.selectDialog {
    padding: 0 20px 20px;
    height: 100%;
    display: flex;
    display: -webkit-flex;
    display: -moz-box;
    display: -webkit-flexbox;
    display: -ms-flexbox;
    /*column*/
    -webkit-box-orient: vertical;
    -ms-flex-direction: column;
    -webkit-flex-direction: column;
    flex-direction: column;
    -webkit-flex-wrap: nowrap;
    -moz-flex-wrap: nowrap;
    -ms-flex-wrap: nowrap;
    -o-flex-wrap: nowrap;
    flex-wrap: nowrap;
}

.selectDialog .selectDialog-header {
    text-align: center;
    position: relative;
    padding: 20px 0;
}

.selectDialog .selectDialog-header h3 {
    margin: 0;
}

.selectDialog .selectDialog-header .close {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    -webkit-transform: translateY(-50%);
    -moz-transform: translateY(-50%);
    right: 0;
    border: none;
    background: none;
    outline: none;
}

.selectDialog .selectDialog-body {
    -webkit-box-flex: 1;
    /* OLD - iOS 6-, Safari 3.1-6 */
    -moz-box-flex: 1;
    /* OLD - Firefox 19- */
    -webkit-flex: 1;
    /* Chrome */
    -ms-flex: 1;
    flex: 1;
    overflow: auto;
}

.selectDialog .selectDialog-body ul.thumbnails.image_picker_selector {
    /*flex 布局 考虑到兼容浏览器,原始的用的是float*/
    display: flex;
    display: -webkit-flex;
    display: -moz-box;
    display: -webkit-flexbox;
    display: -ms-flexbox;
    -webkit-box-orient: horizontal;
    -webkit-flex-direction: row;
    -moz-flex-direction: row;
    -ms-flex-direction: row;
    -o-flex-direction: row;
    flex-direction: row;
    -webkit-flex-wrap: wrap;
    -moz-flex-wrap: wrap;
    -ms-flex-wrap: wrap;
    -o-flex-wrap: wrap;
    flex-wrap: wrap;

    /*侧轴方向*/
    /* 09版 */
    -webkit-box-align: stretch;
    /* 12版 */
    -webkit-align-items: stretch;
    -moz-align-items: stretch;
    -ms-align-items: stretch;
    -o-align-items: stretch;
    align-items: stretch;

    /* 主轴方向 */
    -webkit-box-pack: start;
    /* 12版 */
    -webkit-justify-content: flex-start;
    -moz-justify-content: flex-start;
    -ms-justify-content: flex-start;
    -o-justify-content: flex-start;
    justify-content: flex-start;

    /*定高*/
    height: 100%;
}

.selectDialog .selectDialog-body ul.thumbnails.image_picker_selector li {

    /*num*/
    -webkit-box-flex: 1;
    /* OLD - iOS 6-, Safari 3.1-6 */
    -moz-box-flex: 1;
    /* OLD - Firefox 19- */
    -webkit-flex: 1;
    /* Chrome */
    -ms-flex: 1;
    flex: 1;
    max-width: 30%;
    min-width: 30%;
    margin-right: 5%;
}

.selectDialog .selectDialog-body ul.thumbnails.image_picker_selector li:nth-child(3n) {
    margin-right: 0;
}

.selectDialog .selectDialog-body ul.thumbnails.image_picker_selector li .thumbnail.selected {
    background: #5099F3;
}

.selectDialog .selectDialog-body ul.thumbnails.image_picker_selector li .thumbnail {
    height: 100%;
    text-align: center;
    display: flex;
    display: -webkit-flex;
    display: -moz-box;
    display: -webkit-flexbox;
    display: -ms-flexbox;
    /*column*/
    -webkit-box-orient: vertical;
    -ms-flex-direction: column;
    -webkit-flex-direction: column;
    flex-direction: column;
    -webkit-flex-wrap: nowrap;
    -moz-flex-wrap: nowrap;
    -ms-flex-wrap: nowrap;
    -o-flex-wrap: nowrap;
    flex-wrap: nowrap;
    /* 主轴方向 */
    -webkit-box-pack: justify;
    /* 12版 */
    -webkit-justify-content: space-between;
    -moz-justify-content: space-between;
    -ms-justify-content: space-between;
    -o-justify-content: space-between;
    justify-content: space-between;
    /*侧轴方向*/
    -webkit-box-align: center;
    -webkit-align-items: center;
    -moz-align-items: center;
    -ms-align-items: center;
    -o-align-items: center;
    align-items: center;
}

.selectDialog .selectDialog-body ul.thumbnails.image_picker_selector li .thumbnail img {
    max-width: 100%;
}

.selectDialog .selectDialog-body ul.thumbnails.image_picker_selector li .thumbnail p {
    text-overflow: ellipsis;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
}

.selectDialog-footer {
    position: fixed;
    bottom: 10px;
    text-align: center;
    margin-top: 20px;
    width: 100%;
}

.selectDialog-footer .button {
    padding: 10px 20px;
    border: none;
    border-radius: 3px;
    color: #fff;
    outline: none;
}

.selectDialog-footer .button:first-child {
    margin-right: 20px;
}

.selectDialog-footer .save-button {
    background: #5099F3;
}

.selectDialog-footer .save-button:hover,
.selectDialog-footer .save-button:active,
.selectDialog-footer .save-button:focus {
    opacity: 0.8;
}

.selectDialog-footer .close-button {}

.selectDialog-footer .close-button:hover,
.selectDialog-footer .save-button:active,
.selectDialog-footer .save-button:focus {
    opacity: 0.8;
}
</style>
