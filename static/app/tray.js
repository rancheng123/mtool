'use strict'
const path = require('path')
const electron = require('electron')
const mainWindow = require('./main-window')
const Menu = electron.Menu
const Tray = electron.Tray

const app = electron.app
let tray = null

let rightClickContextMenuTpl = [
    {
        label: '退出',
        click: function(event) {
            app.quit()
        }
    }
]

let contextMenu = Menu.buildFromTemplate(rightClickContextMenuTpl)

function getTray() {

    if (!tray) {
        const trayImg = electron.nativeImage.createFromPath(path.join(__dirname, '../static/img/app-icon.png'))
        tray = new Tray(trayImg.resize({
            width: 16,
            height: 16
        }))

        tray.setHighlightMode('selection')

        tray.on('click', function(e, bounds) {
            const mainWin = mainWindow.getMainWin()

            if (!mainWin.isVisible() || !mainWin.isFocused()) {
                if (process.platform === 'darwin') {
                    // mainWin.setPosition(bounds.x - Math.floor(mainWin.getBounds().width / 2), 0)
                }
                mainWin.show()
                mainWin.focus()
            } else {
                mainWin.hide()
            }
        })

        tray.on('right-click', function(e, bounds) {
            tray.popUpContextMenu(contextMenu)
        })
        tray.setToolTip('mTool Powered By MyDreamPlus')
        if (process.platform === 'win32') {
            tray.displayBalloon({
                icon: trayImg,
                title: 'mTool',
                content: '点击这里可以隐藏、显示mTool的窗口哦'
            })
        }
    }

    return tray
}


exports.getTray = getTray
