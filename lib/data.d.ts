declare class DataUtils {
    static removeFromString(value: string, charsToRemove: any[] | string): string;
    static replaceTags: (text: string, obj: any) => string;
    static maskString(value: string, maskChar?: string, leaveLast?: number): string;
    static minifyJson(source: string, asString?: boolean): any;
    static stripHtml(html: string, tagReplace?: string): string;
    static uuid(): string;
}
export = DataUtils;
