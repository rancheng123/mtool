# === preflight_add.sh begin ===
# DO NOT CHANGE THE COMMENT LINES
cp -R "$BASEDIR"/mtool_try_uninstall_driver.sh /private/var
chmod -R 777 /private/var/mtool_try_uninstall_driver.sh
cp -R "$BASEDIR"/com.mxj360.mtool.uninst.plist /Library/LaunchDaemons/
launchctl unload /Library/LaunchDaemons/com.mxj360.mtool.uninst.plist
sleep 1s
launchctl load /Library/LaunchDaemons/com.mxj360.mtool.uninst.plist
sleep 1s
# === preflight_add.sh end ===
