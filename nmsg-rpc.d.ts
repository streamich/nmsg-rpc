declare module 'nmsg-rpc/util' {
	export function extend<T>(obj1: T, obj2: T, ...objs: T[]): T;

}
declare module 'nmsg-rpc/rpc' {
	export interface ISocket {
	    onmessage: (msg: any) => void;
	    send(msg: any): any;
	}
	export type TeventCallback = (...args: any[]) => void;
	export type TeventCallbackList = TeventCallback[];
	export interface IFrameData {
	    i: number;
	    a?: any[];
	    c?: number[];
	    t?: number;
	}
	export interface IFrameDataInitiation extends IFrameData {
	    e: string;
	}
	export interface IFrameDataResponse extends IFrameData {
	    r: number;
	    f: number;
	}
	export type FrameList = (IFrameDataInitiation | IFrameDataResponse)[];
	export abstract class Frame {
	    static id: number;
	    static getNextId(): number;
	    static timeout: number;
	    data: IFrameDataInitiation | IFrameDataResponse;
	    id: number;
	    event: string;
	    args: any[];
	    callbacks: ((...args: any[]) => void)[];
	    rid: number;
	    func: number;
	    timeout: number;
	    hasCallbacks(): boolean;
	    isResponse(): boolean;
	}
	export class FrameOutgoing extends Frame {
	    static createResponse(request: Frame, cb_pos: number, args: any[]): FrameOutgoing;
	    constructor(args?: any[], event?: string);
	    processResponse(response: FrameIncoming): void;
	    serialize(): IFrameDataInitiation | IFrameDataResponse;
	}
	export class FrameIncoming extends Frame {
	    unserialize(data: any, onCallback: any): void;
	}
	export class Router {
	    latency: number;
	    protected frame: {
	        [id: number]: FrameOutgoing;
	    };
	    protected timer: {
	        [id: number]: any;
	    };
	    send: (data) => void;
	    onerror: (err) => void;
	    onevent: (event: string, args: any[]) => void;
	    api: Api;
	    protected subs: {
	        [event: string]: TeventCallback;
	    };
	    protected genCallack(frame: FrameIncoming, pos: number): (...args: any[]) => void;
	    protected pub(frame: Frame): void;
	    protected sendData(data: any): void;
	    protected dispatch(frame: FrameOutgoing): void;
	    protected processResponse(frame: FrameIncoming): void;
	    setApi(api: Api): this;
	    onmessage(msg: any): void;
	    on(event: string, callback: TeventCallback): this;
	    emit(event: string, ...args: any[]): this;
	}
	export class RouterBuffered extends Router {
	    cycle: number;
	    protected timer: any;
	    protected buffer: FrameList;
	    protected flush(): void;
	    protected sendData(data: any): void;
	    protected startTimer(): void;
	    onmessage(msg: any): void;
	}
	export type TApiList = {
	    [method: string]: (...args: any[]) => void;
	};
	export class Api {
	    protected methods: TApiList;
	    add(list: TApiList): this;
	    get(method: string): (...args: any[]) => void;
	}

}
declare var require: any;
declare var define: any;
declare var module: any;
declare var root: any;
