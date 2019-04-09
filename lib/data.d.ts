declare class DataUtils {
    static removeFromString(value: string, charsToRemove: any[] | string): string;
    static maskString(value: string, maskChar?: string, leaveLast?: number): string;
    static minifyJson(source: string, asString?: boolean): any;
    static uuid(): string;
}
export = DataUtils;
