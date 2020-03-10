const { ZoomSDK_LANGUAGE_ID, ZoomSDKError } = require('./settings.js');
const ZOOMAUTHMOD = require('./zoom_auth.js');
const ZOOMMEETINGMOD = require('./zoom_meeting.js');
const ZOOMSETTINGMOD = require('./zoom_setting.js');
const ZOOMRESOURCE = require('./zoom_customized_resource.js');
const ZOOMPREMEETING = require('./zoom_premeeting.js');
const ZOOMVIDEORAWDATA = require('./zoom_video_rawdata.js');
const ZOOMAUDIORAWDATA = require('./zoom_audio_rawdata.js');
const ZOOMSHARERAWDATA = require('./zoom_share_rawdata.js');
const ZOOMSMS = require('./zoom_sms_helper.js');
const os = require('os');
const platform = os.platform();
const arch = os.arch();

/**
*@module
*/
const ZoomSDK = (() => {
  let instance;
  /**
   * mode: Zoom SDK JS Module Loader  
   * @param {Function} apicallretcb api call ret callback
   * @param {Boolean} threadsafemode
   * @param {String} path zoom.node path on win os, todo: mac os
   * @return {ZoomSDK}
   */
  function init(opts) {
    // Private methods and variables
    let clientOpts = opts || {};
    let _path = clientOpts.path || (platform == 'darwin' ? './../sdk/mac/' : arch == 'x64' ? './../sdk/win64/' : './../sdk/win32/');
    let zoomnodepath = _path + 'zoomsdk.node';
    let addon = require(zoomnodepath)();
    let _isSDKInitialized = false;

    return {
      // Public methods and variables
      /**
       * mode: Zoom SDK Init
       * @param {String} path sdk.dll path on win os, todo: mac os.
       * @param {String} domain
       * @param {String} langid ZoomSDK_LANGUAGE_ID,
       * @param {String} langname
       * @param {String} langinfo
       * @param {String} strSupportUrl
       * @param {Boolean} enable_log
       * @return {ZoomSDKError}
       */
      InitSDK: function (opts) {
        let clientOpts = opts || {};
        let path = clientOpts.path || '';

        //此处修改 华万配置  start
        //let domain = clientOpts.domain || 'https://www.zoom.us'; 
        let domain = clientOpts.domain || 'https://www.zoomus.cn'; 
        //此处修改 华万配置  end


        let langid = clientOpts.langid || ZoomSDK_LANGUAGE_ID.LANGUAGE_English;
        let langname = clientOpts.langname || '';
        let langinfo = clientOpts.langinfo || '';

        //此处修改 华万配置  start
        //let strSupportUrl = clientOpts.strSupportUrl || 'https://zoom.us';
        let strSupportUrl = clientOpts.strSupportUrl || 'https://www.zoomus.cn';
        //此处修改 华万配置  end

        let enable_log = clientOpts.enable_log;
        let ret = addon.InitSDK(path, domain, langid, langname, langinfo, strSupportUrl, enable_log);
        if (ZoomSDKError.SDKERR_SUCCESS == ret){
          _isSDKInitialized = true;
        } else {
          _isSDKInitialized = false;
        }  
        return ret
      },
      /**
      * mode: Get the version of ZOOM SDK
      * @return {String} The version of ZOOM SDK
      */ 
      GetZoomSDKVersion: () => {
        return addon.GetZoomSDKVersion();
      },
      /**
       * mode: Zoom SDK Cleanup
       * @return {ZoomSDKError}
       */
      CleanUPSDK: function () {
        return addon.CleanUPSDK();
      },
      GetAuth: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMAUTHMOD.ZoomAuth.getInstance(clientOpts);
        }
        return null;
      },
      GetMeeting: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMMEETINGMOD.ZoomMeeting.getInstance(clientOpts);
        }
        return null;
      },
      GetSetting: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMSETTINGMOD.ZoomSetting.getInstance(clientOpts);
        }
        return null;
      },
      GetCustomizedResource: (opts) => {
        let clientOpts = opts || {};
        clientOpts.addon = addon;
        return ZOOMRESOURCE.ZoomCustomizedResource.getInstance(clientOpts);
      },
      PreMeeting: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMPREMEETING.ZoomPreMeeting.getInstance(clientOpts);
        }
        return null;
      },
      VideoRawData: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMVIDEORAWDATA.ZoomVideoRawData.getInstance(clientOpts);
        }
        return null;
      },
      AudioRawData: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMAUDIORAWDATA.ZoomAudioRawData.getInstance(clientOpts);
        }
        return null;
      },
      ShareRawData: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMSHARERAWDATA.ZoomShareRawData.getInstance(clientOpts);
        }
        return null;
      },
      SMSHelper: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMSMS.ZoomSMSHelper.getInstance(clientOpts);
        }
        return null;
      },
      /**
      * mode: Start to monitor the UI action, windows os only.
      * uiacitonCB: function, such as function uiacitoncb(ZoomSDKUIHOOKHWNDTYPE, ZoomSDKUIHOOKMSGID, HANDLE)
      */
      StartMonitorUIAction: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          let uiacitonCB = clientOpts.uiacitonCB || null;
          addon.UIHOOK_StartMonitorUIAction(uiacitonCB);
        }
      },
      /**
      * mode: Stop to monitor the UI action, windows os only.
      */
      StopMonitorUIAction: () => {
        if (_isSDKInitialized) {
          addon.UIHOOK_StopMonitorUIAction();
        }
      },
      HasRawDataLicense: () => {
        if (_isSDKInitialized) {
          return addon.GetRawDataLicenseObj().HasRawDataLicense();
        }
      }
    };
  };
  
  return {
    /**
     * Get Zoom SDK Module
     * @return {ZoomSDK}
    */
    getInstance: (opts) => {
      if (!instance) {
        
        instance = init(opts);
      }
      return instance;
    }
  };
})();

module.exports = {
  ZoomSDK: ZoomSDK
}
