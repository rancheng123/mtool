
export namespace AgoraWebRTCD {
    export type chennelMode = "communication" | "live-broadcasting"

    export type encryptionMode = "aes-128-xts" | "aes-256-xts"

    export type mode = "meeting" | "share-screen"

    export interface SDKConfig {
        appId: string,
        secret?: string,
        chennelMode?: chennelMode,
        encryptMode?: encryptionMode,
        roomName: string,
        dom: HTMLElement,
        mode?: string,
        disableSubcribe?: boolean,
        videoProfile?: Profile,
        useSideLayout?: boolean,
        localStreamConfig?: {
            audio: boolean,
            video: boolean,
            screen?: boolean
        },
        mediaStream?: MediaStream
    }

    export interface StreamConfig {
        streamID: number,
        video?: boolean,
        audio?: boolean,
        screen?: boolean,
        attributes?: {
            resolution: 'sif' | 'vga' | 'hd720p',
            minFrameRate: number,
            maxFrameRate: number
        },
        cameraId?: string,
        microphoneId?: string
    }

    export type Device = {
        deviceId: string,
        label: string,
        kind: "audioinput" | "videoinput"
    }

    // 用于录制的密钥（Recording Key）。后端应用程序必须集成录制的Recording Key 算法授权用户访问Agora Recording Server。
    export type RecoordingKey = string

    export interface WindowObject {
        windowId: string | number,
        title: string
    }

    export type ClientEventType = "stream-published" | "stream-added" | "stream-removed" | "stream-subscribed" | "peer-leave" | "error" | "message" | 'active-speaker' | "peer-mute-video"

    type Profile = "120P" | "120P_3" | "180P" | "180P_3" | "180P_4" | "240P" | "240P_3" | "240P_4" | "360P" | "360P_3" | "360P_4" | "360P_6" | "360P_7" | "360P_8" | "360P_9" | "360P_10" | "360P_11" | "480P" | "480P_3" | "480P_4" | "480P_6" | "480P_8" | "480P_9" | "720P" | "720P_3" | "720P_5" | "720P_6" | "1080P" | "1080p_2" | "1080P_3" | "1080P_5"

    export type VideoProfile = {
        profile: Profile,
        swapWidthAndHeight: boolean
    }

    export interface ClientEvent {
        uid: string,
        stream: Stream
    }

    export interface Stream {
        audio: boolean,
        streamId: number,
        stream: MediaStream,
        init(onSuccess?: () => void, onFailure?: (err) => void),
        play(elementID: string, assets: string),
        close(): void,
        stop(): void,
        enableAudio(): void,
        disableAudio(): void,
        enableVideo(): void,
        disableVideo(): void,
        getId(): number,
        getAttributes(): any,
        hasVideo(): boolean,
        hasAudio(): boolean,
        setVideoProfile(profile: VideoProfile | Profile),
        setScreenProfile(profile: VideoProfile | Profile),
        setVideoResolution(profile: string),
        setVideoFrameRate(frame: [number, number]),
        setVideoBitRate(bitRate: [number, number]),
        on(clientEvent: ClientEventType, callback: (ClientEvent) => void),
        addEventListener(clientEvent: ClientEventType, callback: (ClientEvent) => void),
        onmessage(e): void,
        videoSize: [number, number, number, number]
    }

    export interface Client {
        init(appid: string, onSucess?: () => void, onFailure?: (err) => void),
        join(chennelKey: string, chennel: string, uid: undefined | number,
            onSuccess?: (uid: number) => void,
            onFailure?: (err) => void): void,
        renewChannelKey(channelKey: string, onSuccess: () => void, onFailure: (err: any) => void),
        setRemoteVideoStreamType(stream: Stream, streamType: string),
        close(): void,
        leave(onSuccess?: () => void, onFailure?: (err) => void): void,
        publish(stream: Stream, onSuccess?: () => void, onFailure?: (err) => void): void,
        publish(stream: Stream, onFailure?: (err) => void): void,
        unpublish(stream: Stream, onSuccess?: () => void, onFailure?: (err) => void): void,
        unpublish(stream: Stream, onFailure?: (err) => void): void,
        subscribe(stream: Stream, onFailure?: (err) => void): void,
        unsubcribe(stream: Stream, onFailure?: (err) => void): void,
        on(clientEvent: ClientEventType, callback?: (ClientEvent) => void),
        addEventListener(clientEvent: ClientEventType, callback: (ClientEvent) => void),
        setClientRol?: any,
        onmessage(e: any): void,
        enableDualStream(ok: any, error: any): void,
        setLowStreamParameter(e: any): void
    }

    export type AgoraRender = {
        view: HTMLElement
        mirrorView: boolean
        container: HTMLElement
        canvas: HTMLCanvasElement
        renderImageCount: number
        initWidth: number
        initHeight: number
        initRotation: number
        canvasUpdated: boolean
        clientWidth: number
        clientHeight: number
    }
}
