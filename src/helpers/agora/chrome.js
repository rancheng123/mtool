import * as electron from 'electron';
export class DesktoopCapture {
    constructor() {
        this.runtime = {
            sendMessage: (name, opt, cb) => {
                cb({
                    streamId: this.streamId
                });
            }
        };
    }
    getWindows() {
        return new Promise((resolve, reject) => {
            electron.desktopCapturer.getSources({
                types: ['screen', 'window'],
                thumbnailSize:{width: 215, height: 131}
            }, (error, sources) => {
                if (error) {
                    reject(error);
                }
                if (sources.length > 0) {
                    this.streamId = sources[0].id;
                    sources[0]['name']  = '整个屏幕'
                    for(var i =0;i<sources.length;i++) {
                        sources[i]['img']= sources[i]['thumbnail'].toDataURL()
                    }
                }
                resolve(sources);
            });
        });
    }
    selectStreamSource(streamId) {
        if (streamId) {
            this.streamId = streamId;
        }
    }
    getScreenStream(sourceId, audio) {
        return new Promise((resolve, reject) => {
            let opt = {
                audio: audio ? {
                    mandatory: { chromeMediaSource: 'desktop' }
                } : false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId || this.streamId,
                        minWidth: 1280,
                        maxWidth: 1920,
                        minHeight: 720,
                        maxHeight: 1080
                    }
                }
            };
            navigator.mediaDevices.getUserMedia(opt)
                .then((stream) => {
                resolve(stream);
            }).catch(error => {
                reject(error);
            });
        });
    }
}
export function setChrome(chrome) {
    window.chrome = window.chrome || chrome;
}
const capture = new DesktoopCapture();
setChrome(capture);
export { capture };
