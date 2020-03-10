# MyDreamPlus Desktop Application

User Info
```
{ 
  activated: true,
  archived: false,
  avatar: 'data:image/png;base64,iVBORw0KGgoAAAA.......',
  birthday: null,
  disabled: false,
  doorAccessCardId: '123456789',
  email: 'xxxxxx@mydreamplus.com',
  emergencyContactName: 'xxxxxx',
  emergencyContactPhoneNumber: null,
  firstName: 'xxx',
  fullName: 'xxxxxxx',
  fullNameForChinese: 'xxxxxx',
  fullNameForEnglish: 'xxxxxx',
  id: 1234,
  identityCardNumber: null,
  isBindWechat: null,
  isOwner: false,
  langKey: 'zh-cn',
  lastName: 'xx',
  login: 'zoukaiping',
  organizationId: 1,
  organizationName: '梦想加',
  phoneNumber: '12345678912',
  remark: null,
  roles: [ 'ROLE_SUPER_ADMIN' ] 
}
```

rest api
```
获取二维码              /api/qrcode/auth/login?cacheBuster=[Timestamp]
获取打印配额            /api/printing/quota
获取authToken          /rest/auth/sso-jwt-tokens
获取session信息         /rest/auth/session
获取用户信息            /api/account?cacheBuster=[Timestamp]
创建打印任务            /api/printing/local-file
获取打印机列表          /api/printer/list-user-around
```

problems
* 打印功能 只要存成 2007-2009 格式的就会有问题  ？？？？

# 视频会议相关

* sdk封装源码在 [web-meeting/src/lib](http://gitlab.mxj360.com/smardevice/web-meeting/tree/master/src/lib) 项目下
* 更新视频会议代码需修改web-meeting后，在web-meeting工程使用npm build-lib命进行更新
* 会议的流程参看[web-meeting项目的说明文档](http://gitlab.mxj360.com/smardevice/web-meeting)
* windows系统声音的控制使用[NirCmdd工具](http://www.nirsoft.net/utils/nircmd.html) 使用方法参看官网文档

## 视频会议设计缺陷

 <p>mqtt消息无序问题，由于消息是由各端自由发出消息来源不唯一，但端与端之间的传输速度无法保证一致，对于状态变化的消息在网络差的情况下很容易出于现状态消息反序到达的情况。<b>解决方案：各端的需要处理的消息由统一方中转发出，保证消息来源唯一，也就可以保证接收方所收到消息的有序</b>
 <p>电脑与电视控制操作状态显示缺陷，目前从电脑控制电视的操作，都是通过SmartOffice API调用实现，成功与否是通过API返回确认，但这个操作反馈并不是设备返回，所以有可能出现API返回成功，但是设备没有处理成功的情况，所以在电脑端（Mtool）上显示电视的状态可能会和真实状态不一致的情况

 ## 屏幕分享功能实现
 <p>浏览器端也可以实现，但需要chrome上安装对应插件，但是并不是所有用户都会翻墙，所以还是不要提供，使用时需要AgroaRTC.createStream时增加extensionId参数将chrome扩展的ID传入
 <p>electron中实现方法是模拟chrome.runtime.setMessage方法，回传sourceId给声网SDK，然SDK会根据本身的逻辑创建视频流
 
[mtool说明文档](http://gitlab.mxj360.com/mdp-smart-device/mxj-desktop-app/wikis/home)

## 升级信息修改
修改项目目录下面buildrc.js
<p>"version": 软件版本：4.5.7</p>
<p>"describe": 描述：["1. 解决关闭摄像头无法分享屏幕的问题；", "2. 优化成员列表中电话接入者的名称展示；"],</p>
<p>"forceUpdate": 是否强制升级：false</p>

[mtool说明文档](http://gitlab.mxj360.com/mdp-smart-device/mxj-desktop-app/wikis/home)

### 清空electron构建缓存的方法
rm -rf ~/.electron
rm -rf ~/.electron-gyp
rm -rf ~/Library/Caches/electron