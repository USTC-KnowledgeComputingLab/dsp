export declare function parse(input: string): string;
export declare function unparse(input: string): string;
export declare class search {
    constructor(limit_size?: number, buffer_size?: number);
    set_limit_size(limit_size: number): void;
    set_buffer_size(buffer_size: number): void;
    reset(): void;
    add(text: string): boolean;
    execute(callback: (candidate: string) => boolean): number;
}
