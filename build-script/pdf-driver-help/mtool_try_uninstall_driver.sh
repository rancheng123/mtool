#!/bin/bash

if [ -d /Applications/mTool.app ]
then
	exit 0
fi

#删除驱动
lpadmin -x 梦想加打印机

pkill PrinterClient

#删除相应的文件夹和文件
sudo rm /Library/Printers/RWTS/PDFwriter/*
sudo rm /usr/libexec/cups/backend/pdfwriter
sudo rm /Library/Printers/PPDs/Contents/Resources/RWTS\ PDFwriter.gz
sudo rm -rf /Library/Printers/RWTS
sudo rm -rf /Applications/PrinterClient.app

# ZY:
sudo -u $USER launchctl unload /Library/LaunchDaemons/com.isecprinter.server.plist
sleep 1s
sudo launchctl unload /Library/LaunchDaemons/com.isecprinter.server.plist
sleep 1s
sudo launchctl unload /Library/LaunchAgents/com.isecopen.server.plist
sleep 1s
sudo rm -rf /Library/LaunchDaemons/com.isecprinter.server.plist
sudo rm -rf /Library/LaunchAgents/com.isecopen.server.plist
sudo rm -rf /usr/libexec/cups/backend/setup.ini
sudo rm -rf /private/var/isectoolsdir
sudo rm -rf /private/var/isectools
sudo rm -rf /private/var/Itoos.sh
sudo pkill -9 isectools

# 最后才删除本身
sudo launchctl unload /Library/LaunchDaemons/com.mxj360.mtool.uninst.plist
sleep 1s
sudo rm -rf /Library/LaunchDaemons/com.mxj360.mtool.uninst.plist
