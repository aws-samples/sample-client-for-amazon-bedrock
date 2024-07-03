export class AppOptions {
    static get(name: any): any;
    static getAll(kind?: null): any;
    static set(name: any, value: any): void;
    static setAll(options: any): void;
    static remove(name: any): void;
}
export const compatibilityParams: any;
export namespace OptionKind {
    let VIEWER: number;
    let API: number;
    let WORKER: number;
    let PREFERENCE: number;
}
