import { DataEmoji } from './DataTypes';
export declare const alphaNumericEmojiIndex: BaseIndex;
declare type BaseIndex = Record<string, Record<string, DataEmoji>>;
export declare function indexEmoji(emoji: DataEmoji): void;
export {};
