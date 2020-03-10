# ./dev-release/mac/mTool.app/Contents/MacOS/mTool

#  sh ./zoom-sdk-electron-master/build_nodeaddon_mac.sh dev false













#进入进程目录
cd `dirname $0`
#进程环境参数  local本地  dev开发
env=$1  &&
isBuildNative=$2  &&
cd ..  &&
mtoolPath=$(pwd)  &&
zoomSdkPath="${mtoolPath}/zoom-sdk-electron-master"  &&
electronPath="${mtoolPath}/node_modules/_electron@5.0.13@electron/dist/Electron.app" &&
appPath="${mtoolPath}/${env}-release/mac/mTool.app"  &&
echo ${mtoolPath}  &&
echo ${zoomSdkPath}















# 基本不变动的-------------------------
echo "依赖模块下载    开始"  &&
cd ${mtoolPath}  &&
rm -rf "${mtoolPath}/node_modules"  &&
cnpm install  &&
echo "依赖模块下载    成功"









# 基本不变动的-------------------------
if [ ${isBuildNative} ];then

    echo ${isBuildNative} &&

    echo "编译原生模块   开始" &&
    version=$("${mtoolPath}/node_modules/.bin/electron" --version) &&
    cd ${zoomSdkPath} &&
    rm -rf ./build &&
                                #要编译成的node版本  #--dist-url=https://atom.io/download/electron
    node-gyp rebuild --target=${version#*v}         --dist-url=https://npm.taobao.org/mirrors/atom-shell &&
    echo "编译原生模块   成功" &&



    echo "复制原生模块   开始"           &&
    cd ${zoomSdkPath}                  &&
    cp -Rf "${zoomSdkPath}/build/Release/zoomsdk.node"                     "${zoomSdkPath}/sdk/mac" &&
    cp -Rf "${zoomSdkPath}/build/Release/zoomsdk.node.dSYM"                "${zoomSdkPath}/sdk/mac" &&
    cp -Rf "${zoomSdkPath}/build/Release/zoomsdk_render.node"              "${zoomSdkPath}/sdk/mac" &&
    cp -Rf "${zoomSdkPath}/build/Release/zoomsdk_render.node.dSYM"         "${zoomSdkPath}/sdk/mac" &&
    echo "复制原生模块   成功"

fi











echo '编译vue  开始'
cd ${mtoolPath}    &&
npm run build
echo '编译vue  成功'





#测试  start
    mtoolPath="/Users/deo/WebstormProjects/workPlace/workDeliver/mxj-desktop-app-dir/mxj-desktop-appMdify" &&
    zoomSdkPath="/Users/deo/WebstormProjects/workPlace/workDeliver/mxj-desktop-app-dir/mxj-desktop-appMdify/zoom-sdk-electron-master"  &&
    isBuildNative=true &&
    env='dev' &&

    electronPath="${mtoolPath}/node_modules/_electron@5.0.13@electron/dist/Electron.app" &&
    appPath="${mtoolPath}/${env}-release/mac/mTool.app"

#测试  end

if [ ${env} == "dev" ];then

    echo '发版开始'                                                                                      &&
    cd ${mtoolPath}                                                                                     &&

    rm -rf dev-release     &&
    ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/ &&
    npm run buildVersion dev     stableApi     &&




    ./node_modules/.bin/electron-builder --config electron-builder-dev.json     --mac  --publish always &&
    echo '发版结束'

fi








    echo "复制sdk 到 app   开始"                                                      &&
    yes|cp -R  -H "${zoomSdkPath}/sdk/mac/Plugins"    "${appPath}/Contents/"             &&
    yes|cp -R  -H "${zoomSdkPath}/sdk/mac/Resources"  "${appPath}/Contents/"             &&
    yes|cp -R  -H "${zoomSdkPath}/sdk/mac/ZoomSDK/"   "${appPath}/Contents/Frameworks"   &&
    echo "复制sdk 到 app   成功"







if [ ${env} == "local" ];then

    echo "复制sdk lib 到指定目录   开始" &&
    rm -rf "${mtoolPath}/sdk" && yes|cp -R  -H "${zoomSdkPath}/sdk"    "${mtoolPath}/" &&
    rm -rf "${mtoolPath}/lib" && yes|cp -R  -H "${zoomSdkPath}/lib"    "${mtoolPath}/" &&
    echo "复制sdk lib 到指定目录   成功"
else

    echo "复制sdk lib 到指定目录   开始"  &&
                                 yes|cp -R  -H "${zoomSdkPath}/sdk"    "${appPath}/Contents/Resources/app/" &&
                                 yes|cp -R  -H "${zoomSdkPath}/lib"    "${appPath}/Contents/Resources/app/" &&
    echo "复制sdk lib 到指定目录   成功"
fi







# 基本不变动的-------------------------
echo "复制sdk 到electron   开始"                                                      &&
yes|cp -R  -H "${zoomSdkPath}/sdk/mac/Plugins"    "${electronPath}/Contents/"             &&
yes|cp -R  -H "${zoomSdkPath}/sdk/mac/Resources"  "${electronPath}/Contents/"             &&
yes|cp -R  -H "${zoomSdkPath}/sdk/mac/ZoomSDK/"   "${electronPath}/Contents/Frameworks"   &&
echo "复制sdk 到electron   成功"




echo '完成'
exit

